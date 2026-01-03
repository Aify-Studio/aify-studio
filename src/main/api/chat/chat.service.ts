import { os, streamToEventIterator, type } from "@orpc/server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { openAiCompatibleProvider } from "../infra/ai/providers";

export const createChat = os
  .route({ method: "POST", path: "/chat" })
  .input(type<{ chatId: string; messages: UIMessage[] }>())
  .handler(async ({ input }) => {
    const { messages } = input;

    const result = streamText({
      model: openAiCompatibleProvider("qwen-plus"),
      system: "You are a helpful assistant.",
      messages: await convertToModelMessages(messages),
    });

    return streamToEventIterator(result.toUIMessageStream());
  });
