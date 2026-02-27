import { beforeEach, describe, expect, it } from "vitest";
import { assertUploadScope } from "../../../src/modules/core-dashboard/utils/uploadScope.service.js";
import {
  createBillingUploadFixture,
  createClientFixture,
  createUserFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("core-dashboard upload scope integration", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("allows upload ids owned by current client", async () => {
    const client = await createClientFixture({
      id: "00000000-0000-4000-8000-00000000d001",
      email: "dashboard-a@example.test",
    });
    const user = await createUserFixture({
      client_id: client.id,
      email: "dashboard-user-a@example.test",
    });
    const uploadA = await createBillingUploadFixture({
      clientid: client.id,
      uploadedby: user.id,
    });
    const uploadB = await createBillingUploadFixture({
      clientid: client.id,
      uploadedby: user.id,
    });

    const scoped = await assertUploadScope({
      clientId: client.id,
      uploadIds: [uploadA.uploadid, uploadB.uploadid],
    });

    expect(scoped).toEqual([uploadA.uploadid, uploadB.uploadid]);
  });

  it("rejects cross-tenant upload ids", async () => {
    const clientA = await createClientFixture({
      id: "00000000-0000-4000-8000-00000000d101",
      email: "dashboard-b@example.test",
    });
    const clientB = await createClientFixture({
      id: "00000000-0000-4000-8000-00000000d102",
      email: "dashboard-c@example.test",
    });

    const userA = await createUserFixture({
      client_id: clientA.id,
      email: "dashboard-user-b@example.test",
    });
    const userB = await createUserFixture({
      client_id: clientB.id,
      email: "dashboard-user-c@example.test",
    });

    await createBillingUploadFixture({
      clientid: clientA.id,
      uploadedby: userA.id,
      uploadid: "00000000-0000-4000-8000-00000000d201",
    });
    const foreignUpload = await createBillingUploadFixture({
      clientid: clientB.id,
      uploadedby: userB.id,
      uploadid: "00000000-0000-4000-8000-00000000d202",
    });

    await expect(
      assertUploadScope({
        clientId: clientA.id,
        uploadIds: [foreignUpload.uploadid],
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "UNAUTHORIZED",
    });
  });
});
