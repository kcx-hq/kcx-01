import { getUploadById, listUploads } from "./operations.service.js";

export const getUploads = async (req, res) => {
  try {
    const result = await listUploads(req.query);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getUpload = async (req, res) => {
  try {
    const upload = await getUploadById(req.params.id);
    if (!upload) return res.status(404).json({ message: "Upload not found" });
    return res.status(200).json(upload);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
