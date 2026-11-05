import { useState } from "react";
import { Navigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { registerUser, errorMessage } from "../services/auth.js";

const ROLES = [
  { v: "poster", t: "Post tasks", d: "I need help" },
  { v: "helper", t: "Find work", d: "I want to earn" },
  { v: "both", t: "Both", d: "Post and do" },
];

export default function Register() {
  const phone = sessionStorage.getItem("phone");
  const { token, user, updateUser } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", city: "", role: "both" });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token || !phone) return <Navigate to="/login" replace />;
  if (user) return <Navigate to="/home" replace />;

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setErrors({ ...errors, [key]: "" });
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (form.city.trim().length < 2) e.city = "Enter your city.";
    if (!agree) e.agree = "Please accept the terms to continue.";
    return e;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    setApiError("");
    try {
      const created = await registerUser(phone, {
        name: form.name.trim(),
        email: form.email.trim(),
        city: form.city.trim(),
        role: form.role,
      });
      updateUser(created); // user is now set, so this page redirects to /home
    } catch (err) {
      setApiError(errorMessage(err));
      setLoading(false);
    }
  };

  return (
    <main className="center-page">
      <header className="center-logo">
        <Logo size={28} />
      </header>

      <form className="card" onSubmit={onSubmit} noValidate>
        <h1 className="card-title">Create your profile</h1>
        <p className="card-sub">Tell us a little about yourself</p>

        <label className="form-field">
          <span>Full name</span>
          <input value={form.name} onChange={set("name")} placeholder="Dheeraj Parse" autoComplete="name" />
          {errors.name && <small>{errors.name}</small>}
        </label>

        <label className="form-field">
          <span>Email (optional)</span>
          <input type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" />
          {errors.email && <small>{errors.email}</small>}
        </label>

        <label className="form-field">
          <span>City</span>
          <input value={form.city} onChange={set("city")} placeholder="Pune" autoComplete="address-level2" />
          {errors.city && <small>{errors.city}</small>}
        </label>

        <div className="form-field">
          <span>I want to</span>
          <div className="roles" role="radiogroup">
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.v}
                role="radio"
                aria-checked={form.role === r.v}
                className={`role ${form.role === r.v ? "selected" : ""}`}
                onClick={() => setForm({ ...form, role: r.v })}
              >
                <b>{r.t}</b>
                <span>{r.d}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => {
              setAgree(e.target.checked);
              setErrors({ ...errors, agree: "" });
            }}
          />
          <span>I agree to the Terms &amp; Conditions and Privacy Policy</span>
        </label>
        {errors.agree && <p className="field-error">{errors.agree}</p>}
        {apiError && <p className="field-error" role="alert">{apiError}</p>}

        <button type="submit" className="btn btn-primary btn-wide" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}