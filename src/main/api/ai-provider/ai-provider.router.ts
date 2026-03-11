import {
  createAIModelRoute,
  createAIProviderRoute,
  deleteAIModelRoute,
  deleteAIProviderRoute,
  getAIModelRoute,
  getAIProviderRoute,
  getAllAIModelsRoute,
  getAllAIProvidersRoute,
  updateAIModelRoute,
  updateAIProviderRoute,
} from "./ai-provider.service";

export const aiProvider = {
  list: getAllAIProvidersRoute,
  get: getAIProviderRoute,
  create: createAIProviderRoute,
  update: updateAIProviderRoute,
  delete: deleteAIProviderRoute,
  model: {
    list: getAllAIModelsRoute,
    get: getAIModelRoute,
    create: createAIModelRoute,
    update: updateAIModelRoute,
    delete: deleteAIModelRoute,
  },
};
