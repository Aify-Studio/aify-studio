import providers from "../../../../shared/ai-provider/providers";
import { ai_model_table, ai_provider_table } from "./schema";

type Database = typeof import(".").db;

export const seedBuiltinAIData = async (database: Database) => {
  const now = new Date();

  // Load providers from JSON files
  const jsonProviders = providers;

  // Combine builtin and JSON providers
  const allProviders = [
    ...jsonProviders.map((p) => ({
      id: p.id,
      name: p.name,
      desc: p.desc ?? null,
      doc: p.doc ?? null,
      type: p.type,
      api: p.api ?? null,
      apiKey: p.apiKey ?? null,
      logo: p.logo ?? null,
      active: p.active ?? false,
    })),
  ];

  await database
    .insert(ai_provider_table)
    .values(
      allProviders.map((provider) => ({
        ...provider,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoNothing({ target: ai_provider_table.id });

  // Combine builtin and JSON models
  const allModels = [
    ...jsonProviders.flatMap((provider) =>
      (provider.models ?? []).map((model) => {
        // Provide default cost if not specified
        const cost = model.cost ?? {
          input: 0,
          output: 0,
        };

        // Ensure limit has input if it exists (some JSON might be missing it)
        const limit = {
          input: model.limit?.input ?? 0,
          output: model.limit?.output ?? 0,
          context: model.limit?.context ?? 0,
        };

        return {
          id: model.id,
          providerId: provider.id,
          name: model.name,
          attachment: model.attachment,
          reasoning: model.reasoning,
          toolCall: model.toolCall,
          structuredOutput: model.structuredOutput ?? null,
          temperature: model.temperature ?? null,
          interleaved: model.interleaved ?? null,
          cost,
          limit,
          modalities: model.modalities,
          active: model.active ?? false,
        };
      })
    ),
  ];

  await database
    .insert(ai_model_table)
    .values(
      allModels.map((model) => ({
        ...model,
        createdAt: now,
        updatedAt: now,
      }))
    )
    .onConflictDoNothing({ target: ai_model_table.id });
};
