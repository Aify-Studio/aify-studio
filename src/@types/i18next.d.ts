import type { defaultNS, resources } from "../renderer/i18n/index";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en-US"];
  }
}
