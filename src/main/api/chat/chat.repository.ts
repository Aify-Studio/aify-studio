import { and, asc, desc, eq, gt, lt } from "drizzle-orm";
import { db } from "../infra/db";
import { chat_table, type MessageModel, message_table } from "../infra/db/schema";

export async function listChats({
  cursor,
  limit,
  direction = "desc",
}: {
  cursor?: string;
  limit?: number;
  direction?: "asc" | "desc";
}) {
  const isDesc = direction === "desc";
  const whereConditions = cursor ? [isDesc ? lt(chat_table.id, cursor) : gt(chat_table.id, cursor)] : [];

  const chats = await db
    .select()
    .from(chat_table)
    .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
    .orderBy(isDesc ? desc(chat_table.createdAt) : asc(chat_table.createdAt))
    .limit(limit ?? 20);

  return {
    chats,
  };
}

export async function saveChat({ id, title }: { id: string; title: string }) {
  return await db.insert(chat_table).values({
    id,
    createdAt: new Date(),
    title,
  });
}

export async function updateChatTitleById(chatId: string, title: string) {
  return await db.update(chat_table).set({ title }).where(eq(chat_table.id, chatId));
}

export async function getChatById(chatId: string) {
  const [chat] = await db.select().from(chat_table).where(eq(chat_table.id, chatId)).limit(1);
  if (!chat) {
    return null;
  }

  return chat;
}

export async function getMessagesByChatId(chatId: string): Promise<MessageModel[]> {
  return await db
    .select()
    .from(message_table)
    .where(eq(message_table.chatId, chatId))
    .orderBy(asc(message_table.createdAt));
}

export async function saveMessage(message: MessageModel) {
  return await db.insert(message_table).values(message);
}

export async function saveMessages(messages: MessageModel[]) {
  return await db.insert(message_table).values(messages);
}
