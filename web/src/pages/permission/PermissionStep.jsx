import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import Logo from "../../components/Logo.jsx";
import { STEPS } from "./steps.js";

export default function PermissionStep() {
  const { step } = useParams();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => setNote(""), [step]);

  const index = STEPS.findIndex((s) => s.key === step);
  if (index === -1) return <Navigate to="/permissions/notifications" replace />;

  const current = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const next = () =>
    navigate(isLast ? "/language" : `/permissions/${STEPS[index + 1].key}`);

  const back = () =>
    navigate(index === 0 ? "/onboarding" : `/permissions/${STEPS[index - 1].key}`);

  const save = (value) => localStorage.setItem(`perm:${current.key}`, value);

  const onAllow = async () => {
    setBusy(true);
    setNote("");
    const result = await current.request();
    save(result);
    setBusy(false);

    if (result === "denied") {
      setNote("Blocked. You can turn this on later in your browser or phone settings.");
      setTimeout(next, 1400);
      return;
    }
    next();
  };

  const onSkip = () => {
    save("skipped");
    next();
  };

  return (
    <main className="center-page">
      <header className="center-logo">
        <Logo size={28} />
      </header>

      <section className="card perm-card">
        <div className="perm-top">
          <button type="button" className="perm-back" onClick={back}>
            ← Back
          </button>
          <span className="perm-count">
            {index + 1} of {STEPS.length}
          </span>
        </div>

        <div className="perm-icon" aria-hidden="true">{current.icon}</div>
        <h1 className="card-title">{current.title}</h1>
        <p className="perm-desc">{current.desc}</p>

        <div className="dots" aria-hidden="true">
          {STEPS.map((s, i) => (
            <i key={s.key} className={i === index ? "active" : ""} />
          ))}
        </div>

        <p className="perm-note" role="status">{note}</p>

        <button
          type="button"
          className="btn btn-primary btn-wide"
          onClick={onAllow}
          disabled={busy}
        >
          {busy ? "Waiting for permission…" : current.allow}
        </button>
        <button type="button" className="btn-link" onClick={onSkip} disabled={busy}>
          Not now
        </button>
      </section>
    </main>
  );
}