// Файл збирає змінні середовища в один типізований об'єкт конфігурації сервера.
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Читає boolean-змінні середовища з безпечним значенням за замовчуванням.
function readBooleanEnv(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return String(value).toLowerCase() === "true" || value === "1";
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  appUrl: process.env.APP_URL || "http://localhost:3000",
  dbDebug: readBooleanEnv("DB_DEBUG", false),
  defaultLocale: process.env.DEFAULT_LOCALE || "uk",
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "artisan_session",
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS || 72),
  mockEmailFailFor: process.env.MOCK_EMAIL_FAIL_FOR || "",
  emailVerificationTtlMinutes: Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES || 15),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: String(process.env.SMTP_SECURE || "false") === "true",
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  smtpFrom: process.env.SMTP_FROM || "Aurora Atelier <no-reply@example.com>",
  trustProxy: readBooleanEnv("TRUST_PROXY", false),
  isProduction: (process.env.NODE_ENV || "development") === "production"
};

env.googleAuthEnabled = Boolean(env.googleClientId);
env.smtpConfigured = Boolean(env.smtpHost && env.smtpFrom);

module.exports = { env };
