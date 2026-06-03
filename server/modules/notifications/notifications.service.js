// Файл містить бізнес-логіку серверного модуля notifications та готує дані для API.
const crypto = require("crypto");
const { db } = require("../../db/knex");
const { env } = require("../../config/env");
const { logger } = require("../../utils/logger");
const { sendEmail } = require("./mailer.service");

// Формує структуру build verification email для UI, API-відповіді або подальших розрахунків.
function buildVerificationEmail(code) {
  return {
    subject: "Aurora Atelier — код підтвердження акаунта",
    text: `Ваш код підтвердження Aurora Atelier: ${code}. Код дійсний ${env.emailVerificationTtlMinutes} хвилин.`,
    html: `
      <div style="font-family:Manrope,Arial,sans-serif;background:#f4f1ea;padding:32px;color:#101513;">
        <div style="max-width:560px;margin:0 auto;background:#fbfaf6;border:1px solid rgba(16,21,19,.08);border-radius:16px;padding:32px;">
          <h1 style="font-family:Fraunces,Georgia,serif;font-weight:500;margin:0 0 16px;">Підтвердження акаунта</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">Введіть цей код, щоб підтвердити ваш акаунт Aurora Atelier.</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:0.3em;padding:18px 22px;border-radius:12px;background:#efe3cd;color:#8f6733;display:inline-block;border:1px solid rgba(174,138,87,.18);">${code}</div>
          <p style="margin:20px 0 0;font-size:13px;color:#7a6a5c;">Код дійсний ${env.emailVerificationTtlMinutes} хвилин.</p>
        </div>
      </div>
    `
  };
}

// Формує структуру build order status email для UI, API-відповіді або подальших розрахунків.
function buildOrderStatusEmail({ order, status }) {
  const statusLabels = {
    created_pending_payment: "Резерв створено",
    confirmed: "Підтверджено",
    in_progress: "У роботі",
    completed: "Готово"
  };

  const introByStatus = {
    created_pending_payment: "Ми отримали ваше замовлення та зарезервували його в системі. Далі команда ательє зв’яжеться з вами, щоб узгодити підтвердження та передплату.",
    confirmed: "Ми підтвердили ваше замовлення та передали його в роботу ательє.",
    in_progress: "Майстер уже працює над вашим виробом.",
    completed: "Ваше замовлення готове. Ми надішлемо окреме повідомлення щодо видачі або доставки."
  };

  const statusLabel = statusLabels[status] || status;
  const intro = introByStatus[status] || "Статус вашого замовлення оновлено.";
  const orderUrl = `${String(env.appUrl || "http://localhost:3000").replace(/\/+$/, "")}/orders/${order.id}`;

  return {
    subject: `Aurora Atelier — статус замовлення ${order.order_number}`,
    text: `${intro} Поточний статус замовлення ${order.order_number}: ${statusLabel}. Перейти до замовлення: ${orderUrl}`,
    html: `
      <div style="font-family:Manrope,Arial,sans-serif;background:#f4f1ea;padding:32px;color:#101513;">
        <div style="max-width:560px;margin:0 auto;background:#fbfaf6;border:1px solid rgba(16,21,19,.08);border-radius:16px;padding:32px;">
          <p style="margin:0 0 8px;color:#7a6a5c;font-size:12px;text-transform:uppercase;letter-spacing:.16em;">Статус замовлення</p>
          <h1 style="font-family:Fraunces,Georgia,serif;font-weight:500;margin:0 0 12px;">${order.order_number}</h1>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">${intro}</p>
          <div style="padding:18px 22px;border-radius:12px;background:#efe3cd;color:#8f6733;font-size:22px;font-weight:700;display:inline-block;border:1px solid rgba(174,138,87,.18);">${statusLabel}</div>
          <div style="margin-top:24px;">
            <a href="${orderUrl}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#ae8a57;color:#ffffff;text-decoration:none;font-weight:700;box-shadow:0 10px 24px rgba(143,103,51,.22);">Перейти до замовлення</a>
          </div>
          <p style="margin:20px 0 0;font-size:13px;color:#7a6a5c;">Ми також показуємо актуальний статус у вашому акаунті Aurora Atelier.</p>
        </div>
      </div>
    `
  };
}

// Виконує локальну логіку send verification code email для модуля серверного модуля notifications.
async function sendVerificationCodeEmail({ email, code }) {
  const message = buildVerificationEmail(code);
  return sendEmail({
    to: email,
    ...message
  });
}

// Виконує локальну логіку send order status notification для модуля серверного модуля notifications.
async function sendOrderStatusNotification({ order, status }) {
  const [logId] = await db("notification_logs").insert({
    order_id: order.id,
    channel: "email",
    template_code: status === "created_pending_payment" ? "order-created" : "order-status-updated",
    recipient: order.email,
    status: "pending",
    payload_json: JSON.stringify({
      order_number: order.order_number,
      status
    })
  });

  try {
    if (env.mockEmailFailFor && env.mockEmailFailFor === status) {
      throw new Error("Mock email delivery failure");
    }

    const message = buildOrderStatusEmail({ order, status });
    await sendEmail({
      to: order.email,
      ...message
    });

    await db("notification_logs").where({ id: logId }).update({
      status: "sent",
      sent_at: db.fn.now()
    });

    logger.info("Order notification sent", {
      orderId: order.id,
      status,
      logId
    });
  } catch (error) {
    await db("notification_logs").where({ id: logId }).update({
      status: "failed",
      error_message: error.message
    });

    logger.error("Order notification failed", {
      orderId: order.id,
      status,
      logId,
      error: error.message
    });
  }
}

// Виконує локальну логіку generate verification code для модуля серверного модуля notifications.
function generateVerificationCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

// Виконує локальну логіку hash verification code для модуля серверного модуля notifications.
function hashVerificationCode(code) {
  return crypto.createHash("sha256").update(String(code)).digest("hex");
}

module.exports = {
  generateVerificationCode,
  hashVerificationCode,
  sendOrderStatusNotification,
  sendVerificationCodeEmail
};
