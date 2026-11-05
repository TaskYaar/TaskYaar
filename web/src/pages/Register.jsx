import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";
import ProfileFields, { validateProfile } from "../components/ProfileFields.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { registerUser, googleRegister, errorMessage } from "../services/auth.js";

const readGoogle = () => {
  try { return JSON.parse(sessionStorage.getItem("google")); }
  catch { return null; }
};

export default function Register() {
  const phone = sessionStorage.getItem("phone");
  const google = readGoogle();
  const { token, user, login, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: google?.name || "",
    email: google?.email || "",
    city: "",
    role: "both",
  });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/home" replace />;
  if (!google && !token) return <Navigate to="/login" replace />;

  const onChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validateProfile(form, agree);
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setApiError("");
    try {
      if (google) {
        const res = await googleRegister(google.signupToken, {
          name: form.name.trim(),
          city: form.city.trim(),
          role: form.role,
        });
        sessionStorage.removeItem("google");
        login(res.token, res.user); // user is now set, so this page redirects to /home
      } else {
        const created = await registerUser(phone, {
          name: form.name.trim(),
          email: form.email.trim(),
          city: form.city.trim(),
          role: form.role,
        });
        updateUser(created);
      }
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
        <h1 className="card-title">{google ? "Almost there" : "Complete your profile"}</h1>
        <p className="card-sub">Tell us a little about yourself</p>

        <ProfileFields
          values={form}
          onChange={onChange}
          errors={errors}
          agree={agree}
          onAgree={(v) => {
            setAgree(v);
            setErrors((e) => ({ ...e, agree: "" }));
          }}
          emailLocked={Boolean(google)}
        />

        {apiError && (
          <p className="field-error" role="alert">
            {apiError} <Link to="/login">Back to login</Link>
          </p>
        )}

        <button type="submit" className="btn btn-primary btn-wide" disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}