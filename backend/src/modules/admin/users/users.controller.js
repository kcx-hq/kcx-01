import {
  listUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  notifyUnverifiedUser,
  deleteUser,
} from "./users.service.js";

export const getUsers = async (req, res) => {
  try {
    const result = await listUsers(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { is_active } = req.body;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({ message: "is_active must be boolean" });
    }

    const user = await updateUserStatus(req.params.id, is_active, req.user?.admin_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      id: user.id,
      is_active: user.is_active,
    });
  } catch (error) {
    if (error?.code === "LAST_ADMIN") {
      return res.status(400).json({ message: error.message });
    }
    if (error?.message?.includes("own account")) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ message: "role is required" });
    }

    const user = await updateUserRole(req.params.id, role, req.user?.admin_id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      id: user.id,
      role: user.role,
    });
  } catch (error) {
    if (error?.code === "INVALID_ROLE" || error?.code === "LAST_ADMIN") {
      return res.status(400).json({ message: error.message });
    }
    if (error?.message?.includes("own account")) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const notifyUnverified = async (req, res) => {
  try {
    const user = await notifyUnverifiedUser(req.params.id, req.user?.admin_id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "Verification email sent." });
  } catch (error) {
    if (error?.code === "ALREADY_VERIFIED") {
      return res.status(400).json({ message: error.message });
    }
    if (error?.message?.includes("own account")) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const removeUser = async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ message: "Admin password is required" });
    }
    const user = await deleteUser(req.params.id, req.user?.admin_id, password);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    if (error?.message?.includes("own account")) {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === "INVALID_PASSWORD") {
      return res.status(401).json({ message: error.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};
