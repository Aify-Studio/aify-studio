import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import { convertToModelMessages, createUIMessageStream, generateText, JsonToSseTransformStream, streamText } from "ai";
import z from "zod";
import { convertToChatMessages } from "@/shared/lib/chat-converter";
import { generateMessageId } from "@/shared/lib/id-utils";
import type { ChatMessage } from "../../../shared/lib/chat.schema";
import { TITLE_PROMPT } from "../infra/ai/prompts";
import { getTitleModel, openAiCompatibleProvider } from "../infra/ai/providers";
import { getTextFromMessage } from "../infra/ai/utils";
import type { ChatModel, MessageModel } from "../infra/db/schema";
import {
  getChatById,
  getMessagesByChatId,
  listChats,
  saveChat,
  saveMessage,
  saveMessages,
  updateChatTitleById,
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
      throw new ORPCError("BAD_REQUEST", {
        message: "chat not found.",
      });
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
  .input(type<{ chatId: string; messages?: ChatMessage[]; message?: ChatMessage }>())
  .handler(async ({ input }) => {
    const { chatId, message } = input;
    if (!message) {
      throw new ORPCError("BAD_REQUEST", {
        message: "message is blank.",
      });
    }

    let previousMessages: MessageModel[] = [];
    let titlePromise: Promise<string> | null = null;

    const chat = await getChatById(chatId);
    if (chat) {
      previousMessages = await getMessagesByChatId(chatId);
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

    const chatMessages = [...convertToChatMessages(previousMessages), message];

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Handle title generation in parallel
        titlePromise?.then((title) => {
          updateChatTitleById(chatId, title);
          writer.write({ type: "data-chat-title", data: title });
        });

        const result = streamText({
          model: openAiCompatibleProvider("qwen-plus"),
          // system: "You are a helpful assistant.",
          messages: await convertToModelMessages(chatMessages),
        });

        // consume the stream to ensure it runs to completion & triggers onFinish
        // even when the client response is aborted:
        result.consumeStream();

        writer.merge(result.toUIMessageStream());
      },
      generateId: generateMessageId,
      onFinish: async ({ messages: finishedMessages }) => {
        await saveMessages(
          finishedMessages.map((currentMessage) => ({
            id: currentMessage.id,
            chatId,
            role: currentMessage.role,
            parts: currentMessage.parts,
            createdAt: new Date(),
          }))
        );
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    return streamToEventIterator(stream);
  });

export async function generateChatTitle(message: ChatMessage) {
  const { text: title } = await generateText({
    model: getTitleModel(),
    system: TITLE_PROMPT,
    prompt: getTextFromMessage(message),
  });

  return title;
}
