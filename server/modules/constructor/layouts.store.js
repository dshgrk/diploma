const fs = require("fs/promises");
const path = require("path");

const LAYOUTS_FILE = path.resolve(process.cwd(), "db", "constructor-layouts.json");

const DEFAULT_CONSTRUCTOR_LAYOUTS = {
  bases: {
    bracelet: "/assets/generated/bracelet-orbit-silver.png",
    ring: "/assets/generated/ring-trinity-silver.png",
    pendant: {
      heart: "/assets/generated/pendant-heart-silver.png",
      moon: "/assets/generated/pendant-moon-silver.png",
      drop: "/assets/generated/pendant-drop-silver.png"
    },
    earrings: "/assets/generated/earrings-drop-silver.png"
  },
  positions: {
    bracelet: {
      "slot-1": { left: "50%", top: "14.7%" },
      "slot-2": { left: "82.25%", top: "31.05%" },
      "slot-3": { left: "82.05%", top: "62%" },
      "slot-4": { left: "49.8%", top: "77.2%" },
      "slot-5": { left: "17.75%", top: "62%" },
      "slot-6": { left: "17.55%", top: "31.05%" }
    },
    ring: {
      left: { left: "23.1%", top: "53.4%" },
      center: { left: "50.4%", top: "49%" },
      right: { left: "78.2%", top: "53.4%" }
    },
    pendant: {
      heart: { left: "50.3%", top: "55.3%" },
      moon: { left: "51.2%", top: "53.5%" },
      drop: { left: "49.8%", top: "58.3%" }
    },
    earrings: {
      left: { left: "29.9%", top: "65.1%" },
      right: { left: "70.8%", top: "65.1%" }
    }
  }
};

function deepMerge(target, source) {
  const output = { ...target };
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      output[key] = deepMerge(target?.[key] || {}, value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

async function readConstructorLayouts() {
  try {
    const raw = await fs.readFile(LAYOUTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return deepMerge(DEFAULT_CONSTRUCTOR_LAYOUTS, parsed);
  } catch (error) {
    if (error.code === "ENOENT") {
      return DEFAULT_CONSTRUCTOR_LAYOUTS;
    }
    throw error;
  }
}

function normalizePercent(value, fallback) {
  const number = Number.parseFloat(String(value || "").replace("%", ""));
  if (!Number.isFinite(number)) return fallback;
  const clamped = Math.min(100, Math.max(0, number));
  return `${Number(clamped.toFixed(2))}%`;
}

function normalizeLayoutPayload(payload = {}) {
  const merged = deepMerge(DEFAULT_CONSTRUCTOR_LAYOUTS, payload);
  const normalized = {
    bases: merged.bases,
    positions: {
      bracelet: {},
      ring: {},
      pendant: {},
      earrings: {}
    }
  };

  for (const [slotId, point] of Object.entries(merged.positions?.bracelet || {})) {
    normalized.positions.bracelet[slotId] = {
      left: normalizePercent(point?.left, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.bracelet[slotId]?.left || "50%"),
      top: normalizePercent(point?.top, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.bracelet[slotId]?.top || "50%")
    };
  }

  for (const [slotId, point] of Object.entries(merged.positions?.ring || {})) {
    normalized.positions.ring[slotId] = {
      left: normalizePercent(point?.left, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.ring[slotId]?.left || "50%"),
      top: normalizePercent(point?.top, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.ring[slotId]?.top || "50%")
    };
  }

  for (const [shapeId, point] of Object.entries(merged.positions?.pendant || {})) {
    normalized.positions.pendant[shapeId] = {
      left: normalizePercent(point?.left, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.pendant[shapeId]?.left || "50%"),
      top: normalizePercent(point?.top, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.pendant[shapeId]?.top || "50%")
    };
  }

  for (const [slotId, point] of Object.entries(merged.positions?.earrings || {})) {
    normalized.positions.earrings[slotId] = {
      left: normalizePercent(point?.left, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.earrings[slotId]?.left || "50%"),
      top: normalizePercent(point?.top, DEFAULT_CONSTRUCTOR_LAYOUTS.positions.earrings[slotId]?.top || "50%")
    };
  }

  return normalized;
}

async function writeConstructorLayouts(payload = {}) {
  const nextLayouts = normalizeLayoutPayload(payload);
  await fs.mkdir(path.dirname(LAYOUTS_FILE), { recursive: true });
  await fs.writeFile(LAYOUTS_FILE, JSON.stringify(nextLayouts, null, 2), "utf8");
  return nextLayouts;
}

module.exports = {
  DEFAULT_CONSTRUCTOR_LAYOUTS,
  readConstructorLayouts,
  writeConstructorLayouts
};
