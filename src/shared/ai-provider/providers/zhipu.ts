import type { AIProviderWithModelsSchema } from "../ai-provider.schema";

const provider: AIProviderWithModelsSchema = {
  id: "ZhiPuAI",
  name: "Zhipu AI",
  type: "openai/completions",
  doc: "https://docs.z.ai/guides/overview/pricing",
  api: "https://open.bigmodel.cn/api/paas/v4",
  active: false,
  models: [
    {
      id: "GLM-4.7",
      providerId: "ZhiPuAI",
      name: "GLM-4.7",
      attachment: false,
      reasoning: true,
      toolCall: true,
      structuredOutput: true,
      temperature: true,
      interleaved: "reasoning_content",
      limit: {
        context: 204_800,
        output: 131_072,
      },
      modalities: {
        input: ["text"],
        output: ["text"],
      },
      active: false,
    },
  ],
};

export default provider;
