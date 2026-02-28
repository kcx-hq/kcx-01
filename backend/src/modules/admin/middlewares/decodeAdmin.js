import jwt from "jsonwebtoken";
import AppError from "../../../errors/AppError.js";

export const decodeAdmin = (req, res, next) => {
  const token =
    req.cookies.kcx_admin_token ||
    (req.headers.authorization &&
      req.headers.authorization.split(" ")[1]);

  if (!token) {
    return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new AppError(401, "UNAUTHENTICATED", "Authentication required", { cause: error }));
  }
};
