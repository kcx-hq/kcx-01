import { AdminActivityLog } from "../../../models/index.js";

export const logAdminEvent = async ({
  adminId,
  clientId = null,
  eventType,
  entityType,
  entityId = null,
  description,
  metadata = {},
  correlationId = null,
}) => {
  if (!adminId || !eventType || !entityType || !description) return;
  try {
    await AdminActivityLog.create({
      admin_id: adminId,
      client_id: clientId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      description,
      metadata,
      correlation_id: correlationId,
    });
  } catch (error) {
    console.warn("AdminActivityLog insert failed:", error?.message || error);
  }
};
