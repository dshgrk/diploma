import React, { useEffect, useState } from "react";
import { Award, Check, Shield, Sparkles, Truck } from "lucide-react";
import { authApi, cartApi } from "../api";
import { FALLBACK_PRODUCT_IMAGE } from "../content";
import {
  extractValidationErrors,
  normalizeUkrainianPhone,
  sanitizePhoneDraft,
  sanitizeVerificationCode,
  validateAuthForm,
  validateVerificationCode
} from "../public-form-validation";
import { AuroraBackground, Footer, Header, usePublicLocale } from "./public-shell.jsx";
import "../styles.css";

const GUEST_CART_STORAGE_KEY = "aurora-guest-cart";
const PENDING_CART_ITEM_KEY = "aurora-pending-cart-item";
const POST_AUTH_REDIRECT_KEY = "aurora-post-auth-redirect";

const COPY = {
  uk: {
    account: "Акаунт",
    authAsideLoginText: "Увійдіть, щоб бачити історію замовлень, зберігати кошик і швидше оформлювати нові прикраси.",
    authAsideRegisterText: "Створіть акаунт, щоб ми зберегли ваші замовлення, контакти та персональні прикраси.",
    authAsideVerifyText: "Підтвердіть email, щоб завершити створення акаунта і продовжити оформлення.",
    authBackToLogin: "Повернутися до входу",
    authGoogle: "Продовжити з Google",
    authLoginBadge: "Повернення до ательє",
    authLoginLead: "Увійдіть у свій акаунт Aurora Atelier.",
    authLoginTab: "Вхід",
    authLoginTitle: "Увійти в акаунт",
    authPasswordHint: "Мінімум 6 символів.",
    authRegisterBadge: "Новий клієнт",
    authRegisterChip1: "Персональний кошик",
    authRegisterChip2: "Історія замовлень",
    authRegisterLead: "Створіть акаунт для персональних замовлень.",
    authRegisterTab: "Реєстрація",
    authRegisterTitle: "Створити акаунт",
    authResendCode: "Надіслати код ще раз",
    authSignInChip1: "Збережений кошик",
    authSignInChip2: "Швидке оформлення",
    authSubmitLogin: "Увійти",
    authSubmitRegister: "Зареєструватися",
    authSubmitVerification: "Підтвердити email",
    authVerificationCode: "Код підтвердження",
    authVerificationText: "Введіть 6-значний код, який ми надіслали на email.",
    authVerificationTitle: "Підтвердіть email",
    authVerifyBadge: "Підтвердження",
    authVerifyChip1: "Безпечний акаунт",
    authVerifyChip2: "Доступ до замовлень",
    authVerifyLead: "Залишився один крок.",
    bespokeService: "Private atelier service",
    bespokeTitle: "Ваш простір Aurora",
    creatingOrder: "Зачекайте...",
    email: "Email",
    fillRequired: "обов'язкове поле",
    name: "Ім'я",
    password: "Пароль",
    phone: "Телефон",
    trustDelivery: "Доставка",
    trustDeliveryText: "Акуратне пакування і супровід.",
    trustGuarantee: "Гарантія",
    trustGuaranteeText: "Підтримка після покупки.",
    trustMaterials: "Матеріали",
    trustMaterialsText: "Прозорий опис металів і каменів.",
    trustService: "Сервіс",
    trustServiceText: "Персональна комунікація."
  },
  en: {
    account: "Account",
    authAsideLoginText: "Sign in to see orders, keep your cart and check out faster.",
    authAsideRegisterText: "Create an account so we can save your orders, contacts and custom pieces.",
    authAsideVerifyText: "Verify your email to finish account creation and continue.",
    authBackToLogin: "Back to login",
    authGoogle: "Continue with Google",
    authLoginBadge: "Return to the atelier",
    authLoginLead: "Sign in to your Aurora Atelier account.",
    authLoginTab: "Login",
    authLoginTitle: "Sign in",
    authPasswordHint: "Minimum 6 characters.",
    authRegisterBadge: "New client",
    authRegisterChip1: "Personal cart",
    authRegisterChip2: "Order history",
    authRegisterLead: "Create an account for personal orders.",
    authRegisterTab: "Register",
    authRegisterTitle: "Create account",
    authResendCode: "Send code again",
    authSignInChip1: "Saved cart",
    authSignInChip2: "Fast checkout",
    authSubmitLogin: "Sign in",
    authSubmitRegister: "Register",
    authSubmitVerification: "Verify email",
    authVerificationCode: "Verification code",
    authVerificationText: "Enter the 6-digit code we sent to your email.",
    authVerificationTitle: "Verify email",
    authVerifyBadge: "Verification",
    authVerifyChip1: "Secure account",
    authVerifyChip2: "Order access",
    authVerifyLead: "One step remains.",
    bespokeService: "Private atelier service",
    bespokeTitle: "Your Aurora space",
    creatingOrder: "Please wait...",
    email: "Email",
    fillRequired: "is required",
    name: "Name",
    password: "Password",
    phone: "Phone",
    trustDelivery: "Delivery",
    trustDeliveryText: "Careful packaging and support.",
    trustGuarantee: "Guarantee",
    trustGuaranteeText: "Post-purchase support.",
    trustMaterials: "Materials",
    trustMaterialsText: "Clear metal and stone details.",
    trustService: "Service",
    trustServiceText: "Personal communication."
  }
};

