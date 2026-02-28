import { KcxAdmin } from "../../../models/index.js";

export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.admin_id) {
      return res.status(401).json({ message: "Unauthorized: Missing admin" });
    }

    const admin = await KcxAdmin.findByPk(req.user.admin_id, {
      attributes: ["id", "is_active"],
    });

    if (!admin || !admin.is_active) {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
