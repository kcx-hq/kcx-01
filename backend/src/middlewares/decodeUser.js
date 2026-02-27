import jwt from 'jsonwebtoken';
import AppError from "../errors/AppError.js";
export const decodeUser = (req, res, next) => {

 const token = req.cookies.kandco_token || req.cookies._vercel_jwt ||
                  req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(" ")[1]);
                  
    if (!token) {
        return next(new AppError(401, "UNAUTHENTICATED", "Authentication required"));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        req.client_id = decoded.client_id 
        next();
    } catch (error) {
        return next(new AppError(401, "UNAUTHENTICATED", "Authentication required", { cause: error }));
    }
}
