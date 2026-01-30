export const isModuleEnabled = (caps, key) =>
  caps?.modules?.[key]?.enabled === true;

export const hasEndpoint = (caps, module, endpoint) =>
  !!caps?.modules?.[module]?.endpoints?.[endpoint];
