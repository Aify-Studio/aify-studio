import type { UIMessagePart } from "ai";
import { formatISO } from "date-fns";
import type { MessageModel } from "../infra/db/schema";
import type { ChatDataPart, ChatMessage, ChatTools } from "./chat.schema";

export function convertToChatMessages(messages: MessageModel[]): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role as "system" | "user" | "assistant",
    parts: message.parts as UIMessagePart<ChatDataPart, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}
