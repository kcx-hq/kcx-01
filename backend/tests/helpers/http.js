import request from "supertest";

function mergeHeaders(defaultHeaders, requestHeaders) {
  return {
    ...defaultHeaders,
    ...(requestHeaders ?? {}),
  };
}

function applyRequestOptions(target, options = {}) {
  const requestWithHeaders = options.headers ? target.set(options.headers) : target;
  const requestWithQuery = options.query ? requestWithHeaders.query(options.query) : requestWithHeaders;

  if (typeof options.body !== "undefined") {
    return requestWithQuery.send(options.body);
  }

  return requestWithQuery;
}

export function createBearerAuthHeader(token) {
  if (!token || typeof token !== "string") {
    throw new Error("A non-empty bearer token is required.");
  }

  return { Authorization: `Bearer ${token}` };
}

export function createHttpClient(app, options = {}) {
  const defaultHeaders = options.defaultHeaders ?? {};
  const agent = request.agent(app);

  const invoke = (method, url, requestOptions = {}) =>
    applyRequestOptions(agent[method](url), {
      ...requestOptions,
      headers: mergeHeaders(defaultHeaders, requestOptions.headers),
    });

  return {
    agent,
    request: (method, url, requestOptions = {}) => invoke(method, url, requestOptions),
    get: (url, requestOptions = {}) => invoke("get", url, requestOptions),
    post: (url, requestOptions = {}) => invoke("post", url, requestOptions),
    put: (url, requestOptions = {}) => invoke("put", url, requestOptions),
    patch: (url, requestOptions = {}) => invoke("patch", url, requestOptions),
    delete: (url, requestOptions = {}) => invoke("delete", url, requestOptions),
  };
}
