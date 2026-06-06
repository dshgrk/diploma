// Файл містить логіку кошика.
import { clearGuestCart, readGuestCart } from "./guest-cart";

export const POST_AUTH_REDIRECT_KEY = "aurora-post-auth-redirect";
export const PENDING_CART_ITEM_KEY = "aurora-pending-cart-item";

// Отримує get cart item count з поточного набору даних або конфігурації.
export function getCartItemCount(cart) {
  return (cart?.items || []).reduce((sum, item) => sum + Math.max(1, Number(item?.quantity) || 0), 0);
}

// Синхронізує sync cart count між локальним станом, URL, подіями або сховищем.
export function syncCartCount(cart) {
  const count = getCartItemCount(cart);
  window.dispatchEvent(new CustomEvent("aurora:cart-updated", { detail: { count, cart } }));
  return count;
}

// Виконує локальну логіку announce cart addition для модуля кошика.
export function announceCartAddition(detail = {}) {
  window.dispatchEvent(new CustomEvent("aurora:item-added", { detail }));
}

// Синхронізує set post auth redirect між локальним станом, URL, подіями або сховищем.
export function setPostAuthRedirect(path) {
  try {
    window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path);
  } catch {}
}

// Будує поточний локальний шлях сторінки для безпечного повернення після auth-flow.
export function getCurrentLocationPath() {
  if (typeof window === "undefined" || !window.location) return "/";
  const { pathname = "/", search = "", hash = "" } = window.location;
  return `${pathname || "/"}${search || ""}${hash || ""}` || "/";
}

// Перенаправляє до auth і запам'ятовує, куди потрібно повернутися після входу.
export function redirectToAuth(returnPath = getCurrentLocationPath()) {
  setPostAuthRedirect(returnPath || "/");
  window.location.href = "/auth";
}

// Виконує локальну логіку consume post auth redirect для модуля кошика.
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

// Зберігає зміни save pending cart item та синхронізує їх із постійним сховищем.
export function savePendingCartItem(payload) {
  try {
    window.sessionStorage.setItem(PENDING_CART_ITEM_KEY, JSON.stringify(payload));
  } catch {}
}

// Виконує локальну логіку consume pending cart item для модуля кошика.
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

// Виконує локальну логіку merge guest cart into account cart для модуля кошика.
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
