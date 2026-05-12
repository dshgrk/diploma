const nodemailer = require("nodemailer");
const { env } = require("../../config/env");
const { logger } = require("../../utils/logger");

let transporterPromise = null;

async function getTransporter() {
  if (!env.smtpConfigured) return null;
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: env.smtpSecure,
        auth: env.smtpUser
          ? {
              user: env.smtpUser,
              pass: env.smtpPass
            }
          : undefined
      })
    );
  }
  return transporterPromise;
}

async function sendEmail({ to, subject, html, text }) {
  if (env.nodeEnv === "test") {
    logger.info("Test mode email delivery skipped", { to, subject });
    return {
      skipped: true,
      testMode: true
    };
  }

  const transporter = await getTransporter();
  if (!transporter) {
    logger.info("SMTP not configured, email delivery skipped", { to, subject });
    return {
      skipped: true
    };
  }

  const result = await transporter.sendMail({
    from: env.smtpFrom,
    to,
    subject,
    html,
    text
  });

  logger.info("Email sent", {
    to,
    subject,
    messageId: result.messageId
  });

  return result;
}

module.exports = {
  sendEmail
};
