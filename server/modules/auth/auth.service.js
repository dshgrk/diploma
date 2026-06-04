// Файл містить бізнес-логіку серверного модуля auth та готує дані для API.
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { db } = require("../../db/knex");
const { env } = require("../../config/env");
const { ROLES } = require("../../constants/roles");
const { createHttpError } = require("../../utils/http-error");
const { generateSessionToken, hashSessionToken } = require("../../utils/session");
const { logger } = require("../../utils/logger");
const {
  PUBLIC_FIELD_LIMITS,
  isValidEmail,
  normalizeEmail,
  normalizePlainText,
  normalizeVerificationCode
} = require("../../utils/public-input-validation");
const {
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationCodeEmail
} = require("../notifications/notifications.service");

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

// Отримує get cookie options з поточного набору даних або конфігурації.
function getCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    maxAge: env.sessionTtlHours * 60 * 60 * 1000
  };
}

// Отримує get clear cookie options з поточного набору даних або конфігурації.
function getClearCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction
  };
}

// Виконує локальну логіку serialize user для модуля серверного модуля auth.
function serializeUser(user) {
  return {
    id: user.id,
    role: user.role,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    preferred_locale: user.preferred_locale,
    auth_provider: user.auth_provider || "local",
    email_verified_at: user.email_verified_at || null,
    email_verified: Boolean(user.email_verified_at)
  };
}

// Створює новий запис або чернетку для create session for user.
async function createSessionForUser(userId, req, res) {
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 60 * 60 * 1000);

  await db("sessions").insert({
    id: sessionId,
    user_id: userId,
    token_hash: tokenHash,
    ip_address: req.ip,
    user_agent: req.headers["user-agent"] || "",
    expires_at: expiresAt
  });

  res.cookie(env.sessionCookieName, rawToken, getCookieOptions());
}

// Виконує локальну логіку destroy session для модуля серверного модуля auth.
async function destroySession(req, res) {
  const token = req.cookies?.[env.sessionCookieName];
  if (token) {
    await db("sessions").where({ token_hash: hashSessionToken(token) }).del();
  }

  res.clearCookie(env.sessionCookieName, getClearCookieOptions());
}

// Перевіряє validate local login payload і повертає результат або кидає помилку валідації.
function validateLocalLoginPayload(payload) {
  const errors = {};
  if (!payload.email?.trim()) errors.email = "Email is required";
  else if (!isValidEmail(payload.email)) errors.email = "Email must be valid";
  if (!payload.password?.trim()) errors.password = "Password is required";
  if (Object.keys(errors).length > 0) {
    throw createHttpError(422, "VALIDATION_ERROR", "Invalid authentication payload", errors);
  }
}

// Перевіряє validate register payload і повертає результат або кидає помилку валідації.
function validateRegisterPayload(payload) {
  const errors = {};
  if (!(payload.full_name || payload.name)?.trim()) errors.full_name = "Full name is required";
  else if (normalizePlainText(payload.full_name || payload.name).length > PUBLIC_FIELD_LIMITS.nameMax) {
    errors.full_name = `Full name must be at most ${PUBLIC_FIELD_LIMITS.nameMax} characters long`;
  }
  if (!payload.email?.trim()) errors.email = "Email is required";
  else if (!isValidEmail(payload.email)) errors.email = "Email must be valid";
  if (!payload.password?.trim()) errors.password = "Password is required";
  if (payload.password && payload.password.length < PUBLIC_FIELD_LIMITS.passwordMin) {
    errors.password = `Password must be at least ${PUBLIC_FIELD_LIMITS.passwordMin} characters long`;
  }
  if (Object.keys(errors).length > 0) {
    throw createHttpError(422, "VALIDATION_ERROR", "Invalid authentication payload", errors);
  }
}

