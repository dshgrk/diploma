import React, { useState } from "react";
import { authApi } from "../api";
import { FALLBACK_PRODUCT_IMAGE } from "../content";
import { ADMIN_UI } from "../i18n/admin-copy";
import "../styles.css";

export default function AdminLoginRoute() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await authApi.adminLogin({ email, password });
      window.location.href = "/admin/orders";
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-login-react">
      <section className="admin-login-panel">
        <a className="admin-brand" href="/">Aurora Atelier</a>
        <h1>{ADMIN_UI.login.title}</h1>
        <p>{ADMIN_UI.login.subtitle}</p>
        <form className="admin-form-grid" onSubmit={handleSubmit}>
          <label>
            <span>{ADMIN_UI.login.email}</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <label>
            <span>{ADMIN_UI.login.password}</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </label>
          {error ? <p className="admin-error">{error}</p> : null}
          <button className="button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? ADMIN_UI.login.submitting : ADMIN_UI.login.submit}
          </button>
        </form>
      </section>
      <aside className="admin-login-art">
        <img src={FALLBACK_PRODUCT_IMAGE} alt="" />
      </aside>
    </main>
  );
}
