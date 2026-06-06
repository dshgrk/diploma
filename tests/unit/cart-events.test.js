// Файл містить автоматичні перевірки критичних helper-функцій auth/cart redirect flow.
import { afterEach, describe, expect, test } from "vitest";

import {
  POST_AUTH_REDIRECT_KEY,
  getCurrentLocationPath,
  redirectToAuth
} from "../../client/src/features/cart/cart-events.js";

function createSessionStorageMock() {
  const storage = new Map();
  return {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    }
  };
}

afterEach(() => {
  delete global.window;
});

describe("cart auth redirect helpers", () => {
  test("builds the current location path including search and hash", () => {
    global.window = {
      location: {
        pathname: "/orders/42",
        search: "?tab=history",
        hash: "#payment"
      }
    };

    expect(getCurrentLocationPath()).toBe("/orders/42?tab=history#payment");
  });

  test("redirects to auth and remembers the explicit return path", () => {
    const sessionStorage = createSessionStorageMock();
    global.window = {
      location: {
        pathname: "/account",
        search: "",
        hash: "",
        href: "/account"
      },
      sessionStorage
    };

    redirectToAuth("/checkout");

    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBe("/checkout");
    expect(global.window.location.href).toBe("/auth");
  });

  test("redirects to auth and remembers the current location by default", () => {
    const sessionStorage = createSessionStorageMock();
    global.window = {
      location: {
        pathname: "/payment/17",
        search: "?from=mail",
        hash: "#secure",
        href: "/payment/17"
      },
      sessionStorage
    };

    redirectToAuth();

    expect(sessionStorage.getItem(POST_AUTH_REDIRECT_KEY)).toBe("/payment/17?from=mail#secure");
    expect(global.window.location.href).toBe("/auth");
  });
});
