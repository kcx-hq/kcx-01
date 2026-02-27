import http from "node:http";
import https from "node:https";

const state = {
  installed: false,
  originals: {
    httpRequest: null,
    httpGet: null,
    httpsRequest: null,
    httpsGet: null,
    fetch: null,
  },
  allowedHosts: new Set(),
};

function toHost(target) {
  if (!target) {
    return "unknown";
  }

  if (typeof target === "string") {
    try {
      return new URL(target).host || "unknown";
    } catch {
      return "unknown";
    }
  }

  if (target instanceof URL) {
    return target.host || "unknown";
  }

  if (typeof target === "object") {
    const host = target.host || target.hostname;
    const port = target.port;

    if (!host) {
      return "unknown";
    }

    return port ? `${host}:${port}` : String(host);
  }

  return "unknown";
}

function assertNetworkAllowed(protocol, target) {
  const host = toHost(target);
  if (state.allowedHosts.has(host)) {
    return;
  }

  throw new Error(`Outbound network blocked in component tests: ${protocol}://${host}`);
}

function blockRequest(protocol, originalRequest) {
  return function blockedRequest(options, ...args) {
    assertNetworkAllowed(protocol, options);
    return originalRequest.call(this, options, ...args);
  };
}

function blockGet(protocol, originalGet) {
  return function blockedGet(options, ...args) {
    assertNetworkAllowed(protocol, options);
    return originalGet.call(this, options, ...args);
  };
}

function blockFetch(originalFetch) {
  return async function blockedFetch(input, init) {
    assertNetworkAllowed("fetch", input);
    if (typeof originalFetch !== "function") {
      throw new Error("fetch is not available in this runtime");
    }
    return originalFetch(input, init);
  };
}

export function installNoNetworkGuard() {
  if (state.installed) {
    return;
  }

  state.originals.httpRequest = http.request;
  state.originals.httpGet = http.get;
  state.originals.httpsRequest = https.request;
  state.originals.httpsGet = https.get;
  state.originals.fetch = globalThis.fetch;

  http.request = blockRequest("http", state.originals.httpRequest);
  http.get = blockGet("http", state.originals.httpGet);
  https.request = blockRequest("https", state.originals.httpsRequest);
  https.get = blockGet("https", state.originals.httpsGet);
  globalThis.fetch = blockFetch(state.originals.fetch);

  state.installed = true;
}

export function restoreNoNetworkGuard() {
  if (!state.installed) {
    return;
  }

  http.request = state.originals.httpRequest;
  http.get = state.originals.httpGet;
  https.request = state.originals.httpsRequest;
  https.get = state.originals.httpsGet;
  globalThis.fetch = state.originals.fetch;

  state.allowedHosts.clear();
  state.installed = false;
}

export function allowNetworkHost(host) {
  if (!host || typeof host !== "string") {
    throw new Error("allowNetworkHost requires a host string");
  }
  state.allowedHosts.add(host.trim());
}

export function resetAllowedNetworkHosts() {
  state.allowedHosts.clear();
}
