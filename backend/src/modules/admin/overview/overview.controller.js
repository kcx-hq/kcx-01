import { getCachedOverviewSnapshot } from "./overview.service.js";

export const getOverview = async (req, res) => {
  try {
    const data = await getCachedOverviewSnapshot({
      recentDays: req.query.recentDays,
      activityLimit: req.query.activityLimit,
      force: req.query.force === "true",
    });
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