// Створює новий запис або чернетку для create verification challenge.
async function createVerificationChallenge(user) {
  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + env.emailVerificationTtlMinutes * 60 * 1000);

  await db("email_verification_codes")
    .where({ user_id: user.id, purpose: "account_verification" })
    .whereNull("consumed_at")
    .update({ consumed_at: db.fn.now() });

  await db("email_verification_codes").insert({
    user_id: user.id,
    email: user.email,
    code_hash: codeHash,
    purpose: "account_verification",
    expires_at: expiresAt
  });

  await sendVerificationCodeEmail({
    email: user.email,
    code
  });

  return {
    email: user.email,
    expires_at: expiresAt.toISOString()
  };
}

// Виконує локальну логіку register client для модуля серверного модуля auth.
async function registerClient(payload) {
  validateRegisterPayload(payload);
  const email = normalizeEmail(payload.email);
  const existingUser = await db("users").where({ email }).first();

  if (existingUser) {
    throw createHttpError(409, "EMAIL_ALREADY_USED", "User with this email already exists");
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const [userId] = await db("users").insert({
    role: ROLES.CLIENT,
    full_name: normalizePlainText(payload.full_name || payload.name),
    email,
    phone: null,
    password_hash: passwordHash,
    preferred_locale: payload.preferred_locale === "en" ? "en" : env.defaultLocale,
    auth_provider: "local",
    email_verified_at: null,
    is_active: true
  });

  const user = await db("users").where({ id: userId }).first();
  const verification = await createVerificationChallenge(user);
  logger.info("Client registered pending verification", { userId, email });

  return {
    user: serializeUser(user),
    verification_required: true,
    verification
  };
}

// Виконує локальну логіку verify email code для модуля серверного модуля auth.
async function verifyEmailCode(payload, req, res) {
  const email = normalizeEmail(payload.email);
  const code = normalizeVerificationCode(payload.code);
  const errors = {};
  if (!email) {
    errors.email = "Email is required";
  } else if (!isValidEmail(email)) {
    errors.email = "Email must be valid";
  }
  if (!code) {
    errors.code = "Code is required";
  } else if (code.length !== PUBLIC_FIELD_LIMITS.verificationCodeLength) {
    errors.code = `Code must contain ${PUBLIC_FIELD_LIMITS.verificationCodeLength} digits`;
  }
  if (Object.keys(errors).length > 0) {
    throw createHttpError(422, "VALIDATION_ERROR", "Email and code are required", errors);
  }

  const user = await db("users").where({ email }).first();
  if (!user) {
    throw createHttpError(404, "USER_NOT_FOUND", "User not found");
  }

  const verification = await db("email_verification_codes")
    .where({ user_id: user.id, purpose: "account_verification" })
    .whereNull("consumed_at")
    .orderBy("created_at", "desc")
    .first();

  if (!verification) {
    throw createHttpError(410, "VERIFICATION_CODE_MISSING", "Verification code is missing or expired");
  }

  if (new Date(verification.expires_at).getTime() < Date.now()) {
    throw createHttpError(410, "VERIFICATION_CODE_EXPIRED", "Verification code has expired");
  }

  const incomingHash = hashVerificationCode(code);
  if (incomingHash !== verification.code_hash) {
    await db("email_verification_codes")
      .where({ id: verification.id })
      .update({ attempt_count: Number(verification.attempt_count || 0) + 1 });
    throw createHttpError(422, "INVALID_VERIFICATION_CODE", "Verification code is incorrect");
  }

  await db.transaction(async (trx) => {
    await trx("email_verification_codes").where({ id: verification.id }).update({ consumed_at: trx.fn.now() });
    await trx("users").where({ id: user.id }).update({ email_verified_at: trx.fn.now(), updated_at: trx.fn.now() });
  });

  const verifiedUser = await db("users").where({ id: user.id }).first();
  await createSessionForUser(verifiedUser.id, req, res);
  logger.info("Email verified", { userId: verifiedUser.id });
  return serializeUser(verifiedUser);
}

// Виконує локальну логіку resend verification code для модуля серверного модуля auth.
async function resendVerificationCode(payload) {
  const email = normalizeEmail(payload.email);
  if (!email) {
    throw createHttpError(422, "VALIDATION_ERROR", "Email is required", { email: "Email is required" });
  }
  if (!isValidEmail(email)) {
    throw createHttpError(422, "VALIDATION_ERROR", "Email must be valid", { email: "Email must be valid" });
  }

  const user = await db("users").where({ email }).first();
  if (!user) {
    throw createHttpError(404, "USER_NOT_FOUND", "User not found");
  }

  if (user.email_verified_at) {
    return {
      already_verified: true
    };
  }

  const verification = await createVerificationChallenge(user);
  return {
    verification_required: true,
    verification
  };
}

// Виконує локальну логіку login user для модуля серверного модуля auth.
async function loginUser(payload, req, res, role = null) {
  validateLocalLoginPayload(payload);
  const email = normalizeEmail(payload.email);
  const user = await db("users").where({ email }).first();

  if (!user) {
    throw createHttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (!user.password_hash) {
    throw createHttpError(409, "GOOGLE_LOGIN_REQUIRED", "Use Google sign-in for this account");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password_hash);
  if (!isPasswordValid) {
    throw createHttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (!user.email_verified_at) {
    throw createHttpError(403, "EMAIL_NOT_VERIFIED", "Please verify your email first");
  }

  if (!user.is_active) {
    throw createHttpError(403, "USER_DISABLED", "User account is disabled");
  }

  if (role && user.role !== role) {
    throw createHttpError(403, "FORBIDDEN", "This user role is not allowed here");
  }

  await createSessionForUser(user.id, req, res);
  logger.info("User logged in", { userId: user.id, role: user.role });
  return serializeUser(user);
}

// Виконує локальну логіку login with google для модуля серверного модуля auth.
async function loginWithGoogle(payload, req, res) {
  if (!env.googleAuthEnabled || !googleClient) {
    throw createHttpError(503, "GOOGLE_AUTH_DISABLED", "Google sign-in is not configured");
  }

  const credential = String(payload.credential || "").trim();
  if (!credential) {
    throw createHttpError(422, "VALIDATION_ERROR", "Google credential is required", {
      credential: "Google credential is required"
    });
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.googleClientId
  });
  const googlePayload = ticket.getPayload();
  const email = normalizeEmail(googlePayload?.email);

  if (!googlePayload?.sub || !email || !googlePayload.email_verified) {
    throw createHttpError(422, "INVALID_GOOGLE_ACCOUNT", "Google account did not provide a verified email");
  }

  let user = await db("users").where({ google_sub: googlePayload.sub }).first();
  if (!user) {
    user = await db("users").where({ email }).first();
  }

  if (!user) {
    const randomPasswordHash = await bcrypt.hash(crypto.randomUUID(), 10);
    const [userId] = await db("users").insert({
      role: ROLES.CLIENT,
      full_name: String(googlePayload.name || email.split("@")[0]).trim(),
      email,
      phone: null,
      password_hash: randomPasswordHash,
      preferred_locale: env.defaultLocale,
      auth_provider: "google",
      google_sub: googlePayload.sub,
      email_verified_at: db.fn.now(),
      is_active: true
    });
    user = await db("users").where({ id: userId }).first();
  } else {
    await db("users").where({ id: user.id }).update({
      google_sub: user.google_sub || googlePayload.sub,
      auth_provider: "google",
      email_verified_at: user.email_verified_at || db.fn.now(),
      updated_at: db.fn.now()
    });
    user = await db("users").where({ id: user.id }).first();
  }

  if (!user.is_active) {
    throw createHttpError(403, "USER_DISABLED", "User account is disabled");
  }

  await createSessionForUser(user.id, req, res);
  logger.info("User logged in with Google", { userId: user.id });
  return serializeUser(user);
}

// Отримує get google auth config з поточного набору даних або конфігурації.
function getGoogleAuthConfig() {
  return {
    enabled: env.googleAuthEnabled,
    client_id: env.googleClientId || ""
  };
}

module.exports = {
  destroySession,
  getGoogleAuthConfig,
  loginUser,
  loginWithGoogle,
  registerClient,
  resendVerificationCode,
  serializeUser,
  verifyEmailCode
};
