import "dotenv/config";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const openAiCompatibleProvider = createOpenAICompatible({
  name: "open-ai-compatible",
  apiKey: process.env.PROVIDER_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  includeUsage: true,
});

export function getChatModel() {
  return openAiCompatibleProvider("glm-4.7");
}

export function getTitleModel() {
  return openAiCompatibleProvider("glm-4.7");
}
