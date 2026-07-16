import { Router } from "express";
import * as authController from "../controllers/auth";
import { requireAuth } from "../middlewares/auth";
import { createRateLimit } from "../middlewares/rateLimit";

export const authRouter = Router();
const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyPrefix: "auth-login",
});
const resetRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: "auth-reset",
});
const refreshRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyPrefix: "auth-refresh",
});

authRouter.post("/register", authController.register);
authRouter.post("/login", loginRateLimit, authController.login);
authRouter.post(
  "/organization-login",
  loginRateLimit,
  authController.organizationLogin,
);
authRouter.post("/verify-password", requireAuth, authController.verifyPassword);
authRouter.post(
  "/password-reset/request",
  resetRateLimit,
  authController.requestResetPassword,
);
authRouter.post(
  "/forgot-password",
  resetRateLimit,
  authController.requestResetPassword,
);
authRouter.post(
  "/password-reset/confirm",
  resetRateLimit,
  authController.resetPassword,
);
authRouter.post(
  "/reset-password",
  resetRateLimit,
  authController.resetPassword,
);
authRouter.post(
  "/refresh-token",
  refreshRateLimit,
  authController.refreshToken,
);
authRouter.post(
  "/refresh",
  refreshRateLimit,
  authController.refreshToken,
);
authRouter.get("/session", requireAuth, authController.getSessionState);
authRouter.put("/session", requireAuth, authController.saveSessionState);
authRouter.post("/logout", requireAuth, authController.logout);
authRouter.post("/logout-all", requireAuth, authController.logoutAll);
authRouter.post("/change-password", requireAuth, authController.changePassword);
