import { clearGuestCart, readGuestCart } from "./guest-cart";

export const POST_AUTH_REDIRECT_KEY = "aurora-post-auth-redirect";
export const PENDING_CART_ITEM_KEY = "aurora-pending-cart-item";

export function getCartItemCount(cart) {
  return (cart?.items || []).reduce((sum, item) => sum + Math.max(1, Number(item?.quantity) || 0), 0);
}

export function syncCartCount(cart) {
  const count = getCartItemCount(cart);
  window.dispatchEvent(new CustomEvent("aurora:cart-updated", { detail: { count, cart } }));
  return count;
}

export function announceCartAddition(detail = {}) {
  window.dispatchEvent(new CustomEvent("aurora:item-added", { detail }));
}

export function setPostAuthRedirect(path) {
  try {
    window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {}
}

export function consumePostAuthRedirect() {
  try {
    const next = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    if (!next) return null;
    window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return next;
  } catch {
    return null;
  }
}

export function savePendingCartItem(payload) {
  try {
    window.sessionStorage.setItem(PENDING_CART_ITEM_KEY, JSON.stringify(payload));
  } catch {}
}

export function consumePendingCartItem() {
  try {
    const raw = window.sessionStorage.getItem(PENDING_CART_ITEM_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_CART_ITEM_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function mergeGuestCartIntoAccountCart(cartApi) {
  const guestCart = readGuestCart();
  if (!guestCart.items.length) return null;

  let lastCart = null;
  for (const item of guestCart.items) {
    const payload = {
      item_type: item.item_type,
      product_id: item.product_id,
      jewelry_type_id: item.jewelry_type_id,
      quantity: item.quantity,
      configuration: item.configuration
    };
    lastCart = await cartApi.addItem(payload);
  }

  clearGuestCart();
  if (lastCart) syncCartCount(lastCart);
  return lastCart;
}
