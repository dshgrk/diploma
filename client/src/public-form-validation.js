// Файл містить логіку public-form-validation.
export const PUBLIC_FIELD_LIMITS = {
  nameMax: 120,
  addressMin: 5,
  addressMax: 240,
  passwordMin: 6,
  verificationCodeLength: 6
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UA_PHONE_PATTERN = /^\+380\d{9}$/;

// Виконує локальну логіку messages для модуля public-form-validation.
function messages(locale) {
  if (locale === "uk") {
    return {
      nameRequired: "Введіть ім'я.",
      nameTooLong: `Ім'я має бути не довше ${PUBLIC_FIELD_LIMITS.nameMax} символів.`,
      phoneRequired: "Введіть номер телефону.",
      phoneInvalid: "Введіть коректний український номер у форматі +380991234567.",
      emailRequired: "Введіть email.",
      emailInvalid: "Введіть коректний email.",
      passwordRequired: "Введіть пароль.",
      passwordTooShort: `Пароль має містити щонайменше ${PUBLIC_FIELD_LIMITS.passwordMin} символів.`,
      verificationCodeRequired: "Введіть код підтвердження.",
      verificationCodeInvalid: "Код підтвердження має містити 6 цифр.",
      addressRequired: "Введіть адресу доставки.",
      addressTooShort: `Адреса має містити щонайменше ${PUBLIC_FIELD_LIMITS.addressMin} символів.`,
      addressTooLong: `Адреса має бути не довшою за ${PUBLIC_FIELD_LIMITS.addressMax} символів.`,
      deliveryMethodRequired: "Оберіть спосіб доставки.",
      acceptedOfferRequired: "Щоб оформити замовлення, потрібно прийняти Публічну оферту та умови оформлення замовлення.",
      invalidRange: "Поле \"Від\" не може бути більшим за \"До\"."
    };
  }

  return {
    nameRequired: "Enter your name.",
    nameTooLong: `Name must be at most ${PUBLIC_FIELD_LIMITS.nameMax} characters long.`,
    phoneRequired: "Enter a phone number.",
    phoneInvalid: "Enter a valid Ukrainian phone number in the format +380991234567.",
    emailRequired: "Enter an email address.",
    emailInvalid: "Enter a valid email address.",
    passwordRequired: "Enter a password.",
    passwordTooShort: `Password must be at least ${PUBLIC_FIELD_LIMITS.passwordMin} characters long.`,
    verificationCodeRequired: "Enter the verification code.",
    verificationCodeInvalid: "Verification code must contain 6 digits.",
    addressRequired: "Enter a delivery address.",
    addressTooShort: `Address must be at least ${PUBLIC_FIELD_LIMITS.addressMin} characters long.`,
    addressTooLong: `Address must be at most ${PUBLIC_FIELD_LIMITS.addressMax} characters long.`,
    deliveryMethodRequired: "Choose a delivery method.",
    acceptedOfferRequired: "To place the order, you must accept the Public Offer and the order terms.",
    invalidRange: "\"From\" cannot be greater than \"To\"."
  };
}

// Нормалізує normalize email, щоб API та UI працювали з однаковим форматом даних.
export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

// Перевіряє is valid email і повертає результат або кидає помилку валідації.
export function isValidEmail(value) {
  return EMAIL_PATTERN.test(normalizeEmail(value));
}

// Виконує локальну логіку sanitize phone draft для модуля public-form-validation.
export function sanitizePhoneDraft(value) {
  const raw = String(value || "");
  let cleaned = "";
  for (const char of raw) {
    if (/\d/.test(char)) {
      cleaned += char;
      continue;
    }
    if (char === "+" && cleaned === "") {
      cleaned = "+";
    }
  }
  return cleaned;
}

// Нормалізує normalize ukrainian phone, щоб API та UI працювали з однаковим форматом даних.
export function normalizeUkrainianPhone(value) {
  const compact = sanitizePhoneDraft(value);
  if (/^0\d{9}$/.test(compact)) return `+38${compact}`;
  if (/^380\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}

// Перевіряє is valid ukrainian phone і повертає результат або кидає помилку валідації.
export function isValidUkrainianPhone(value) {
  return UA_PHONE_PATTERN.test(normalizeUkrainianPhone(value));
}

// Нормалізує normalize plain text, щоб API та UI працювали з однаковим форматом даних.
export function normalizePlainText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

// Нормалізує normalize engraving text, щоб API та UI працювали з однаковим форматом даних.
export function normalizeEngravingText(value) {
  return String(value || "").trim();
}

// Виконує локальну логіку sanitize verification code для модуля public-form-validation.
export function sanitizeVerificationCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, PUBLIC_FIELD_LIMITS.verificationCodeLength);
}

