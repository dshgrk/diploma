import { getReadyProductNormalizedSize, readyProductConfigurationsEqual } from "../../ready-product";

export const GUEST_CART_STORAGE_KEY = "aurora-guest-cart";
export const MAX_CART_ITEM_QUANTITY = 100;

export function buildGuestCart(items = []) {
  const safeItems = (items || []).map((item, index) => {
    const quantity = Math.max(1, Number(item?.quantity) || 1);
    const unitPrice = Number(item?.unit_price || 0);
    const slug = String(item?.product_slug || "").trim();
    const productType = item?.product_type || null;
    const normalizedSize =
      item?.item_type === "ready_product"
        ? getReadyProductNormalizedSize(productType, item?.configuration?.size || item?.selected_size)
        : "";
    const thumbnailUrl =
      item?.item_type === "ready_product" && slug
        ? `/assets/products/${slug}.png`
        : item?.thumbnail_url || null;

    return {
      ...item,
      id: item?.id || `guest-${index + 1}-${Date.now()}`,
      configuration:
        item?.item_type === "ready_product"
          ? {
              ...(item?.configuration || {}),
              ...(normalizedSize ? { size: normalizedSize } : {})
            }
          : item?.configuration || {},
      thumbnail_url: thumbnailUrl,
      quantity,
      unit_price: unitPrice,
      line_total: unitPrice * quantity
    };
  });
  const subtotal = safeItems.reduce((sum, item) => sum + Number(item.line_total || 0), 0);

  return {
    id: "guest-cart",
    status: "guest",
    items: safeItems,
    subtotal_amount: subtotal,
    discount_amount: 0,
    total_amount: subtotal,
    currency: "UAH"
  };
}

export function readGuestCart() {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return buildGuestCart([]);
    const parsed = JSON.parse(raw);
    return buildGuestCart(parsed?.items || []);
  } catch {
    return buildGuestCart([]);
  }
}

export function writeGuestCart(cart) {
  try {
    window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify({ items: cart?.items || [] }));
  } catch {}
}

export function clearGuestCart() {
  try {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  } catch {}
}

export function addGuestCartItem(item) {
  const cart = readGuestCart();
  const nextItems = [...cart.items];
  const nextId = () => `guest-${window.crypto?.randomUUID?.() || Date.now()}`;

  if (item.item_type === "ready_product") {
    const normalizedSize = getReadyProductNormalizedSize(item.product_type, item?.configuration?.size || item?.selected_size);
    const nextReadyItem = {
      ...item,
      configuration: {
        ...(item.configuration || {}),
        ...(normalizedSize ? { size: normalizedSize } : {})
      }
    };
    const existingIndex = nextItems.findIndex(
      (entry) =>
        entry.item_type === "ready_product" &&
        String(entry.product_id) === String(item.product_id) &&
        readyProductConfigurationsEqual(entry?.configuration || {}, nextReadyItem?.configuration || {})
    );
    if (existingIndex >= 0) {
      const current = nextItems[existingIndex];
      nextItems[existingIndex] = {
        ...current,
        quantity: Math.min(MAX_CART_ITEM_QUANTITY, Number(current.quantity || 1) + Number(item.quantity || 1))
      };
    } else {
      nextItems.push({
        ...nextReadyItem,
        id: nextId(),
        quantity: Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(nextReadyItem.quantity || 1)))
      });
    }
  } else {
    nextItems.push({
      ...item,
      id: nextId(),
      quantity: Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(item.quantity || 1)))
    });
  }

  const nextCart = buildGuestCart(nextItems);
  writeGuestCart(nextCart);
  return nextCart;
}

export function updateGuestCartItem(itemId, quantity) {
  const cart = readGuestCart();
  const nextItems = cart.items.map((item) =>
    String(item.id) === String(itemId)
      ? { ...item, quantity: Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Number(quantity) || 1)) }
      : item
  );
  const nextCart = buildGuestCart(nextItems);
  writeGuestCart(nextCart);
  return nextCart;
}

export function patchGuestCartItem(itemId, patch = {}) {
  const cart = readGuestCart();
  const nextItems = cart.items.map((item) => {
    if (String(item.id) !== String(itemId)) return item;
    return {
      ...item,
      ...patch,
      configuration: {
        ...(item.configuration || {}),
        ...(patch.configuration || {})
      }
    };
  });
  const nextCart = buildGuestCart(nextItems);
  writeGuestCart(nextCart);
  return nextCart;
}

export function removeGuestCartItem(itemId) {
  const cart = readGuestCart();
  const nextCart = buildGuestCart(cart.items.filter((item) => String(item.id) !== String(itemId)));
  writeGuestCart(nextCart);
  return nextCart;
}
