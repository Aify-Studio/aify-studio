import type { InferUITools, ToolSet, UIMessage } from "ai";
import z from "zod";
import { askForConfirmationTool, getLocationTool, getWeatherInformationTool } from "@/shared/tools";

export const metadataSchema = z.object({
  createdAt: z.string(),
});

export type ChatMetadata = z.infer<typeof metadataSchema>;

export const dataPartSchema = z.object({});

export type ChatDataPart = z.infer<typeof dataPartSchema>;

const tools = {
  // server-side tool with execute function:
  getWeatherInformation: getWeatherInformationTool,
  // client-side tool that starts user interaction:
  askForConfirmation: askForConfirmationTool,
  // client-side tool that is automatically executed on the client:
  getLocation: getLocationTool,
} satisfies ToolSet;

export type ChatTools = InferUITools<typeof tools>;

export type ChatMessage = UIMessage<ChatMetadata, ChatDataPart, ChatTools>;