function text(locale, key) {
  return COPY[locale]?.[key] || COPY.en[key] || key;
}

function readGuestCart() {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return { items: Array.isArray(parsed?.items) ? parsed.items : [] };
  } catch {
    return { items: [] };
  }
}

function clearGuestCart() {
  window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("aurora:cart-updated", { detail: { count: 0 } }));
}

function syncCartCount(cart) {
  const count = (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  window.dispatchEvent(new CustomEvent("aurora:cart-updated", { detail: { count } }));
  return count;
}

async function mergeGuestCartIntoAccountCart() {
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

function consumePendingCartItem() {
  try {
    const raw = window.sessionStorage.getItem(PENDING_CART_ITEM_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_CART_ITEM_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function consumePostAuthRedirect() {
  try {
    const next = window.sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
    window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    return next || "";
  } catch {
    return "";
  }
}

function AuthPage({ locale }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [googleConfig, setGoogleConfig] = useState({ enabled: false, client_id: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const googleButtonRef = React.useRef(null);
  const isUk = locale === "uk";
  const isVerifyStep = Boolean(pendingVerificationEmail);

  const authBenefits = [
    { icon: Shield, label: text(locale, "trustGuarantee"), body: text(locale, "trustGuaranteeText") },
    { icon: Truck, label: text(locale, "trustDelivery"), body: text(locale, "trustDeliveryText") },
    { icon: Award, label: text(locale, "trustMaterials"), body: text(locale, "trustMaterialsText") },
    { icon: Sparkles, label: text(locale, "trustService"), body: text(locale, "trustServiceText") }
  ];

  const modeMeta = isVerifyStep
    ? {
        badge: text(locale, "authVerifyBadge"),
        lead: text(locale, "authVerifyLead"),
        chips: [text(locale, "authVerifyChip1"), text(locale, "authVerifyChip2")],
        asideText: text(locale, "authAsideVerifyText")
      }
    : mode === "login"
      ? {
          badge: text(locale, "authLoginBadge"),
          lead: text(locale, "authLoginLead"),
          chips: [text(locale, "authSignInChip1"), text(locale, "authSignInChip2")],
          asideText: text(locale, "authAsideLoginText")
        }
      : {
          badge: text(locale, "authRegisterBadge"),
          lead: text(locale, "authRegisterLead"),
          chips: [text(locale, "authRegisterChip1"), text(locale, "authRegisterChip2")],
          asideText: text(locale, "authAsideRegisterText")
        };

  useEffect(() => {
    let active = true;
    authApi.getGoogleConfig()
      .then((config) => {
        if (active) setGoogleConfig(config);
      })
      .catch(() => {
        if (active) setGoogleConfig({ enabled: false, client_id: "" });
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!googleConfig.enabled || !googleConfig.client_id || isVerifyStep) return undefined;
    let cancelled = false;

    function renderGoogleButton() {
      if (cancelled || !googleButtonRef.current || !window.google?.accounts?.id) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleConfig.client_id,
        callback: async (response) => {
          setError("");
          setNotice("");
          setIsSubmitting(true);
          try {
            await authApi.loginWithGoogle(response.credential);
            await finalizeAfterAuth();
          } catch (err) {
            setError(err.message);
          } finally {
            setIsSubmitting(false);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: Math.max(260, Math.min(googleButtonRef.current.clientWidth || 360, 420))
      });
    }

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    document.body.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [googleConfig, isVerifyStep]);

  async function finalizeAfterAuth() {
    const mergedCart = await mergeGuestCartIntoAccountCart();
    const pendingCartItem = consumePendingCartItem();
    let finalCart = mergedCart;
    if (pendingCartItem) {
      finalCart = await cartApi.addItem(pendingCartItem);
      syncCartCount(finalCart);
    }
    const redirectPath = consumePostAuthRedirect();
    if (redirectPath) {
      window.location.href = redirectPath;
      return;
    }
    if (finalCart || pendingCartItem) {
      window.location.href = "/cart";
      return;
    }
    window.location.href = "/orders";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setFieldErrors({});

    if (isVerifyStep) {
      const verification = validateVerificationCode(verificationCode, locale);
      if (verification.error) {
        setFieldErrors({ verificationCode: verification.error });
        return;
      }
      setIsSubmitting(true);
      try {
        await authApi.verifyEmail({ email: pendingVerificationEmail, code: verification.value });
        await finalizeAfterAuth();
      } catch (err) {
        setFieldErrors(extractValidationErrors(err));
        setError(err.message);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const validation = validateAuthForm({ mode, name, phone, email, password }, locale);
    if (Object.keys(validation.errors).length > 0) {
      setFieldErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "register") {
        const result = await authApi.register({
          full_name: validation.values.full_name,
          phone: validation.values.phone,
          email: validation.values.email,
          password: validation.values.password
        });
        if (result?.verification_required) {
          setPendingVerificationEmail(result.verification?.email || validation.values.email);
          setVerificationCode("");
          setNotice(isUk ? "Ми надіслали код підтвердження на вашу пошту." : "We sent a verification code to your email.");
          return;
        }
      } else {
        await authApi.login({ email: validation.values.email, password: validation.values.password });
      }
      await finalizeAfterAuth();
    } catch (err) {
      if (err.payload?.error?.code === "EMAIL_NOT_VERIFIED") {
        setPendingVerificationEmail(validation.values.email);
        setNotice(isUk ? "Спершу підтвердьте email кодом з листа." : "Please verify your email with the code from the message first.");
      }
      setFieldErrors(extractValidationErrors(err));
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError("");
    setNotice("");
    setFieldErrors({});
  }

  async function resendCode() {
    setError("");
    setNotice("");
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await authApi.resendVerificationCode(pendingVerificationEmail);
      setNotice(isUk ? "Новий код уже надіслано." : "A new code has been sent.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetVerificationStep() {
    setPendingVerificationEmail("");
    setVerificationCode("");
    setError("");
    setNotice("");
    setFieldErrors({});
  }

  return (
    <main className="auth-react-page">
      <div className="auth-page-shell">
        <section className="auth-form-panel">
          <div className={`auth-form-card${isVerifyStep ? " is-verify-step" : ""}`}>
            <div className="auth-form-chrome">
              <div className="auth-form-kicker">
                <span className="badge subtle">{text(locale, "account")}</span>
                <p>{modeMeta.badge}</p>
              </div>

              {!isVerifyStep ? (
                <div className="auth-tabs">
                  <button type="button" className={mode === "login" ? "is-active" : ""} onClick={() => switchMode("login")}>
                    {text(locale, "authLoginTab")}
                  </button>
                  <button type="button" className={mode === "register" ? "is-active" : ""} onClick={() => switchMode("register")}>
                    {text(locale, "authRegisterTab")}
                  </button>
                </div>
              ) : (
                <button type="button" className="button button-ghost auth-back-link" onClick={resetVerificationStep} disabled={isSubmitting}>
                  {text(locale, "authBackToLogin")}
                </button>
              )}
            </div>

            <div className="auth-form-inner">
              <div className="section-heading auth-heading-block">
                <h1>{isVerifyStep ? text(locale, "authVerificationTitle") : mode === "login" ? text(locale, "authLoginTitle") : text(locale, "authRegisterTitle")}</h1>
                <p className="auth-helper-copy">{modeMeta.lead}</p>
              </div>

              <div className="auth-chip-row" aria-label="Auth flow highlights">
                {modeMeta.chips.map((chip) => <span key={chip} className="auth-chip">{chip}</span>)}
              </div>

              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {isVerifyStep ? (
                  <>
                    <div className="auth-verify-intro">
                      <p className="auth-helper-copy">{text(locale, "authVerificationText")}</p>
                      <strong>{pendingVerificationEmail}</strong>
                    </div>
                    <label className="auth-field auth-field-verify">
                      <span>{text(locale, "authVerificationCode")}</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        aria-invalid={Boolean(fieldErrors.verificationCode || fieldErrors.code)}
                        value={verificationCode}
                        onChange={(event) => {
                          setVerificationCode(sanitizeVerificationCode(event.target.value));
                          setFieldErrors((current) => ({ ...current, verificationCode: "", code: "" }));
                        }}
                        placeholder="123456"
                        required
                      />
                      {fieldErrors.verificationCode || fieldErrors.code ? <small className="form-field-error">{fieldErrors.verificationCode || fieldErrors.code}</small> : null}
                    </label>
                  </>
                ) : (
                  <>
                    {mode === "register" ? (
                      <div className="auth-field-grid">
                        <label className="auth-field">
                          <span>{text(locale, "name")}</span>
                          <input
                            type="text"
                            autoComplete="name"
                            maxLength={120}
                            aria-invalid={Boolean(fieldErrors.name || fieldErrors.full_name)}
                            value={name}
                            onChange={(event) => {
                              setName(event.target.value);
                              setFieldErrors((current) => ({ ...current, name: "", full_name: "" }));
                            }}
                            placeholder="Aurora Atelier"
                            required
                          />
                          {fieldErrors.name || fieldErrors.full_name ? <small className="form-field-error">{fieldErrors.name || fieldErrors.full_name}</small> : null}
                        </label>
                        <label className="auth-field">
                          <span>{text(locale, "phone")}</span>
                          <input
                            type="tel"
                            autoComplete="tel"
                            inputMode="tel"
                            aria-invalid={Boolean(fieldErrors.phone)}
                            value={phone}
                            onChange={(event) => {
                              setPhone(sanitizePhoneDraft(event.target.value));
                              setFieldErrors((current) => ({ ...current, phone: "" }));
                            }}
                            onBlur={() => setPhone((current) => normalizeUkrainianPhone(current))}
                            placeholder="+380991234567"
                            required
                          />
                          {fieldErrors.phone ? <small className="form-field-error">{fieldErrors.phone}</small> : null}
                        </label>
                      </div>
                    ) : null}
                    <label className="auth-field">
                      <span>{text(locale, "email")}</span>
                      <input
                        type="email"
                        autoComplete="email"
                        aria-invalid={Boolean(fieldErrors.email)}
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setFieldErrors((current) => ({ ...current, email: "" }));
                        }}
                        placeholder="you@example.com"
                        required
                      />
                      {fieldErrors.email ? <small className="form-field-error">{fieldErrors.email}</small> : null}
                    </label>
                    <label className="auth-field">
                      <span>{text(locale, "password")}</span>
                      <input
                        type="password"
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        aria-invalid={Boolean(fieldErrors.password)}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setFieldErrors((current) => ({ ...current, password: "" }));
                        }}
                        placeholder="••••••••"
                        minLength={6}
                        required
                      />
                      {fieldErrors.password ? <small className="form-field-error">{fieldErrors.password}</small> : null}
                      <small className="auth-field-note">{text(locale, "authPasswordHint")}</small>
                    </label>
                  </>
                )}

                {error ? <p className="auth-error">{error}</p> : null}
                {notice ? <p className="auth-notice">{notice}</p> : null}

                <button type="submit" className="button auth-submit-button" disabled={isSubmitting}>
                  {isSubmitting
                    ? text(locale, "creatingOrder")
                    : isVerifyStep
                      ? text(locale, "authSubmitVerification")
                      : mode === "login"
                        ? text(locale, "authSubmitLogin")
                        : text(locale, "authSubmitRegister")}
                  <Check aria-hidden="true" />
                </button>

                {isVerifyStep ? (
                  <div className="auth-secondary-actions">
                    <button type="button" className="button button-outline auth-secondary-button" onClick={resendCode} disabled={isSubmitting}>
                      {text(locale, "authResendCode")}
                    </button>
                    <button type="button" className="button button-ghost auth-secondary-button" onClick={resetVerificationStep} disabled={isSubmitting}>
                      {text(locale, "authBackToLogin")}
                    </button>
                  </div>
                ) : null}
              </form>

              {!isVerifyStep && googleConfig.enabled ? (
                <div className="auth-oauth-panel">
                  <div className="auth-divider"><span>{isUk ? "або" : "or"}</span></div>
                  <div className="auth-google-shell">
                    <div ref={googleButtonRef} className="auth-google-button" aria-label={text(locale, "authGoogle")} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="auth-aside">
          <img src={FALLBACK_PRODUCT_IMAGE} alt="Aurora Atelier" />
          <div className="auth-aside-overlay" />
          <div className="auth-aside-content">
            <span className="badge badge-on-dark">{text(locale, "bespokeService")}</span>
            <h2>{text(locale, "bespokeTitle")}</h2>
            <p className="auth-aside-text">{modeMeta.asideText}</p>
            <div className="auth-benefits">
              {authBenefits.map(({ icon: Icon, label, body }) => (
                <article key={label} className="auth-benefit-card">
                  <span className="auth-benefit-icon"><Icon aria-hidden="true" /></span>
                  <div>
                    <strong>{label}</strong>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function AuthRoute() {
  const { locale, toggleLocale } = usePublicLocale();

  return (
    <>
      <AuroraBackground />
      <div className="app-shell">
        <Header locale={locale} onToggleLocale={toggleLocale} />
        <AuthPage locale={locale} />
        <Footer locale={locale} />
      </div>
    </>
  );
}
