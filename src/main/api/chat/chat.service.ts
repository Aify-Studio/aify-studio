import { homedir } from "node:os";
import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import {
  convertToModelMessages,
  createUIMessageStream,
  generateText,
  JsonToSseTransformStream,
  stepCountIs,
  streamText,
} from "ai";
import z from "zod";
import type { AgentContext } from "@/shared/agent/context";
import { createChromeDevtoolsMcpClient } from "@/shared/agent/mcp";
import { generateMessageId } from "@/shared/lib/id-utils";
import { createBashTool } from "@/shared/tools/bash";
import { readTool } from "@/shared/tools/read";
import { writeTool } from "@/shared/tools/write";
import type { ChatMessage } from "../../../shared/lib/chat.schema";
import { TITLE_PROMPT } from "../infra/ai/prompts";
import { getChatModel, getTitleModel } from "../infra/ai/providers";
import { getTextFromMessage } from "../infra/ai/utils";
import type { ChatModel } from "../infra/db/schema";
import {
  getChatById,
  getMessagesByChatId,
  listChats,
  saveChat,
  saveMessage,
  updateChatTitleById,
  updateMessage,
} from "./chat.repository";

export const listChatsRoute = os
  .route({ method: "GET", path: "/chats" })
  .input(type<{ cursor?: string; limit?: number; direction?: "asc" | "desc" }>())
  .handler(async ({ input }) => {
    const { cursor, limit, direction } = input;
    return await listChats({
      cursor,
      limit,
      direction,
    });
  });

export const getChatMessagesRoute = os
  .route({ method: "GET", path: "/chat/{chatId}" })
  .input(z.object({ chatId: z.string() }))
  .handler(async ({ input }) => {
    const { chatId } = input;

    let chat: ChatModel | null;

    try {
      chat = await getChatById(chatId);
    } catch {
      throw new ORPCError("BAD_REQUEST", {
        message: "chat not found.",
      });
    }

    if (!chat) {
      return [];
    }

    return await getMessagesByChatId(chat.id);
  });

export const getChatStreamRoute = os
  .route({ method: "GET", path: "/chat/{chatId}/stream" })
  .input(z.object({ chatId: z.string() }))
  .handler(async ({ input }) => {
    const { chatId } = input;

    let chat: ChatModel | null;

    try {
      chat = await getChatById(chatId);
    } catch {
      throw new ORPCError("BAD_REQUEST", {
        message: "chat not found.",
      });
    }

    if (!chat) {
      throw new ORPCError("BAD_REQUEST", {
        message: "chat not found.",
      });
    }

    const previousMessages = await getMessagesByChatId(chat.id);
    const mostRecentMessage = previousMessages.at(-1);

    const restoredStream = createUIMessageStream<ChatMessage>({
      execute: ({ writer }) => {
        writer.write({
          type: "data-appendMessage",
          data: JSON.stringify(mostRecentMessage),
          transient: true,
        });
      },
    });

    return streamToEventIterator(restoredStream.pipeThrough(new JsonToSseTransformStream()));
  });

export const createChatRoute = os
  .route({ method: "POST", path: "/chat" })
  .input(type<{ chatId: string; messages?: ChatMessage[] }>())
  .handler(async ({ input }) => {
    const { chatId, messages } = input;
    if (!messages?.length) {
      throw new ORPCError("BAD_REQUEST", {
        message: "message is blank.",
      });
    }

    let titlePromise: Promise<string> | null = null;

    const message = messages.at(-1);
    const chat = await getChatById(chatId);
    if (chat) {
    } else if (message?.role === "user") {
      await saveChat({ id: chatId, title: "New chat" });

      // Start title generation in parallel (don't await)
      titlePromise = generateChatTitle(message);
    }

    // Only save user messages to the database (not tool approval responses)
    if (message?.role === "user") {
      await saveMessage({
        id: message.id,
        chatId,
        role: "user",
        parts: message.parts,
        createdAt: new Date(),
      });
    }

    const chatMessages = [...messages];

    const agentContext: AgentContext = {
      workdir: homedir(),
    };

    const stream = createUIMessageStream({
      originalMessages: chatMessages,
      execute: async ({ writer }) => {
        // Handle title generation in parallel
        titlePromise?.then((title) => {
          updateChatTitleById(chatId, title);
          writer.write({ type: "data-chat-title", data: title });
        });

        const chatModel = await getChatModel();

        const chromeDevtoolsMcpClient = await createChromeDevtoolsMcpClient();
        const chromeDevtoolMcpTools = await chromeDevtoolsMcpClient.tools();
        const mcpTools: Record<string, any> = {
          ...chromeDevtoolMcpTools,
        };

        const result = streamText({
          model: chatModel,
          // system: "You are a helpful assistant.",
          messages: await convertToModelMessages(chatMessages),
          tools: {
            bash: createBashTool({ context: agentContext }),
            read: readTool,
            write: writeTool,
            ...mcpTools,
          },
          stopWhen: stepCountIs(20),
          experimental_context: agentContext,
          onAbort: (e) => {
            console.log(`streamText aborted, chatId: ${chatId}.`, e);
          },
          onError: (e) => {
            console.log(`streamText error, chatId: ${chatId}.`, e);
          },
          onFinish: async () => {
            await chromeDevtoolsMcpClient.close();
          },
        });

        // consume the stream to ensure it runs to completion & triggers onFinish
        // even when the client response is aborted:
        result.consumeStream();

        writer.merge(result.toUIMessageStream());
      },
      generateId: generateMessageId,
      onFinish: async ({ messages: finishedMessages }) => {
        for (const finishedMsg of finishedMessages) {
          if (!finishedMsg.parts.length) {
            continue;
          }

          const existingMsg = chatMessages.find((m) => m.id === finishedMsg.id);
          if (existingMsg) {
            await updateMessage(finishedMsg.id, finishedMsg.parts);
            continue;
          }

          await saveMessage({
            id: finishedMsg.id,
            chatId,
            role: finishedMsg.role,
            parts: finishedMsg.parts,
            createdAt: new Date(),
          });
        }
      },
      onError: (e) => {
        console.log(`createUIMessageStream error, chatId: ${chatId}.`, e);
        if (e == null) {
          return "unknown error";
        }

        if (typeof e === "string") {
          return e;
        }

        if (e instanceof Error) {
          return e.message;
        }

        return JSON.stringify(e);
        // return "Oops, an error occurred!";
      },
    });

    return streamToEventIterator(stream);
  });

export async function generateChatTitle(message: ChatMessage) {
  const titleModel = await getTitleModel();
  const { text: title } = await generateText({
    model: titleModel,
    system: TITLE_PROMPT,
    prompt: getTextFromMessage(message),
  });

  return title;
}
