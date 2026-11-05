import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { sendOtp, verifyOtp, registerUser, errorMessage, MOCK, DEMO_OTP } from "../services/auth.js";

const LEN = 6;
const WAIT = 30;

const readSignup = () => {
  try { return JSON.parse(sessionStorage.getItem("signup")); }
  catch { return null; }
};

export default function Verify() {
  const phone = sessionStorage.getItem("phone");
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();

  const [digits, setDigits] = useState(Array(LEN).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [left, setLeft] = useState(WAIT);
  const refs = useRef([]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  if (!phone) return <Navigate to="/login" replace />;

  const submit = async (code) => {
    setLoading(true);
    setError("");

    let result;
    try {
      result = await verifyOtp(phone, code);
    } catch (err) {
      setError(errorMessage(err));
      setDigits(Array(LEN).fill(""));
      refs.current[0]?.focus();
      setLoading(false);
      return;
    }

    const { token, user, isNew } = result;
    login(token, user);

    // Came from the Register tab: save the details they already entered
    const signup = readSignup();
    sessionStorage.removeItem("signup");
    if ((isNew || !user) && signup) {
      try {
        const created = await registerUser(phone, signup);
        updateUser(created);
        navigate("/home", { replace: true });
        return;
      } catch {
        /* fall through: ask for the details on the profile page */
      }
    }
    navigate(isNew || !user ? "/register" : "/home", { replace: true });
  };

  const onChange = (i, value) => {
    const d = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    setError("");
    if (d && i < LEN - 1) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) submit(next.join(""));
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array(LEN).fill("");
    text.split("").forEach((c, i) => (next[i] = c));
    setDigits(next);
    if (text.length === LEN) submit(text);
    else refs.current[text.length]?.focus();
  };

  const resend = async () => {
    try {
      await sendOtp(phone);
      setLeft(WAIT);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const code = digits.join("");

  return (
    <main className="center-page">
      <header className="center-logo">
        <Logo size={28} />
      </header>

      <section className="card perm-card">
        <div className="perm-top">
          <button type="button" className="perm-back" onClick={() => navigate("/login")}>
            ← Change number
          </button>
        </div>

        <h1 className="card-title">Verify your number</h1>
        <p className="card-sub" style={{ marginBottom: 0 }}>
          Enter the 6-digit code sent to <b>+91 {phone}</b>
        </p>

        <div className="otp-row" onPaste={onPaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (refs.current[i] = el)}
              className={`otp-box ${d ? "filled" : ""}`}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              value={d}
              onChange={(e) => onChange(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              disabled={loading}
              aria-label={`Digit ${i + 1}`}
            />
          ))}
        </div>

        <p className="field-error" role="alert" style={{ textAlign: "center" }}>{error}</p>

        <button
          type="button"
          className="btn btn-primary btn-wide"
          onClick={() => submit(code)}
          disabled={loading || code.length !== LEN}
        >
          {loading ? "Verifying…" : "Verify"}
        </button>

        <p className="resend">
          {left > 0 ? (
            <>Resend code in 00:{String(left).padStart(2, "0")}</>
          ) : (
            <button type="button" className="btn-link" onClick={resend}>
              Resend code
            </button>
          )}
        </p>

        {MOCK && <p className="demo-hint">Demo mode: use code <b>{DEMO_OTP}</b></p>}
      </section>
    </main>
  );
}