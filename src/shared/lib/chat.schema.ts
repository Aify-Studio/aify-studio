import type { UIMessage } from "ai";
import z from "zod";
import type { BashToolType } from "@/shared/tools/bash";
import type { ReadToolType } from "@/shared/tools/read";
import type { SubagentToolType } from "@/shared/tools/subagent";
import type { TaskCreateToolType, TaskGetToolType, TaskListToolType, TaskUpdateToolType } from "@/shared/tools/task";
import type { WriteToolType } from "@/shared/tools/write";

export const metadataSchema = z.object({
  createdAt: z.string(),
});

export type ChatMetadata = z.infer<typeof metadataSchema>;

export const dataPartSchema = z.object({});

export type ChatDataPart = z.infer<typeof dataPartSchema>;

export interface ChatTools {
  bash: BashToolType;
  read: ReadToolType;
  write: WriteToolType;
  subagent: SubagentToolType;
  task_create: TaskCreateToolType;
  task_get: TaskGetToolType;
  task_list: TaskListToolType;
  task_update: TaskUpdateToolType;
}

export type ChatMessage = UIMessage<ChatMetadata, ChatDataPart, ChatTools>;
