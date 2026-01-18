import { createChatRoute, getChatMessagesRoute, getChatStreamRoute, listChatsRoute } from "./chat.service";

export const chat = {
  getChatMessages: getChatMessagesRoute,
  getChatStream: getChatStreamRoute,
  create: createChatRoute,
  list: listChatsRoute,
};
