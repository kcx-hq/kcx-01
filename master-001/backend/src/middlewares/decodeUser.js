import jwt from 'jsonwebtoken';
import { decode } from 'node:punycode';
export const decodeUser = (req, res, next) => {

 const token = req.cookies.kandco_token || 
                  req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(" ")[1]);
                  
    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        req.client_id = decoded.client_id 
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}