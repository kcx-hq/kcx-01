import type { Capabilities } from "../../../../services/apiClient";

export const isModuleEnabled = (caps: Capabilities | null | undefined, key: string) =>
  caps?.modules?.[key]?.enabled === true;

export const hasEndpoint = (caps: Capabilities | null | undefined, module: string, endpoint: string) =>
  !!caps?.modules?.[module]?.endpoints?.[endpoint];
