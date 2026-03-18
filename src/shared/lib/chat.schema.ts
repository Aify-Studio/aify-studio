import type { InferUITools, ToolSet, UIMessage } from "ai";
import z from "zod";
import { bashTool } from "@/shared/tools/bash";
import { readTool } from "@/shared/tools/read";
import { writeTool } from "@/shared/tools/write";

export const metadataSchema = z.object({
  createdAt: z.string(),
});

export type ChatMetadata = z.infer<typeof metadataSchema>;

export const dataPartSchema = z.object({});

export type ChatDataPart = z.infer<typeof dataPartSchema>;

const tools = {
  bash: bashTool,
  read: readTool,
  write: writeTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<ChatMetadata, ChatDataPart, ChatTools>;
