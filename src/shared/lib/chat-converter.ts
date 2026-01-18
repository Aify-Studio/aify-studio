import type { UIMessagePart } from "ai";
import { formatISO } from "date-fns";
import type { MessageModel } from "../../main/api/infra/db/schema";
import type { ChatDataPart, ChatMessage, ChatTools } from "./chat.schema";

export function convertToChatMessages(messages?: MessageModel[]): ChatMessage[] | undefined {
  if (!messages?.length) {
    return;
  }

  return messages.map((message) => ({
    id: message.id,
    role: message.role as "system" | "user" | "assistant",
    parts: message.parts as UIMessagePart<ChatDataPart, ChatTools>[],
    metadata: {
      createdAt: formatISO(message.createdAt),
    },
  }));
}
