import { decodeUser } from "../../middlewares/decodeUser.js";
import clientCRoutes from "./client-c/client-c.routes.js";
import clientDRoutes from "./client-d/client-d.routes.js";

export default (app) => {
  // Apply decodeUser middleware only to client routes, not globally
  // This prevents it from affecting auth routes like /api/auth/signup
  app.use("/api/client-c", decodeUser, clientCRoutes);
  app.use("/api/client-d/dashboard", decodeUser, clientDRoutes);
};
