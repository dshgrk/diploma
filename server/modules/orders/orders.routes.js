const express = require("express");
const { requireAuth } = require("../../middlewares/auth");
const { asyncHandler } = require("../../middlewares/async-handler");
const { getOrderDetailsForUser, listOrdersForUser } = require("./orders.service");

const ordersRouter = express.Router();

ordersRouter.use(requireAuth);

ordersRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const orders = await listOrdersForUser(req.user.id);
    res.json({ success: true, data: orders });
  })
);

ordersRouter.get(
  "/:orderId",
  asyncHandler(async (req, res) => {
    const order = await getOrderDetailsForUser(req.user.id, Number(req.params.orderId));
    res.json({ success: true, data: order });
  })
);

module.exports = { ordersRouter };
