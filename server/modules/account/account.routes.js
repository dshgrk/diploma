const express = require("express");
const { requireAuth } = require("../../middlewares/auth");
const { asyncHandler } = require("../../middlewares/async-handler");
const { getAccountDashboard } = require("./account.service");

const accountRouter = express.Router();

accountRouter.use(requireAuth);

accountRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const data = await getAccountDashboard(req.user);
    res.json({ success: true, data });
  })
);

module.exports = { accountRouter };
