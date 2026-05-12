const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const {
  destroySession,
  getGoogleAuthConfig,
  loginUser,
  loginWithGoogle,
  registerClient,
  resendVerificationCode,
  serializeUser,
  verifyEmailCode
} = require("./auth.service");
const { requireAuth } = require("../../middlewares/auth");
const { createRateLimiter } = require("../../middlewares/rate-limit");

const authRouter = express.Router();
const loginRateLimit = createRateLimiter({
  key: "auth-login",
  max: 8,
  windowMs: 10 * 60 * 1000,
  message: "Too many login attempts. Please wait and try again."
});
const registerRateLimit = createRateLimiter({
  key: "auth-register",
  max: 5,
  windowMs: 10 * 60 * 1000,
  message: "Too many registration attempts. Please wait and try again."
});
const verifyRateLimit = createRateLimiter({
  key: "auth-verify",
  max: 10,
  windowMs: 10 * 60 * 1000,
  message: "Too many verification attempts. Please wait and try again."
});

authRouter.get(
  "/session",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        authenticated: Boolean(req.user),
        user: req.user ? serializeUser(req.user) : null
      }
    });
  })
);

authRouter.post(
  "/register",
  registerRateLimit,
  asyncHandler(async (req, res) => {
    const result = await registerClient(req.body, req, res);
    res.status(201).json({ success: true, data: result });
  })
);

authRouter.post(
  "/login",
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const user = await loginUser(req.body, req, res);
    res.json({ success: true, data: user });
  })
);

authRouter.get(
  "/google/config",
  asyncHandler(async (req, res) => {
    res.json({ success: true, data: getGoogleAuthConfig() });
  })
);

authRouter.post(
  "/google",
  loginRateLimit,
  asyncHandler(async (req, res) => {
    const user = await loginWithGoogle(req.body, req, res);
    res.json({ success: true, data: user });
  })
);

authRouter.post(
  "/verify-email",
  verifyRateLimit,
  asyncHandler(async (req, res) => {
    const user = await verifyEmailCode(req.body, req, res);
    res.json({ success: true, data: user });
  })
);

authRouter.post(
  "/resend-verification",
  verifyRateLimit,
  asyncHandler(async (req, res) => {
    const result = await resendVerificationCode(req.body);
    res.json({ success: true, data: result });
  })
);

authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await destroySession(req, res);
    res.json({ success: true, data: { message: "Logged out" } });
  })
);

module.exports = { authRouter };
