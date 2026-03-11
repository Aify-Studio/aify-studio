import { ORPCError, os } from "@orpc/server";
import z from "zod";
import { aiModelSchema, aiProviderSchema } from "../../../shared/ai-provider/ai-provider.schema";
import {
  createAIModel,
  createAIProvider,
  deleteAIModelById,
  deleteAIProviderById,
  getAIModelById,
  getAIModelByIdAndProviderId,
  getAIModelsByProviderId,
  getAIProviderById,
  getAllAIProviders,
  updateAIModelById,
  updateAIProviderById,
} from "./ai-provider.repository";

const createAIProviderInputSchema = aiProviderSchema;

const updateAIProviderInputSchema = createAIProviderInputSchema;

const createAIModelInputSchema = aiModelSchema;

const updateAIModelInputSchema = createAIModelInputSchema;

export const getAllAIProvidersRoute = os.route({ method: "GET", path: "/ai-providers" }).handler(async () => {
  return await getAllAIProviders();
});

export const getAIProviderRoute = os
  .route({ method: "GET", path: "/ai-providers/{id}" })
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input }) => {
    const provider = await getAIProviderById(input.id);

    if (!provider) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI provider with id "${input.id}" not found.`,
      });
    }

    return provider;
  });

export const createAIProviderRoute = os
  .route({ method: "POST", path: "/ai-providers" })
  .input(createAIProviderInputSchema)
  .handler(async ({ input }) => {
    const existing = await getAIProviderById(input.id);
    if (existing) {
      throw new ORPCError("BAD_REQUEST", {
        message: `AI provider with id "${input.id}" already exists.`,
      });
    }

    await createAIProvider(input);

    return { success: true, id: input.id };
  });

export const updateAIProviderRoute = os
  .route({ method: "PUT", path: "/ai-providers/{id}" })
  .input(updateAIProviderInputSchema)
  .handler(async ({ input }) => {
    const existing = await getAIProviderById(input.id);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI provider with id "${input.id}" not found.`,
      });
    }

    const { id, ...values } = input;

    await updateAIProviderById(id, values);

    return { success: true, id };
  });

export const deleteAIProviderRoute = os
  .route({ method: "DELETE", path: "/ai-providers/{id}" })
  .input(z.object({ id: z.string().min(1) }))
  .handler(async ({ input }) => {
    const existing = await getAIProviderById(input.id);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI provider with id "${input.id}" not found.`,
      });
    }

    await deleteAIProviderById(input.id);

    return { success: true, id: input.id };
  });

export const getAllAIModelsRoute = os
  .route({ method: "GET", path: "/ai-providers/{providerId}/models" })
  .input(z.object({ providerId: z.string().min(1) }))
  .handler(async ({ input }) => {
    const provider = await getAIProviderById(input.providerId);
    if (!provider) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI provider with id "${input.providerId}" not found.`,
      });
    }

    return await getAIModelsByProviderId(input.providerId);
  });

export const getAIModelRoute = os
  .route({ method: "GET", path: "/ai-providers/{providerId}/models/{id}" })
  .input(z.object({ providerId: z.string().min(1), id: z.string().min(1) }))
  .handler(async ({ input }) => {
    const provider = await getAIProviderById(input.providerId);
    if (!provider) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI provider with id "${input.providerId}" not found.`,
      });
    }

    const model = await getAIModelByIdAndProviderId(input.id, input.providerId);

    if (!model) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI model with id "${input.id}" not found in provider "${input.providerId}".`,
      });
    }

    return model;
  });

export const createAIModelRoute = os
  .route({ method: "POST", path: "/ai-providers/{providerId}/models" })
  .input(createAIModelInputSchema)
  .handler(async ({ input }) => {
    const existing = await getAIModelById(input.id);
    if (existing) {
      throw new ORPCError("BAD_REQUEST", {
        message: `AI model with id "${input.id}" already exists.`,
      });
    }

    const provider = await getAIProviderById(input.providerId);
    if (!provider) {
      throw new ORPCError("BAD_REQUEST", {
        message: `AI provider with id "${input.providerId}" not found.`,
      });
    }

    await createAIModel(input);

    return { success: true, id: input.id };
  });

export const updateAIModelRoute = os
  .route({ method: "PUT", path: "/ai-providers/{providerId}/models/{id}" })
  .input(updateAIModelInputSchema)
  .handler(async ({ input }) => {
    const provider = await getAIProviderById(input.providerId);
    if (!provider) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI provider with id "${input.providerId}" not found.`,
      });
    }

    const existing = await getAIModelByIdAndProviderId(input.id, input.providerId);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI model with id "${input.id}" not found in provider "${input.providerId}".`,
      });
    }

    const { id, ...values } = input;

    await updateAIModelById(id, values);

    return { success: true, id };
  });

export const deleteAIModelRoute = os
  .route({ method: "DELETE", path: "/ai-providers/{providerId}/models/{id}" })
  .input(z.object({ providerId: z.string().min(1), id: z.string().min(1) }))
  .handler(async ({ input }) => {
    const provider = await getAIProviderById(input.providerId);
    if (!provider) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI provider with id "${input.providerId}" not found.`,
      });
    }

    const existing = await getAIModelByIdAndProviderId(input.id, input.providerId);
    if (!existing) {
      throw new ORPCError("NOT_FOUND", {
        message: `AI model with id "${input.id}" not found in provider "${input.providerId}".`,
      });
    }

    await deleteAIModelById(input.id);

    return { success: true, id: input.id };
  });
