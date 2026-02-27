import { generateJWT } from "../../src/utils/jwt.js";
import { createBearerAuthHeader } from "./http.js";
import {
  deterministicUuid,
  createUserFixture,
} from "./factories.js";

export function createAccessTokenForUser(user) {
  return generateJWT({
    id: user.id,
    role: user.role,
    client_id: user.client_id,
  });
}

export async function createAuthIdentity(options = {}) {
  const {
    client = {},
    user = {},
    role = "USER",
    password = "Password!123",
    isVerified = true,
  } = options;

  const clientId = client.id || deterministicUuid();
  const seededClient = {
    id: clientId,
    name: client.name || "Test Client",
    email: client.email || `client-${clientId.slice(-6)}@example.test`,
  };

  const seededUser = await createUserFixture({
    client_id: clientId,
    role,
    is_verified: isVerified,
    password_hash: password,
    ...user,
  });

  const token = createAccessTokenForUser(seededUser);
  const authHeaders = createBearerAuthHeader(token);

  return {
    client: seededClient,
    user: seededUser,
    token,
    authHeaders,
    password,
  };
}
