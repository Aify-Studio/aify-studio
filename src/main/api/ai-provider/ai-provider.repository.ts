import { and, eq } from "drizzle-orm";
import { db } from "../infra/db";
import { ai_model_table, ai_provider_table } from "../infra/db/schema";

interface AIModelCost {
  input: number;
  output: number;
  reasoning?: number;
  cache_read?: number;
  cache_write?: number;
  input_audio?: number;
  output_audio?: number;
}

interface AIModelLimit {
  context: number;
  input: number;
  output: number;
}

interface AIModelModalities {
  input: string[];
  output: string[];
}

export async function getAllAIProviders() {
  return await db.select().from(ai_provider_table);
}

export async function getAIProviderById(id: string) {
  const [provider] = await db.select().from(ai_provider_table).where(eq(ai_provider_table.id, id)).limit(1);

  return provider ?? null;
}

export async function createAIProvider({
  id,
  name,
  desc,
  doc,
  type,
  api,
  apiKey,
  logo,
  active,
}: {
  id: string;
  name: string;
  desc?: string | null;
  doc?: string | null;
  type: string;
  api?: string | null;
  apiKey?: string | null;
  logo?: string | null;
  active?: boolean;
}) {
  const now = new Date();

  return await db.insert(ai_provider_table).values({
    id,
    name,
    desc,
    doc,
    type,
    api,
    apiKey,
    logo,
    active: active ?? true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAIProviderById(
  id: string,
  values: {
    name?: string;
    desc?: string | null;
    doc?: string | null;
    type?: string;
    api?: string | null;
    apiKey?: string | null;
    logo?: string | null;
    active?: boolean;
  }
) {
  return await db
    .update(ai_provider_table)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(ai_provider_table.id, id));
}

export async function deleteAIProviderById(id: string) {
  return await db.delete(ai_provider_table).where(eq(ai_provider_table.id, id));
}

export async function getAllAIModels() {
  return await db.select().from(ai_model_table);
}

export async function getAIModelsByProviderId(providerId: string) {
  return await db.select().from(ai_model_table).where(eq(ai_model_table.providerId, providerId));
}

export async function getAIModelById(id: string) {
  const [model] = await db.select().from(ai_model_table).where(eq(ai_model_table.id, id)).limit(1);

  return model ?? null;
}

export async function getAIModelByIdAndProviderId(id: string, providerId: string) {
  const [model] = await db
    .select()
    .from(ai_model_table)
    .where(and(eq(ai_model_table.id, id), eq(ai_model_table.providerId, providerId)))
    .limit(1);

  return model ?? null;
}

export async function createAIModel({
  id,
  providerId,
  name,
  attachment,
  reasoning,
  toolCall,
  structuredOutput,
  temperature,
  interleaved,
  cost,
  limit,
  modalities,
  active,
}: {
  id: string;
  providerId: string;
  name: string;
  attachment: boolean;
  reasoning: boolean;
  toolCall: boolean;
  structuredOutput?: boolean;
  temperature?: boolean;
  interleaved?: "reasoning_content" | "reasoning_details";
  cost: AIModelCost;
  limit: AIModelLimit;
  modalities: AIModelModalities;
  active?: boolean;
}) {
  const now = new Date();

  return await db.insert(ai_model_table).values({
    id,
    providerId,
    name,
    attachment,
    reasoning,
    toolCall,
    structuredOutput,
    temperature,
    interleaved,
    cost,
    limit,
    modalities,
    active: active ?? true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateAIModelById(
  id: string,
  values: {
    providerId?: string;
    name?: string;
    attachment?: boolean;
    reasoning?: boolean;
    toolCall?: boolean;
    structuredOutput?: boolean;
    temperature?: boolean;
    interleaved?: "reasoning_content" | "reasoning_details";
    cost?: AIModelCost;
    limit?: AIModelLimit;
    modalities?: AIModelModalities;
    active?: boolean;
  }
) {
  return await db
    .update(ai_model_table)
    .set({
      ...values,
      updatedAt: new Date(),
    })
    .where(eq(ai_model_table.id, id));
}

export async function deleteAIModelById(id: string) {
  return await db.delete(ai_model_table).where(eq(ai_model_table.id, id));
}
