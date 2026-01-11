import "dotenv/config";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const openAiCompatibleProvider = createOpenAICompatible({
  name: "open-ai-compatible",
  apiKey: process.env.PROVIDER_API_KEY,
  baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  includeUsage: true,
});

export function getTitleModel() {
  return openAiCompatibleProvider("qwen-plus");
}
