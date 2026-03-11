import { aiProvider } from "./ai-provider/ai-provider.router";
import { chat } from "./chat/chat.router";
import { health } from "./health/health.router";
import { settings } from "./settings/settings.router";

export const router = {
  health,
  chat,
  aiProvider,
  settings,
};
