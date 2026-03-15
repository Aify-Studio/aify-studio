import "dotenv/config";
import { devToolsMiddleware } from "@ai-sdk/devtools";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { wrapLanguageModel } from "ai";

export const openAiCompatibleProvider = createOpenAICompatible({
  name: "open-ai-compatible",
  apiKey: process.env.PROVIDER_API_KEY,
  baseURL: "https://open.bigmodel.cn/api/paas/v4",
  includeUsage: true,
});

export function getChatModel() {
  return wrapLanguageModel({
    model: openAiCompatibleProvider("glm-4.7"),
    middleware: devToolsMiddleware(),
  });
}

export function getTitleModel() {
  return openAiCompatibleProvider("glm-4.7");
}
