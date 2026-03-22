import type { UIMessage } from "ai";
import z from "zod";
import type { BashToolType } from "@/shared/tools/bash";
import type { ReadToolType } from "@/shared/tools/read";
import type { TaskToolType } from "@/shared/tools/task";
import type { WriteToolType } from "@/shared/tools/write";

export const metadataSchema = z.object({
  createdAt: z.string(),
});

export type ChatMetadata = z.infer<typeof metadataSchema>;

export const dataPartSchema = z.object({});

export type ChatDataPart = z.infer<typeof dataPartSchema>;

export type ChatTools = {
  bash: BashToolType;
  read: ReadToolType;
  task: TaskToolType;
  write: WriteToolType;
};

export type ChatMessage = UIMessage<ChatMetadata, ChatDataPart, ChatTools>;
