import z from "zod";

export const aiProviderSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  desc: z.string().nullish(),
  doc: z.string().nullish(),
  type: z.string().min(1),
  api: z.string().nullish(),
  apiKey: z.string().nullish(),
  logo: z.string().nullish(),
  active: z.boolean().optional().default(false),
});

export type AIProviderSchema = z.infer<typeof aiProviderSchema>;

export const aiModelCostSchema = z.object({
  input: z.number().nullish(),
  output: z.number().nullish(),
  reasoning: z.number().nullish(),
  cache_read: z.number().nullish(),
  cache_write: z.number().nullish(),
  input_audio: z.number().nullish(),
  output_audio: z.number().nullish(),
});

export type AIModelCostSchema = z.infer<typeof aiModelCostSchema>;

export const aiModelLimitSchema = z.object({
  context: z.number().nullish(),
  input: z.number().nullish(),
  output: z.number().nullish(),
});

export type AIModelLimitSchema = z.infer<typeof aiModelLimitSchema>;

export const aiModelModalitiesSchema = z.object({
  input: z.array(z.string()),
  output: z.array(z.string()),
});

export type AIModelModalitiesSchema = z.infer<typeof aiModelModalitiesSchema>;

export const aiModelSchema = z.object({
  id: z.string().min(1),
  providerId: z.string().min(1),
  name: z.string().min(1),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  toolCall: z.boolean(),
  structuredOutput: z.boolean().optional(),
  temperature: z.boolean().optional(),
  interleaved: z.enum(["reasoning_content", "reasoning_details"]).optional(),
  cost: aiModelCostSchema.nullish(),
  limit: aiModelLimitSchema.nullish(),
  modalities: aiModelModalitiesSchema,
  active: z.boolean().nullish().default(false),
});

export type AIModelSchema = z.infer<typeof aiModelSchema>;

export const aiProviderWithModelsSchema = aiProviderSchema.extend({
  models: z.array(aiModelSchema).nullish(),
});

export type AIProviderWithModelsSchema = z.infer<typeof aiProviderWithModelsSchema>;
