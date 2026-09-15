import "i18next";

import type { resources } from "./index";

// Makes `t('namespace:key')` type-checked against the English files.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: (typeof resources)["en"];
  }
}
