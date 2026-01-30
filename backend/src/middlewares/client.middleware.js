// middlewares/client.middleware.js
export const attachClient = (req, res, next) => {
  req.clientId = req.user.clientId; // from JWT
  next();
};
