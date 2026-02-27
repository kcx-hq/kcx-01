import { generateJWT } from "../../src/utils/jwt.js";
import { createBearerAuthHeader } from "./http.js";
import {
  createClientFixture,
  createUserFixture,
} from "./factories.js";

async function createTenantIdentity({
  client,
  user,
  role = "USER",
}) {
  const seededClient = await createClientFixture(client);
  const seededUser = await createUserFixture({
    client_id: seededClient.id,
    role,
    is_verified: true,
    ...user,
  });

  const token = generateJWT({
    id: seededUser.id,
    role: seededUser.role,
    client_id: seededClient.id,
  });

  return {
    client: seededClient,
    user: seededUser,
    token,
    authHeaders: createBearerAuthHeader(token),
  };
}

export async function createTwoTenantScenario(options = {}) {
  const tenantA = await createTenantIdentity({
    role: options.tenantARole || "USER",
    client: {
      name: "Tenant A",
      email: "tenant-a@example.test",
      ...(options.tenantAClient || {}),
    },
    user: {
      email: "tenant-a-user@example.test",
      ...(options.tenantAUser || {}),
    },
  });

  const tenantB = await createTenantIdentity({
    role: options.tenantBRole || "USER",
    client: {
      name: "Tenant B",
      email: "tenant-b@example.test",
      ...(options.tenantBClient || {}),
    },
    user: {
      email: "tenant-b-user@example.test",
      ...(options.tenantBUser || {}),
    },
  });

  return {
    tenantA,
    tenantB,
  };
}
