import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo.jsx";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate("/onboarding", { replace: true }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <main className="splash">
      {/* Replace emoji with your real logo image */}
      <div className="splash-icon" aria-hidden="true">🤝</div>
      <Logo size={72} />
      <p className="tagline">
        Kaam bhi, <span>Kamai bhi</span> – Apne Sheher Mein
      </p>
    </main>
  );
}