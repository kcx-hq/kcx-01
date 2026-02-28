import jwt from "jsonwebtoken";

export const decodeAdmin = (req, res, next) => {
  const token =
    req.cookies.kcx_admin_token ||
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[1]);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No admin token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid admin token" });
  }
};
