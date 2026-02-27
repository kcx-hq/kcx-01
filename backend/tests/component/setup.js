import { afterAll, afterEach, beforeAll } from "vitest";
import {
  installNoNetworkGuard,
  resetAllowedNetworkHosts,
  restoreNoNetworkGuard,
} from "./_helpers/noNetwork.js";

beforeAll(() => {
  installNoNetworkGuard();
});

afterEach(() => {
  resetAllowedNetworkHosts();
});

afterAll(() => {
  restoreNoNetworkGuard();
});
