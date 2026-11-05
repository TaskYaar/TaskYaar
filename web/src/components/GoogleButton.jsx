import { useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SRC = "https://accounts.google.com/gsi/client";

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let s = document.querySelector(`script[src="${SRC}"]`);
    if (!s) {
      s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", resolve, { once: true });
    s.addEventListener("error", () => reject(new Error("Couldn't load Google sign-in.")), { once: true });
  });
}

export default function GoogleButton({ mode = "login", onCredential, onError }) {
  const box = useRef(null);
  const onCred = useRef(onCredential);
  const onErr = useRef(onError);
  onCred.current = onCredential;
  onErr.current = onError;

  useEffect(() => {
    if (!CLIENT_ID) return;
    let alive = true;
    loadScript()
      .then(() => {
        if (!alive || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res) => onCred.current(res.credential),
        });
        window.google.accounts.id.renderButton(box.current, {
          theme: "outline",
          size: "large",
          shape: "rectangular",
          logo_alignment: "center",
          text: mode === "register" ? "signup_with" : "continue_with",
          width: Math.min(box.current.offsetWidth || 400, 400),
        });
      })
      .catch((e) => onErr.current?.(e.message));
    return () => {
      alive = false;
    };
  }, [mode]);

  if (!CLIENT_ID) {
    return (
      <button
        type="button"
        className="btn btn-outline btn-wide"
        onClick={() =>
          onErr.current?.("Google sign-in isn't set up yet. Add VITE_GOOGLE_CLIENT_ID to web/.env and restart.")
        }
      >
        Continue with Google
      </button>
    );
  }
  return <div ref={box} className="g-slot" />;
}