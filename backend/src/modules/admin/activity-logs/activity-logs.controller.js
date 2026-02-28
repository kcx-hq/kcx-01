import { getFilters, listAdminLogs } from "./activity-logs.service.js";

export const getAdminActivityLogs = async (req, res) => {
  try {
    const result = await listAdminLogs(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAdminActivityFilters = async (req, res) => {
  try {
    const result = await getFilters();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
