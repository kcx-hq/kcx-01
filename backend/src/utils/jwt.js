import jwt from 'jsonwebtoken';

export const generateJWT = (payload) => {
    
    const secret = process.env.JWT_SECRET;
    const options = { expiresIn: process.env.JWT_EXPIRES_IN || '1h' };

    return jwt.sign(payload, secret, options);
}

export const verifyJWT = (token) => {
    const secret = process.env.JWT_SECRET;
    return jwt.verify(token, secret);
}