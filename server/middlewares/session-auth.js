const { db } = require("../db/knex");
const { env } = require("../config/env");
const { hashSessionToken } = require("../utils/session");

async function attachSessionUser(req, res, next) {
  try {
    const sessionToken = req.cookies?.[env.sessionCookieName];
    if (!sessionToken) {
      req.user = null;
      req.session = null;
      return next();
    }

    const tokenHash = hashSessionToken(sessionToken);
    const session = await db("sessions")
      .join("users", "sessions.user_id", "users.id")
      .select(
        "sessions.id as session_id",
        "sessions.user_id",
        "sessions.expires_at",
        "users.id",
        "users.role",
        "users.full_name",
        "users.email",
        "users.phone",
        "users.preferred_locale",
        "users.auth_provider",
        "users.email_verified_at",
        "users.is_active"
      )
      .where("sessions.token_hash", tokenHash)
      .first();

    if (!session) {
      req.user = null;
      req.session = null;
      return next();
    }

    if (new Date(session.expires_at).getTime() < Date.now() || !session.is_active) {
      await db("sessions").where({ id: session.session_id }).del();
      req.user = null;
      req.session = null;
      return next();
    }

    req.session = {
      id: session.session_id,
      userId: session.user_id
    };
    req.user = {
      id: session.id,
      role: session.role,
      full_name: session.full_name,
      email: session.email,
      phone: session.phone,
      preferred_locale: session.preferred_locale,
      auth_provider: session.auth_provider,
      email_verified_at: session.email_verified_at
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { attachSessionUser };
