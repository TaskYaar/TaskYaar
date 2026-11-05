import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { sendOtp, errorMessage } from "../services/auth.js";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onPhone = (e) => {
    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(phone);
      sessionStorage.setItem("phone", phone);
      navigate("/verify");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = () => {
    // TODO: Google sign-in
  };

  return (
    <main className="split">
      <section className="brand-panel">
        <Logo size={40} light />
        <h2>
          Kaam bhi, Kamai bhi –<br />
          Apne Sheher Mein
        </h2>
        <p>Post a task or find work in your local area easily.</p>
        <div className="brand-art" aria-hidden="true">🤝</div>
      </section>

      <section className="split-left login-side">
        <form className="login-card" onSubmit={onSubmit} noValidate>
          <p className="welcome">Welcome to</p>
          <h1 className="login-title">
            <Logo size={44} />
          </h1>
          <p className="login-sub">Login or register to continue</p>

          <div className="tabs" role="tablist">
            {["login", "register"].map((m) => (
              <button
                type="button"
                key={m}
                role="tab"
                aria-selected={mode === m}
                className={`tab ${mode === m ? "active" : ""}`}
                onClick={() => setMode(m)}
              >
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>

          <label className="phone-field">
            <span className="cc">🇮🇳 +91</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="98765 43210"
              value={phone}
              onChange={onPhone}
              aria-label="Mobile number"
            />
          </label>
          <p className="field-error" role="alert">{error}</p>

          <button type="submit" className="btn btn-primary btn-wide" disabled={loading}>
            {loading ? "Sending code…" : "Continue"}
          </button>

          <div className="or">or</div>

          <button type="button" className="btn btn-outline btn-wide" onClick={onGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6c1.9-5.6 7.1-9.7 13.6-9.7z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.4 28.8A14.5 14.5 0 0 1 9.5 24c0-1.7.3-3.3.9-4.8l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.5 0-12-4.4-14-10.3l-7.8 6C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continue with Google
          </button>

          <p className="terms">
            By continuing, you agree to our{" "}
            <a href="#">Terms &amp; Conditions</a> and{" "}
            <a href="#">Privacy Policy</a>
          </p>
        </form>
      </section>
    </main>
  );
}