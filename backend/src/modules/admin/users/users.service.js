import { Op } from "sequelize";
import sequelize from "../../../config/db.config.js";
import { User, Client, KcxAdmin } from "../../../models/index.js";
import { logAdminEvent } from "../activity-logs/activity-logs.logger.js";
import { UserRole } from "../../../models/UserRole.js";
import { sendEmail } from "../../../utils/sendEmail.js";
import bcrypt from "bcrypt";

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const listUsers = async (query = {}) => {
  const page = Math.max(toInt(query.page, 1), 1);
  const limit = Math.min(Math.max(toInt(query.limit, 20), 1), 100);
  const offset = (page - 1) * limit;

  const where = {};
  let clientFilter = null;

  if (query.status === "active") {
    where.is_active = true;
  } else if (query.status === "disabled") {
    where.is_active = false;
  }

  if (query.verified === "true") {
    where.is_verified = true;
  } else if (query.verified === "false") {
    where.is_verified = false;
  }

  if (query.role) {
    where.role = query.role;
  }

  if (query.client_id) {
    where.client_id = query.client_id;
  }

  if (query.search) {
    const term = `%${query.search.trim()}%`;
    const normalized = query.search.trim().toLowerCase();
    where[Op.or] = [
      { email: { [Op.iLike]: term } },
      { full_name: { [Op.iLike]: term } },
      { "$client.name$": { [Op.iLike]: term } },
      { "$client.email$": { [Op.iLike]: term } },
      sequelize.where(sequelize.cast(sequelize.col("role"), "text"), {
        [Op.iLike]: term,
      }),
    ];

    if (!where.is_active) {
      if (normalized === "active") {
        where.is_active = true;
      } else if (normalized === "disabled" || normalized === "inactive") {
        where.is_active = false;
      }
    }

    if (where.is_verified === undefined) {
      if (normalized === "verified") {
        where.is_verified = true;
      } else if (normalized === "unverified") {
        where.is_verified = false;
      }
    }
  }

  if (query.company) {
    const term = `%${query.company.trim()}%`;
    clientFilter = {
      [Op.or]: [{ name: { [Op.iLike]: term } }, { email: { [Op.iLike]: term } }],
    };
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: [
      "id",
      "full_name",
      "email",
      "role",
      "client_id",
      "is_active",
      "is_verified",
      "is_premium",
      "createdAt",
    ],
    include: [
      {
        model: Client,
        as: "client",
        attributes: ["id", "name", "email"],
        ...(clientFilter ? { where: clientFilter, required: true } : {}),
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  });

  return {
    items: rows,
    page,
    limit,
    total: count,
    totalPages: Math.ceil(count / limit) || 1,
  };
};

export const getUserById = async (id) => {
  return await User.findByPk(id, {
    attributes: [
      "id",
      "full_name",
      "email",
      "role",
      "client_id",
      "is_active",
      "is_verified",
      "is_premium",
      "createdAt",
    ],
    include: [
      {
        model: Client,
        as: "client",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

const isLastClientAdmin = async (user) => {
  if (!user?.client_id || user.role !== UserRole.ADMIN || !user.is_active) {
    return false;
  }

  const remainingAdmins = await User.count({
    where: {
      client_id: user.client_id,
      role: UserRole.ADMIN,
      is_active: true,
      id: { [Op.ne]: user.id },
    },
  });

  return remainingAdmins === 0;
};

const assertNotSelf = async (adminId, user) => {
  if (!adminId) return;
  const admin = await KcxAdmin.findByPk(adminId, { attributes: ["email"] });
  if (admin?.email && admin.email.toLowerCase() === String(user.email).toLowerCase()) {
    throw new Error("You cannot modify your own account.");
  }
};


export const deleteUser = async (id, adminId, adminPassword) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  await assertNotSelf(adminId, user);

  const admin = await KcxAdmin.findByPk(adminId, { attributes: ["password_hash"] });
  if (!admin) {
    const err = new Error("Admin not found.");
    err.code = "INVALID_PASSWORD";
    throw err;
  }
  const isValid = await bcrypt.compare(adminPassword, admin.password_hash);
  if (!isValid) {
    const err = new Error("Invalid admin password.");
    err.code = "INVALID_PASSWORD";
    throw err;
  }

  await sendEmail({
    to: user.email,
    subject: "KCX account access removed",
    html: `
      <div style="background-color:#0a0a0c; padding:32px; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
        <div style="max-width:520px; margin:0 auto; background-color:#121218; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:28px;">
          <h2 style="color:#ffffff; margin:0 0 12px; font-size:20px;">Account access removed</h2>
          <p style="color:#9CA3AF; font-size:14px; line-height:1.6; margin:0 0 18px;">
            Your KCX account access has been removed by an administrator.
          </p>
          <p style="color:#9CA3AF; font-size:14px; line-height:1.6; margin:0;">
            If you believe this is a mistake, please contact your account owner or support.
          </p>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:22px 0;" />
          <p style="color:#6B7280; font-size:12px; text-align:center; margin:0;">
            © ${new Date().getFullYear()} KCX
          </p>
        </div>
      </div>
    `,
  });

  await user.destroy();
  await logAdminEvent({
    adminId,
    clientId: user.client_id || null,
    eventType: "DELETE_USER",
    entityType: "USER",
    entityId: user.id,
    description: `Admin deleted user ${user.email}.`,
    metadata: { email: user.email },
  });
  return user;
};

export const updateUserStatus = async (id, isActive, adminId) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  await assertNotSelf(adminId, user);

  // Allow disabling even if this is the last admin for the client.

  user.is_active = isActive;
  await user.save();
  if (!isActive) {
    await logAdminEvent({
      adminId,
      clientId: user.client_id || null,
      eventType: "DISABLE_USER",
      entityType: "USER",
      entityId: user.id,
      description: `Admin disabled user ${user.email}.`,
      metadata: { is_active: isActive },
    });
  }
  return user;
};

export const updateUserRole = async (id, role, adminId) => {
  const normalizedRole = String(role || "").toUpperCase();
  const validRoles = Object.values(UserRole);
  if (!validRoles.includes(normalizedRole)) {
    const err = new Error("Invalid role");
    err.code = "INVALID_ROLE";
    throw err;
  }

  const user = await User.findByPk(id);
  if (!user) return null;

  await assertNotSelf(adminId, user);

  // Allow role changes even if this is the last admin for the client.

  const previousRole = user.role;
  user.role = normalizedRole;
  await user.save();
  await logAdminEvent({
    adminId,
    clientId: user.client_id || null,
    eventType: "CHANGE_USER_ROLE",
    entityType: "USER",
    entityId: user.id,
    description: `Admin changed role for ${user.email} from ${previousRole} to ${normalizedRole}.`,
    metadata: { old_role: previousRole, new_role: normalizedRole },
  });
  return user;
};

export const notifyUnverifiedUser = async (id, adminId) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  await assertNotSelf(adminId, user);

  if (user.is_verified) {
    const err = new Error("User is already verified.");
    err.code = "ALREADY_VERIFIED";
    throw err;
  }

  await sendEmail({
    to: user.email,
    subject: "KCX verification pending",
    html: `
      <div style="background-color:#0a0a0c; padding:32px; font-family:ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
        <div style="max-width:520px; margin:0 auto; background-color:#121218; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:28px;">
          <h2 style="color:#ffffff; margin:0 0 12px; font-size:20px;">Action required: verify your account</h2>
          <p style="color:#9CA3AF; font-size:14px; line-height:1.6; margin:0 0 18px;">
            Your KCX account is still unverified. Please complete verification to continue using the platform without interruptions.
          </p>
          <p style="color:#9CA3AF; font-size:14px; line-height:1.6; margin:0;">
            If you did not request this account, you can ignore this email.
          </p>
          <hr style="border:none; border-top:1px solid rgba(255,255,255,0.08); margin:22px 0;" />
          <p style="color:#6B7280; font-size:12px; text-align:center; margin:0;">
            © ${new Date().getFullYear()} KCX
          </p>
        </div>
      </div>
    `,
  });

  await logAdminEvent({
    adminId,
    clientId: user.client_id || null,
    eventType: "NOTIFY_USER",
    entityType: "USER",
    entityId: user.id,
    description: `Admin sent verification reminder to ${user.email}.`,
    metadata: { email: user.email },
  });

  return user;
};
