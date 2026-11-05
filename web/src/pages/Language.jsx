import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";

const LANGS = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी (Hindi)" },
  { code: "mr", label: "मराठी (Marathi)" },
];

export default function Language() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");

  const onContinue = () => {
    localStorage.setItem("lang", lang);
    navigate("/login");
  };

  return (
    <main className="center-page">
      <header className="center-logo">
        <Logo size={28} />
      </header>

      <section className="card">
        <h1 className="card-title">Choose Language</h1>
        <p className="card-sub">भाषा चुनें / भाषा निवडा</p>

        <div role="radiogroup" aria-label="Language" className="lang-list">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              role="radio"
              aria-checked={lang === code}
              className={`lang-opt ${lang === code ? "selected" : ""}`}
              onClick={() => setLang(code)}
            >
              {label}
              {lang === code && <span className="check">✓</span>}
            </button>
          ))}
        </div>

        <button className="btn btn-primary btn-wide" onClick={onContinue}>
          Continue
        </button>
      </section>
    </main>
  );
}