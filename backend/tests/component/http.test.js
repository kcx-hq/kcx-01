import { beforeEach, describe, expect, it, vi } from "vitest";

const methodCalls = [];
const { agentMock, requestAgentMock } = vi.hoisted(() => {
  const agent = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };

  return {
    agentMock: agent,
    requestAgentMock: vi.fn(() => agent),
  };
});

function buildRequestChain(method, url) {
  const chain = {
    set: vi.fn(),
    query: vi.fn(),
    send: vi.fn(),
  };

  chain.set.mockImplementation((headers) => {
    methodCalls.push({ method, url, stage: "set", payload: headers });
    return chain;
  });

  chain.query.mockImplementation((query) => {
    methodCalls.push({ method, url, stage: "query", payload: query });
    return chain;
  });

  chain.send.mockImplementation((body) => {
    methodCalls.push({ method, url, stage: "send", payload: body });
    return Promise.resolve({ ok: true, method, url, body });
  });

  return chain;
}

vi.mock("supertest", () => ({
  default: {
    agent: requestAgentMock,
  },
}));

import { createHttpClient } from "../helpers/http.js";

describe("component http helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    methodCalls.length = 0;

    agentMock.get.mockImplementation((url) => buildRequestChain("get", url));
    agentMock.post.mockImplementation((url) => buildRequestChain("post", url));
    agentMock.put.mockImplementation((url) => buildRequestChain("put", url));
    agentMock.patch.mockImplementation((url) => buildRequestChain("patch", url));
    agentMock.delete.mockImplementation((url) => buildRequestChain("delete", url));
  });

  it("merges default and request headers while applying query and body", async () => {
    const client = createHttpClient({}, {
      defaultHeaders: {
        "x-trace-id": "trace-123",
      },
    });

    const response = await client.post("/api/test", {
      headers: {
        authorization: "Bearer token-1",
      },
      query: {
        page: 2,
      },
      body: {
        hello: "world",
      },
    });

    expect(requestAgentMock).toHaveBeenCalledTimes(1);
    expect(agentMock.post).toHaveBeenCalledWith("/api/test");
    expect(methodCalls).toContainEqual({
      method: "post",
      url: "/api/test",
      stage: "set",
      payload: {
        "x-trace-id": "trace-123",
        authorization: "Bearer token-1",
      },
    });
    expect(methodCalls).toContainEqual({
      method: "post",
      url: "/api/test",
      stage: "query",
      payload: { page: 2 },
    });
    expect(methodCalls).toContainEqual({
      method: "post",
      url: "/api/test",
      stage: "send",
      payload: { hello: "world" },
    });
    expect(response).toEqual({
      ok: true,
      method: "post",
      url: "/api/test",
      body: { hello: "world" },
    });
  });

  it("executes requests without body by skipping send", async () => {
    const client = createHttpClient({});
    const requestChain = buildRequestChain("get", "/ping");

    requestChain.send.mockClear();
    requestChain.query.mockClear();

    agentMock.get.mockImplementationOnce(() => requestChain);

    const response = client.get("/ping");

    expect(agentMock.get).toHaveBeenCalledWith("/ping");
    expect(requestChain.send).not.toHaveBeenCalled();
    expect(response).toBe(requestChain);
  });
});
