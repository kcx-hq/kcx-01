import { beforeEach, describe, expect, it } from "vitest";
import { Inquiry } from "../../../src/models/index.js";
import {
  createOrUpdatePendingInquiry,
  rejectInquiryByToken,
} from "../../../src/modules/shared/inquiry/inquiry.workflow.service.js";
import {
  createInquiryFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("inquiry advanced integration", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("is idempotent for repeated pending inquiry command payload", async () => {
    const payload = {
      name: "Platform Team",
      email: "platform@example.test",
      message: "Need advisory",
      preferred_datetime: new Date("2026-07-12T10:00:00.000Z"),
      timezone: "UTC",
      action_token: "token-1",
    };

    const first = await createOrUpdatePendingInquiry(payload);
    const second = await createOrUpdatePendingInquiry({
      ...payload,
      message: "Need advisory updated",
      action_token: "token-2",
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.inquiry.id).toBe(first.inquiry.id);
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
    await expect(Inquiry.count({ where: { email: payload.email } })).resolves.toBe(1);
  });

  it("keeps row unchanged on invalid workflow transition", async () => {
    const inquiry = await createInquiryFixture({
      status: "ACCEPTED",
      action_token: "locked-token",
      meet_link: "https://meet.example.test/existing",
    });

    await expect(
      rejectInquiryByToken({
        id: inquiry.id,
        token: "locked-token",
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "CONFLICT",
    });

    const reloaded = await Inquiry.findByPk(inquiry.id);
    expect(reloaded.status).toBe("ACCEPTED");
    expect(reloaded.meet_link).toBe("https://meet.example.test/existing");
    expect(reloaded.action_token).toBe("locked-token");
  });
});
