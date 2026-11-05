import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";

export default function Onboarding() {
  const navigate = useNavigate();

  return (
    <main className="split">
      <section className="split-left">
        <header className="topbar">
          <Logo size={28} />
          <Link to="/permissions/notifications" className="skip">Skip</Link>
        </header>

        <div className="hero">
          <h1 className="hero-title">
            Kaam bhi,<br />
            <span>Kamai bhi –</span><br />
            Apne Sheher Mein
          </h1>
          <p className="hero-sub">
            Post a task or find work in your local area easily.
          </p>

          <div className="dots" aria-hidden="true">
            <i className="active" /><i /><i />
          </div>

          <button
            className="btn btn-primary btn-wide"
            onClick={() => navigate("/permissions/notifications")}
          >
            Next
          </button>
        </div>
      </section>

      <section className="split-right" aria-hidden="true">
        {/* Replace with: <img src="/onboarding.png" alt="" /> */}
        <div className="art">🤝</div>
      </section>
    </main>
  );
}