// Виконує локальну логіку sanitize quantity input для модуля public-form-validation.
export function sanitizeQuantityInput(value, max) {
  const trimmed = String(value || "").trim();
  const match = trimmed.match(/^\d+/);
  const parsed = Number.parseInt(match?.[0] || "1", 10);
  const safe = Number.isFinite(parsed) ? parsed : 1;
  return Math.min(max, Math.max(1, safe));
}

// Нормалізує normalize catalog price input, щоб API та UI працювали з однаковим форматом даних.
export function normalizeCatalogPriceInput(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

// Перевіряє validate catalog price range і повертає результат або кидає помилку валідації.
export function validateCatalogPriceRange({ priceMin, priceMax }, locale) {
  const copy = messages(locale);
  const min = priceMin === "" ? null : Number(priceMin);
  const max = priceMax === "" ? null : Number(priceMax);

  if ((min != null && min < 0) || (max != null && max < 0)) {
    return { isValid: false, error: copy.invalidRange };
  }

  if (min != null && max != null && min > max) {
    return { isValid: false, error: copy.invalidRange };
  }

  return { isValid: true, error: "" };
}

// Перевіряє validate auth form і повертає результат або кидає помилку валідації.
export function validateAuthForm({ mode, name, email, password }, locale) {
  const copy = messages(locale);
  const errors = {};
  const values = {
    full_name: normalizePlainText(name),
    email: normalizeEmail(email),
    password: String(password || "")
  };

  if (mode === "register") {
    if (!values.full_name) errors.name = copy.nameRequired;
    else if (values.full_name.length > PUBLIC_FIELD_LIMITS.nameMax) errors.name = copy.nameTooLong;
  }

  if (!values.email) errors.email = copy.emailRequired;
  else if (!isValidEmail(values.email)) errors.email = copy.emailInvalid;

  if (!values.password) errors.password = copy.passwordRequired;
  else if (values.password.length < PUBLIC_FIELD_LIMITS.passwordMin) errors.password = copy.passwordTooShort;

  return { values, errors };
}

// Перевіряє validate verification code і повертає результат або кидає помилку валідації.
export function validateVerificationCode(value, locale) {
  const copy = messages(locale);
  const normalized = sanitizeVerificationCode(value);
  if (!normalized) return { value: normalized, error: copy.verificationCodeRequired };
  if (normalized.length !== PUBLIC_FIELD_LIMITS.verificationCodeLength) {
    return { value: normalized, error: copy.verificationCodeInvalid };
  }
  return { value: normalized, error: "" };
}

// Перевіряє validate checkout form і повертає результат або кидає помилку валідації.
export function validateCheckoutForm(form, locale) {
  const copy = messages(locale);
  const values = {
    customer_name: normalizePlainText(form.customer_name),
    email: normalizeEmail(form.email),
    phone: normalizeUkrainianPhone(form.phone),
    delivery_method: String(form.delivery_method || "").trim(),
    delivery_address: normalizePlainText(form.delivery_address),
    accepted_offer: Boolean(form.accepted_offer)
  };
  const errors = {};

  if (!values.customer_name) errors.customer_name = copy.nameRequired;
  else if (values.customer_name.length > PUBLIC_FIELD_LIMITS.nameMax) errors.customer_name = copy.nameTooLong;

  if (!values.phone) errors.phone = copy.phoneRequired;
  else if (!isValidUkrainianPhone(values.phone)) errors.phone = copy.phoneInvalid;

  if (!values.delivery_method) errors.delivery_method = copy.deliveryMethodRequired;

  if (!values.delivery_address) errors.delivery_address = copy.addressRequired;
  else if (values.delivery_address.length < PUBLIC_FIELD_LIMITS.addressMin) errors.delivery_address = copy.addressTooShort;
  else if (values.delivery_address.length > PUBLIC_FIELD_LIMITS.addressMax) errors.delivery_address = copy.addressTooLong;

  if (!values.accepted_offer) errors.accepted_offer = copy.acceptedOfferRequired;

  return { values, errors };
}

// Виконує локальну логіку extract validation errors для модуля public-form-validation.
export function extractValidationErrors(error) {
  return error?.payload?.error?.details && typeof error.payload.error.details === "object"
    ? error.payload.error.details
    : {};
}
