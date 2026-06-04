// Файл містить логіку order-statuses.
const ORDER_STATUSES = {
  CREATED_PENDING_PAYMENT: "created_pending_payment",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
};

const ORDER_STATUS_FLOW = [
  ORDER_STATUSES.CREATED_PENDING_PAYMENT,
  ORDER_STATUSES.CONFIRMED,
  ORDER_STATUSES.IN_PROGRESS,
  ORDER_STATUSES.COMPLETED
];

// Отримує get next order status з поточного набору даних або конфігурації.
function getNextOrderStatus(status) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  if (currentIndex === -1 || currentIndex === ORDER_STATUS_FLOW.length - 1) {
    return null;
  }

  return ORDER_STATUS_FLOW[currentIndex + 1];
}

// Перевіряє is known order status і повертає результат або кидає помилку валідації.
function isKnownOrderStatus(status) {
  return ORDER_STATUS_FLOW.includes(status);
}

// Отримує get previous order status з поточного набору даних або конфігурації.
function getPreviousOrderStatus(status) {
  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);
  if (currentIndex <= 0) {
    return null;
  }

  return ORDER_STATUS_FLOW[currentIndex - 1];
}

// Отримує get allowed order statuses з поточного набору даних або конфігурації.
function getAllowedOrderStatuses(status) {
  return [getPreviousOrderStatus(status), getNextOrderStatus(status)].filter(Boolean);
}

// Перевіряє is adjacent order status transition і повертає результат або кидає помилку валідації.
function isAdjacentOrderStatusTransition(currentStatus, nextStatus) {
  return getAllowedOrderStatuses(currentStatus).includes(nextStatus);
}

module.exports = {
  getAllowedOrderStatuses,
  ORDER_STATUSES,
  ORDER_STATUS_FLOW,
  getNextOrderStatus,
  getPreviousOrderStatus,
  isAdjacentOrderStatusTransition,
  isKnownOrderStatus
};
