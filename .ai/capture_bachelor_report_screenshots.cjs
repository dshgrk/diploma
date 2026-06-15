const { spawn } = require("node:child_process");
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const BASE_URL = process.env.AURORA_BASE_URL || "http://localhost:3000";
const SCREENSHOT_DIR = path.join(ROOT, ".ai", "generated-report-assets", "screenshots");
const VIEWPORT = { width: 1440, height: 1350 };
const CLIENT = { email: "client@aurora.local", password: "password123" };
const ADMIN = { email: "admin@aurora.local", password: "password123" };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function removeDirectoryWithRetries(directory) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.rmSync(directory, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 7) {
        console.warn(`Could not remove temporary Chrome profile: ${error.message}`);
        return;
      }
      await wait(250);
    }
  }
}

function findChromeExecutable() {
  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    path.join(process.env.LOCALAPPDATA || "", "chromium", "Application", "chrome.exe"),
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  const executable = candidates.find((candidate) => candidate && fs.existsSync(candidate));
  if (!executable) {
    throw new Error("Chrome or Edge executable was not found.");
  }
  return executable;
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

async function waitForJson(url, options = {}) {
  let lastError = null;
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      lastError = error;
      await wait(100);
    }
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
}

class CdpPage {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 0;
    this.pending = new Map();
    this.loadWaiters = [];
    this.ws.onmessage = (event) => this.onMessage(event);
  }

  async open() {
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
    await this.command("Page.enable");
    await this.command("Runtime.enable");
    await this.command("Network.enable");
    await this.setViewport();
  }

  onMessage(event) {
    const message = JSON.parse(event.data);
    if (message.method === "Page.loadEventFired") {
      const waiters = this.loadWaiters.splice(0);
      waiters.forEach((resolve) => resolve());
    }
    if (message.id && this.pending.has(message.id)) {
      const { resolve, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) {
        reject(new Error(`${message.error.message}: ${message.error.data || ""}`));
      } else {
        resolve(message.result || {});
      }
    }
  }

  command(method, params = {}) {
    const id = (this.nextId += 1);
    const payload = JSON.stringify({ id, method, params });
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(payload);
    });
  }

  async setViewport() {
    await this.command("Emulation.setDeviceMetricsOverride", {
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      deviceScaleFactor: 1,
      mobile: false,
    });
  }

  async evaluate(expression) {
    const result = await this.command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || "Runtime.evaluate failed");
    }
    return result.result?.value;
  }

  waitForLoad(timeoutMs = 8000) {
    return new Promise((resolve) => {
      const timer = setTimeout(resolve, timeoutMs);
      this.loadWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  async goto(route, settleMs = 1600) {
    const loadPromise = this.waitForLoad();
    await this.command("Page.navigate", { url: `${BASE_URL}${route}` });
    await loadPromise;
    await this.setViewport();
    await this.evaluate("window.localStorage.setItem('aurora-locale', 'uk'); window.scrollTo(0, 0); true;");
    await this.evaluate("document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true;");
    await wait(settleMs);
  }

  async screenshot(fileName) {
    await this.evaluate("window.scrollTo(0, 0); true;");
    await wait(250);
    const result = await this.command("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
    });
    const outPath = path.join(SCREENSHOT_DIR, fileName);
    fs.writeFileSync(outPath, Buffer.from(result.data, "base64"));
    console.log(`captured ${fileName}`);
  }

  close() {
    this.ws.close();
  }
}

function fillFieldsExpression(fields, checked = {}) {
  return `(() => {
    const fields = ${JSON.stringify(fields)};
    const checked = ${JSON.stringify(checked)};
    const setValue = (selector, value) => {
      const element = document.querySelector(selector);
      if (!element) return;
      const proto = element.tagName === "TEXTAREA"
        ? HTMLTextAreaElement.prototype
        : element.tagName === "SELECT"
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, "value").set.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    };
    const setChecked = (selector, value) => {
      const element = document.querySelector(selector);
      if (!element) return;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked").set.call(element, value);
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    };
    Object.entries(fields).forEach(([selector, value]) => setValue(selector, value));
    Object.entries(checked).forEach(([selector, value]) => setChecked(selector, value));
    return true;
  })();`;
}

function apiExpression(route, options = {}) {
  return `(async () => {
    const response = await fetch(${JSON.stringify(route)}, {
      method: ${JSON.stringify(options.method || "GET")},
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "x-locale": "uk"
      },
      body: ${options.body ? JSON.stringify(JSON.stringify(options.body)) : "undefined"}
    });
    const payload = await response.json();
    if (!response.ok || payload.success === false) {
      throw new Error(payload?.error?.message || "API request failed");
    }
    return payload.data;
  })();`;
}

function activeItems(items) {
  return (items || []).filter((item) => item?.is_active !== false);
}

function buildRouteWithQuery(pathname, params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function pickAdminConstructorFocus(studio) {
  const types = activeItems(studio?.types);
  const variants = activeItems(studio?.variants);
  const slots = activeItems(studio?.slots);
  const stones = activeItems(studio?.stones);
  const matrix = (studio?.variant_stones || []).filter((item) => item?.is_enabled !== false);

  const variantWithSlots = variants.find((variant) =>
    slots.some((slot) => String(slot.variant_id) === String(variant.id))
  ) || variants[0];
  if (!variantWithSlots) {
    throw new Error("Admin constructor config does not contain active variants.");
  }

  const selectedType = types.find((item) => String(item.id) === String(variantWithSlots.type_id))
    || types.find((item) => variants.some((variant) => String(variant.type_id) === String(item.id)))
    || types[0];
  if (!selectedType) {
    throw new Error("Admin constructor config does not contain active types.");
  }

  const typeVariants = variants.filter((item) => String(item.type_id) === String(selectedType.id));
  const selectedVariant = typeVariants.find((variant) =>
    slots.some((slot) => String(slot.variant_id) === String(variant.id))
  ) || typeVariants[0] || variantWithSlots;

  const variantSlots = slots.filter((item) => String(item.variant_id) === String(selectedVariant.id));
  const selectedSlot = variantSlots[0] || null;

  const selectedMatrixStone = matrix.find((item) => String(item.variant_id) === String(selectedVariant.id));
  const selectedStone = stones.find((item) => String(item.id) === String(selectedMatrixStone?.stone_id)) || stones[0] || null;

  return {
    typeId: selectedType.id,
    variantId: selectedVariant.id,
    slotId: selectedSlot?.id || "",
    stoneId: selectedStone?.id || ""
  };
}

async function login(page, endpoint, credentials) {
  await page.evaluate(apiExpression(endpoint, {
    method: "POST",
    body: credentials,
  }));
}

async function ensureCartHasItem(page, productId) {
  const cart = await page.evaluate(apiExpression("/api/cart"));
  if (cart.items && cart.items.length) {
    return cart;
  }
  return page.evaluate(apiExpression("/api/cart/items", {
    method: "POST",
    body: {
      item_type: "ready_product",
      product_id: productId,
      configuration: { size: "17" },
      quantity: 1,
    },
  }));
}

async function createPendingOrder(page, productId) {
  await ensureCartHasItem(page, productId);
  return page.evaluate(apiExpression("/api/checkout", {
    method: "POST",
    body: {
      customer_name: "Дарина Клієнт",
      phone: "+380991234567",
      delivery_method: "nova_poshta",
      delivery_address: "м. Харків, відділення Нової пошти №1",
      accepted_offer: true,
      accepted_return_policy: true,
    },
  }));
}

async function main() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const chromeExecutable = findChromeExecutable();
  const port = await getFreePort();
  const userDataDir = path.join(ROOT, ".ai", "generated-report-assets", "chrome-profile");
  await removeDirectoryWithRetries(userDataDir);
  fs.mkdirSync(userDataDir, { recursive: true });

  const browser = spawn(chromeExecutable, [
    "--headless=new",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-extensions",
    "--hide-scrollbars",
    "--no-default-browser-check",
    "--no-first-run",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`,
    "about:blank",
  ], { stdio: "ignore" });

  let page = null;
  try {
    await waitForJson(`http://127.0.0.1:${port}/json/version`);
    const target = await waitForJson(`http://127.0.0.1:${port}/json/new?${BASE_URL}/`, { method: "PUT" });
    page = new CdpPage(target.webSocketDebuggerUrl);
    await page.open();

    await page.goto("/");
    await page.screenshot("01-home.png");

    const products = await page.evaluate(apiExpression("/api/catalog/products?lang=uk"));
    const product = products.find((item) => item.slug) || products[0];
    if (!product) throw new Error("No catalog product was returned by API.");

    await page.goto("/catalog");
    await page.screenshot("02-catalog.png");

    await page.goto(`/products/${product.slug}`);
    await page.screenshot("03-product.png");

    await page.goto("/constructor?type=ring&variant=ring-duet");
    await page.screenshot("04-constructor.png");

    await login(page, "/api/auth/login", CLIENT);
    await ensureCartHasItem(page, product.id);

    await page.goto("/cart");
    await page.screenshot("05-cart.png");

    await page.goto("/checkout");
    await page.evaluate(fillFieldsExpression({
      'input[name="customer_name"]': "Дарина Клієнт",
      'input[name="phone"]': "+380991234567",
      'select[name="delivery_method"]': "nova_poshta",
      'textarea[name="delivery_address"]': "м. Харків, відділення Нової пошти №1",
    }, {
      'input[name="accepted_offer"]': true,
    }));
    await wait(500);
    await page.screenshot("06-checkout.png");

    const checkout = await createPendingOrder(page, product.id);
    const orderId = checkout.order_id;
    if (!orderId) throw new Error("Checkout did not return order_id.");

    await page.goto(`/payment/${orderId}`);
    await page.evaluate(fillFieldsExpression({
      'input[name="cardHolder"]': "Daryna Hirka",
      'input[name="cardNumber"]': "4242 4242 4242 4242",
      'input[name="expiryDate"]': "12/28",
      'input[name="cvc"]': "123",
    }));
    await wait(500);
    await page.screenshot("07-payment.png");

    await page.goto("/orders");
    await page.screenshot("08-orders.png");

    await page.goto(`/orders/${orderId}`);
    await page.screenshot("09-order-detail.png");

    await page.goto("/admin/login");
    await page.evaluate(fillFieldsExpression({
      'input[type="email"]': ADMIN.email,
      'input[type="password"]': ADMIN.password,
    }));
    await wait(350);
    await page.screenshot("10-admin-login.png");

    await login(page, "/api/admin/login", ADMIN);

    await page.goto("/admin/orders");
    await page.screenshot("11-admin-orders.png");

    await page.goto(`/admin/orders/${orderId}`);
    await page.screenshot("12-admin-order-detail.png");

    await page.goto("/admin/products");
    await page.screenshot("13-admin-products.png");

    const studio = await page.evaluate(apiExpression("/api/admin/constructor"));
    const focus = pickAdminConstructorFocus(studio);

    await page.goto("/admin/constructor");
    await page.screenshot("14-admin-constructor-home.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "jewelry",
      step: "types",
      type: focus.typeId,
    }));
    await page.screenshot("15-admin-constructor-types.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "jewelry",
      step: "variants",
      type: focus.typeId,
    }));
    await page.screenshot("16-admin-constructor-variants.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "jewelry",
      step: "editor",
      subview: "slots",
      type: focus.typeId,
      variant: focus.variantId,
      slot: focus.slotId,
    }));
    await page.screenshot("17-admin-constructor-slots.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "jewelry",
      step: "editor",
      subview: "basic",
      type: focus.typeId,
      variant: focus.variantId,
      slot: focus.slotId,
    }));
    await page.screenshot("18-admin-constructor-basic.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "jewelry",
      step: "editor",
      subview: "matrix",
      type: focus.typeId,
      variant: focus.variantId,
      slot: focus.slotId,
    }));
    await page.screenshot("19-admin-constructor-matrix.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "jewelry",
      step: "editor",
      subview: "preview",
      type: focus.typeId,
      variant: focus.variantId,
      slot: focus.slotId,
    }));
    await page.screenshot("20-admin-constructor-preview.png");

    await page.goto("/admin/constructor?section=stones&stoneStep=list");
    await page.screenshot("21-admin-constructor-stones.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "stones",
      stoneStep: "editor",
      stone: focus.stoneId,
    }));
    await page.screenshot("22-admin-constructor-stone-editor.png");

    await page.goto("/admin/constructor?section=assets");
    await page.screenshot("23-admin-constructor-assets.png");

    await page.goto(buildRouteWithQuery("/admin/constructor", {
      section: "pricing",
      type: focus.typeId,
      variant: focus.variantId,
    }));
    await page.screenshot("24-admin-constructor-pricing.png");
  } finally {
    if (page) page.close();
    browser.kill();
    await wait(500);
    await removeDirectoryWithRetries(userDataDir);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
