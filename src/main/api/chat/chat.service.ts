import { ORPCError, os, streamToEventIterator, type } from "@orpc/server";
import { convertToModelMessages, createUIMessageStream, generateText, streamText } from "ai";
import { TITLE_PROMPT } from "../infra/ai/prompts";
import { getTitleModel, openAiCompatibleProvider } from "../infra/ai/providers";
import { getTextFromMessage } from "../infra/ai/utils";
import type { MessageModel } from "../infra/db/schema";
import { convertToChatMessages } from "./chat.converter";
import {
  getChatById,
  getMessagesByChatId,
  saveChat,
  saveMessage,
  saveMessages,
  updateChatTitleById,
} from "./chat.repository";
import type { ChatMessage } from "./chat.schema";

export const createChat = os
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
