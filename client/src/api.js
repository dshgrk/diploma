export async function http(url, options = {}) {
  const response = await fetch(url, {
    method: options.method || "GET",
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload?.data;
}

export const catalogApi = {
  listProducts(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.filter((item) => item !== "" && item != null).forEach((item) => params.append(key, String(item)));
        return;
      }
      if (value === "" || value == null) return;
      params.set(key, String(value));
    });
    const query = params.toString();
    return http(`/api/catalog/products${query ? `?${query}` : ""}`);
  },
  getProduct(identifier) {
    return http(`/api/catalog/products/${identifier}`);
  }
};

export const cartApi = {
  getCart() {
    return http("/api/cart");
  },
  addItem(payload) {
    return http("/api/cart/items", { method: "POST", body: payload });
  },
  updateItem(itemId, payload) {
    return http(`/api/cart/items/${itemId}`, { method: "PATCH", body: payload });
  },
  deleteItem(itemId) {
    return http(`/api/cart/items/${itemId}`, { method: "DELETE" });
  },
  applyPromoCode(code) {
    return http("/api/cart/promo-code", { method: "POST", body: { code } });
  },
  removePromoCode() {
    return http("/api/cart/promo-code", { method: "DELETE" });
  }
};

export const constructorApi = {
  getConfig() {
    return http("/api/constructor/config");
  },
  calculatePrice(payload) {
    return http("/api/constructor/price", { method: "POST", body: payload });
  }
};

export const authApi = {
  getSession() {
    return http("/api/auth/session");
  },
  getGoogleConfig() {
    return http("/api/auth/google/config");
  },
  register(payload) {
    return http("/api/auth/register", { method: "POST", body: payload });
  },
  login(payload) {
    return http("/api/auth/login", { method: "POST", body: payload });
  },
  loginWithGoogle(credential) {
    return http("/api/auth/google", { method: "POST", body: { credential } });
  },
  verifyEmail(payload) {
    return http("/api/auth/verify-email", { method: "POST", body: payload });
  },
  resendVerificationCode(email) {
    return http("/api/auth/resend-verification", { method: "POST", body: { email } });
  },
  adminLogin(payload) {
    return http("/api/admin/login", { method: "POST", body: payload });
  },
  logout() {
    return http("/api/auth/logout", { method: "POST" });
  }
};

export const accountApi = {
  getDashboard() {
    return http("/api/account");
  }
};

export const ordersApi = {
  getMyOrders() {
    return http("/api/orders/me");
  },
  getOrder(orderId) {
    return http(`/api/orders/${orderId}`);
  },
  checkout(payload) {
    return http("/api/checkout", { method: "POST", body: payload });
  },
  confirmMockPayment(payload) {
    return http("/api/payments/mock/confirm", { method: "POST", body: payload });
  }
};

export const adminOrdersApi = {
  listOrders(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value === "" || value == null || value === false) return;
      params.set(key, String(value));
    });
    const query = params.toString();
    return http(`/api/admin/orders${query ? `?${query}` : ""}`);
  },
  getOrder(orderId) {
    return http(`/api/admin/orders/${orderId}`);
  },
  updateOrderStatus(orderId, nextStatus, comment) {
    return http(`/api/admin/orders/${orderId}/status`, {
      method: "PATCH",
      body: { next_status: nextStatus, comment }
    });
  }
};

export const adminCatalogApi = {
  listJewelryTypes() {
    return http("/api/admin/catalog/jewelry-types");
  },
  listProducts() {
    return http("/api/admin/catalog/products");
  },
  createProduct(payload) {
    return http("/api/admin/catalog/products", { method: "POST", body: payload });
  },
  updateProduct(productId, payload) {
    return http(`/api/admin/catalog/products/${productId}`, { method: "PATCH", body: payload });
  },
  uploadProductImage(payload) {
    return http("/api/admin/catalog/uploads/product-image", { method: "POST", body: payload });
  },
  deactivateProduct(productId) {
    return http(`/api/admin/catalog/products/${productId}`, { method: "DELETE" });
  },
  listMaterials() {
    return http("/api/admin/catalog/materials");
  },
  listAssets() {
    return http("/api/admin/assets");
  },
  deleteAsset(assetId) {
    return http(`/api/admin/assets/${assetId}`, { method: "DELETE" });
  },
  uploadAsset(payload) {
    return http("/api/admin/assets/upload", { method: "POST", body: payload });
  },
  getConstructorConfig() {
    return http("/api/admin/constructor");
  },
  createType(payload) {
    return http("/api/admin/constructor/types", { method: "POST", body: payload });
  },
  updateType(typeId, payload) {
    return http(`/api/admin/constructor/types/${typeId}`, { method: "PATCH", body: payload });
  },
  deactivateType(typeId) {
    return http(`/api/admin/constructor/types/${typeId}`, { method: "DELETE" });
  },
  createVariant(payload) {
    return http("/api/admin/constructor/variants", { method: "POST", body: payload });
  },
  updateVariant(variantId, payload) {
    return http(`/api/admin/constructor/variants/${variantId}`, { method: "PATCH", body: payload });
  },
  deactivateVariant(variantId) {
    return http(`/api/admin/constructor/variants/${variantId}`, { method: "DELETE" });
  },
  createSlot(payload) {
    return http("/api/admin/constructor/slots", { method: "POST", body: payload });
  },
  updateSlot(slotId, payload) {
    return http(`/api/admin/constructor/slots/${slotId}`, { method: "PATCH", body: payload });
  },
  deactivateSlot(slotId) {
    return http(`/api/admin/constructor/slots/${slotId}`, { method: "DELETE" });
  },
  createStone(payload) {
    return http("/api/admin/constructor/stones", { method: "POST", body: payload });
  },
  updateStone(stoneId, payload) {
    return http(`/api/admin/constructor/stones/${stoneId}`, { method: "PATCH", body: payload });
  },
  deactivateStone(stoneId) {
    return http(`/api/admin/constructor/stones/${stoneId}`, { method: "DELETE" });
  },
  upsertVariantStone(payload) {
    return http("/api/admin/constructor/variant-stones", { method: "PATCH", body: payload });
  },
  disableVariantStone(variantId, stoneId) {
    return http(`/api/admin/constructor/variant-stones/${variantId}/${stoneId}`, { method: "DELETE" });
  }
};
