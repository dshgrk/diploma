const express = require("express");
const { asyncHandler } = require("../../middlewares/async-handler");
const { loginUser } = require("./auth.service");
const { ROLES } = require("../../constants/roles");
const { createRateLimiter } = require("../../middlewares/rate-limit");

const adminAuthRouter = express.Router();
const adminLoginRateLimit = createRateLimiter({
  key: "admin-login",
  max: 5,
  windowMs: 10 * 60 * 1000,
  message: "Too many admin login attempts. Please wait and try again."
});

adminAuthRouter.post(
  "/login",
  adminLoginRateLimit,
  asyncHandler(async (req, res) => {
    const user = await loginUser(req.body, req, res, ROLES.ADMIN);
    res.json({ success: true, data: user });
  })
);

module.exports = { adminAuthRouter };
