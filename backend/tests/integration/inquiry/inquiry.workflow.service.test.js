import { beforeEach, describe, expect, it } from "vitest";
import { Inquiry } from "../../../src/models/index.js";
import {
  acceptInquiryByToken,
  createInquiryRecord,
  createOrUpdatePendingInquiry,
  listInquiries,
  rejectInquiryByToken,
} from "../../../src/modules/shared/inquiry/inquiry.workflow.service.js";
import {
  createInquiryFixture,
  resetFactoryState,
} from "../../helpers/factories.js";

describe("inquiry workflow integration", () => {
  beforeEach(() => {
    resetFactoryState();
  });

  it("creates inquiry rows with pending status", async () => {
    const inquiry = await createInquiryRecord({
      name: "Alpha Team",
      email: "alpha@example.test",
      message: "Need a migration workshop",
      preferred_datetime: new Date("2026-04-20T12:00:00.000Z"),
      timezone: "UTC",
      action_token: "token-alpha",
    });

    expect(inquiry.status).toBe("PENDING");
    expect(inquiry.action_token).toBe("token-alpha");
    await expect(Inquiry.count()).resolves.toBe(1);
  });

  it("rejects invalid create payload", async () => {
    await expect(
      createInquiryRecord({
        name: "Missing Fields",
        email: "",
        message: "",
      }),
    ).rejects.toMatchObject({
      status: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("creates a pending inquiry on first create-or-update call", async () => {
    const result = await createOrUpdatePendingInquiry({
      name: "Beta Team",
      email: "beta@example.test",
      message: "First request",
      preferred_datetime: new Date("2026-05-01T09:30:00.000Z"),
      timezone: "UTC",
      action_token: "token-beta-1",
    });

    expect(result.created).toBe(true);
    expect(result.inquiry.status).toBe("PENDING");
    await expect(Inquiry.count()).resolves.toBe(1);
  });

  it("updates existing pending inquiry instead of creating a duplicate", async () => {
    const input = {
      name: "Gamma Team",
      email: "gamma@example.test",
      message: "Original message",
      preferred_datetime: new Date("2026-05-02T10:00:00.000Z"),
      timezone: "UTC",
      action_token: "token-gamma-1",
    };

    const first = await createOrUpdatePendingInquiry(input);
    const second = await createOrUpdatePendingInquiry({
      ...input,
      message: "Updated message",
      action_token: "token-gamma-2",
    });

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.inquiry.id).toBe(first.inquiry.id);
    expect(second.inquiry.message).toBe("Updated message");
    expect(second.inquiry.action_token).toBe("token-gamma-2");
    await expect(Inquiry.count()).resolves.toBe(1);
  });

  it("accepts a pending inquiry and clears action token", async () => {
    const inquiry = await createInquiryFixture({
      status: "PENDING",
      action_token: "accept-token",
    });

    const updated = await acceptInquiryByToken({
      id: inquiry.id,
      token: "accept-token",
      meetingLink: "https://meet.example.test/room-1",
    });

    expect(updated.status).toBe("ACCEPTED");
    expect(updated.meet_link).toBe("https://meet.example.test/room-1");
    expect(updated.action_token).toBeNull();
  });

  it("rejects a pending inquiry and clears action token", async () => {
    const inquiry = await createInquiryFixture({
      status: "PENDING",
      action_token: "reject-token",
    });

    const updated = await rejectInquiryByToken({
      id: inquiry.id,
      token: "reject-token",
    });

    expect(updated.status).toBe("REJECTED");
    expect(updated.action_token).toBeNull();
  });

  it("rejects accept with wrong token and preserves row state", async () => {
    const inquiry = await createInquiryFixture({
      status: "PENDING",
      action_token: "expected-token",
    });

    await expect(
      acceptInquiryByToken({
        id: inquiry.id,
        token: "wrong-token",
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "UNAUTHORIZED",
    });

    const unchanged = await Inquiry.findByPk(inquiry.id);
    expect(unchanged.status).toBe("PENDING");
    expect(unchanged.action_token).toBe("expected-token");
  });

  it("rejects transition when inquiry is already processed", async () => {
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

    const unchanged = await Inquiry.findByPk(inquiry.id);
    expect(unchanged.status).toBe("ACCEPTED");
    expect(unchanged.meet_link).toBe("https://meet.example.test/existing");
  });

  it("lists inquiries by status with deterministic ordering", async () => {
    await createInquiryFixture({
      email: "a@example.test",
      status: "PENDING",
      preferred_datetime: new Date("2026-06-03T10:00:00.000Z"),
    });
    await createInquiryFixture({
      email: "b@example.test",
      status: "ACCEPTED",
      preferred_datetime: new Date("2026-06-01T10:00:00.000Z"),
    });
    await createInquiryFixture({
      email: "c@example.test",
      status: "PENDING",
      preferred_datetime: new Date("2026-06-02T10:00:00.000Z"),
    });

    const result = await listInquiries({
      status: "PENDING",
      sort: "preferred_datetime",
      order: "ASC",
    });

    expect(result).toHaveLength(2);
    expect(result[0].email).toBe("c@example.test");
    expect(result[1].email).toBe("a@example.test");
  });

  it("lists inquiries by email filter with stable pagination", async () => {
    await createInquiryFixture({
      email: "team+1@example.test",
      preferred_datetime: new Date("2026-07-01T09:00:00.000Z"),
    });
    await createInquiryFixture({
      email: "team+2@example.test",
      preferred_datetime: new Date("2026-07-02T09:00:00.000Z"),
    });
    await createInquiryFixture({
      email: "other@example.test",
      preferred_datetime: new Date("2026-07-03T09:00:00.000Z"),
    });

    const page = await listInquiries({
      email: "team+",
      sort: "preferred_datetime",
      order: "ASC",
      limit: 1,
      offset: 1,
    });

    expect(page).toHaveLength(1);
    expect(page[0].email).toBe("team+2@example.test");
  });
});
