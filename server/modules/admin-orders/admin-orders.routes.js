const express = require("express");
const { requireAdmin } = require("../../middlewares/auth");
const { asyncHandler } = require("../../middlewares/async-handler");
const { getAdminOrderDetails, listAdminOrders, updateAdminOrderStatus } = require("./admin-orders.service");

const adminOrdersRouter = express.Router();

adminOrdersRouter.use(requireAdmin);

adminOrdersRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const orders = await listAdminOrders(req.query);
    res.json({ success: true, data: orders });
  })
);

adminOrdersRouter.get(
  "/:orderId",
  asyncHandler(async (req, res) => {
    const order = await getAdminOrderDetails(Number(req.params.orderId));
    res.json({ success: true, data: order });
  })
);

adminOrdersRouter.patch(
  "/:orderId/status",
  asyncHandler(async (req, res) => {
    const order = await updateAdminOrderStatus(req.user.id, Number(req.params.orderId), req.body.next_status, req.body.comment);
    res.json({ success: true, data: order });
  })
);

module.exports = { adminOrdersRouter };
