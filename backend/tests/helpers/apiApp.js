import { vi } from "vitest";
import { createHttpClient } from "./http.js";

export async function createApiClient(options = {}) {
  const { appDeps = {}, defaultHeaders = {}, mocks = [] } = options;

  vi.resetModules();
  vi.clearAllMocks();

  for (const mock of mocks) {
    vi.doMock(mock.path, mock.factory);
  }

  const { createApp } = await import("../../src/app.js");
  const app = createApp(appDeps);
  return createHttpClient(app, { defaultHeaders });
}
