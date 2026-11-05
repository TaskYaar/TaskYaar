
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES, catById, money } from "../data/tasks.js";
import { useTasks } from "../lib/useTasks.js";

const CATS = [...CATEGORIES, { id: "other", label: "Other", icon: "📌" }];
const DAYS = ["Today", "Tomorrow", "This weekend", "Flexible"];
const TOTAL = 5;
const TITLES = ["What do you need help with?", "Describe your task", "Where is the task?", "Budget & time", "Review your task"];

const fmtTime = (t) => {
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export default function PostTask() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addTask } = useTasks();
  const fileRef = useRef(null);

  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    cat: "", title: "", desc: "",
    area: user?.city || "", coords: null,
    amount: "", negotiable: false, day: "Today", time: "",
  });

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };

  const validate = (s) => {
    if (s === 1 && !form.cat) return "Pick a category to continue.";
    if (s === 2 && form.title.trim().length < 5) return "Give your task a title (at least 5 characters).";
    if (s === 3 && form.area.trim().length < 2) return "Enter the area or locality of the task.";
    if (s === 4 && !(Number(form.amount) > 0)) return "Enter a budget greater than 0.";
    return "";
  };

  const next = () => {
    const msg = validate(step);
    if (msg) return setError(msg);
    setError("");
    setStep(step + 1);
  };

  const back = () => {
    setError("");
    if (step === 1) navigate(-1);
    else setStep(step - 1);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError("Location isn't supported in this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setForm((f) => ({ ...f, coords: { lat, lng }, area: f.area || "Current location" }));
        setLocating(false);
        setError("");
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location. Type your area instead.");
      },
      { timeout: 15000 }
    );
  };

  const onPhotos = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    const added = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPhotos((p) => [...p, ...added].slice(0, 5));
    e.target.value = "";
  };

  const when = form.time ? `${form.day}, ${fmtTime(form.time)}` : form.day;

  const post = () => {
    for (let s = 1; s <= 4; s++) {
      const msg = validate(s);
      if (msg) { setStep(s); return setError(msg); }
    }
    const task = {
      id: Date.now(),
      title: form.title.trim(),
      cat: form.cat,
      short: (form.desc.trim() || form.title.trim()).slice(0, 70),
      price: Number(form.amount),
      negotiable: form.negotiable,
      km: 0.5, // placeholder until the backend calculates real distance
      when,
      applicants: 0,
      postedHours: 0,
      location: form.area.trim(),
      desc: form.desc.trim() || "No description provided.",
      poster: { name: user?.name || "You", rating: 0, reviews: 0, completed: 0, verified: false },
      mine: true,
    };
    addTask(task);
    navigate(`/tasks/${task.id}`, { replace: true });
  };

  const cat = catById(form.cat);

  return (
    <div className="page">
      <div className="post-wrap">
        <div className="post-top">
          <button type="button" className="back" onClick={back}>← Back</button>
          <span className="perm-count">Step {step} of {TOTAL}</span>
        </div>
        <div className="progress" aria-hidden="true">
          <i style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>

        <section className="panel">
          <h1 className="post-title">{TITLES[step - 1]}</h1>

          {step === 1 && (
            <div className="catpick" role="radiogroup" aria-label="Category">
              {CATS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  role="radio"
                  aria-checked={form.cat === c.id}
                  className={`pick ${form.cat === c.id ? "selected" : ""}`}
                  onClick={() => set("cat", c.id)}
                >
                  <span aria-hidden="true">{c.icon}</span>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <>
              <label className="form-field">
                <span>Task title</span>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="Ex: Need a delivery helper"
                  maxLength={80}
                />
              </label>
              <label className="form-field">
                <span>Description</span>
                <textarea
                  value={form.desc}
                  onChange={(e) => set("desc", e.target.value)}
                  placeholder="Describe your task in detail…"
                  rows={5}
                  maxLength={500}
                />
                <small className="counter">{form.desc.length}/500</small>
              </label>

              <div className="attach">
                <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPhotos} />
                <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={photos.length >= 5}>
                  🖼️ Add Photos
                </button>
                <button type="button" className="btn btn-outline" disabled title="Voice notes are coming soon">
                  🎤 Add Voice (soon)
                </button>
              </div>

              {photos.length > 0 && (
                <div className="thumbs">
                  {photos.map((p, i) => (
                    <div key={p.url} className="thumb">
                      <img src={p.url} alt={p.name} />
                      <button type="button" aria-label="Remove photo" onClick={() => setPhotos((all) => all.filter((_, j) => j !== i))}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 3 && (
            <>
              <button type="button" className="btn btn-outline btn-wide" onClick={useMyLocation} disabled={locating}>
                {locating ? "Finding you…" : "📍 Use my current location"}
              </button>

              <div className="map-box" aria-live="polite">
                {form.coords
                  ? <>📍 Pin set<br /><small>{form.coords.lat.toFixed(4)}, {form.coords.lng.toFixed(4)}</small></>
                  : <>📍 No pin yet<br /><small>Use your location, or just type the area below.</small></>}
              </div>

              <label className="form-field">
                <span>Area / Locality</span>
                <input
                  value={form.area}
                  onChange={(e) => set("area", e.target.value)}
                  placeholder="Ex: Kothrud, Pune, Maharashtra"
                />
              </label>
            </>
          )}

          {step === 4 && (
            <>
              <label className="form-field">
                <span>Amount</span>
                <div className="phone-field">
                  <span className="cc">₹</span>
                  <input
                    type="number" min="1" inputMode="numeric" placeholder="500"
                    value={form.amount} onChange={(e) => set("amount", e.target.value)}
                  />
                </div>
              </label>

              <div className="form-field">
                <span>Price type</span>
                <div className="roles cols-2" role="radiogroup">
                  {[{ v: false, t: "Fixed Price" }, { v: true, t: "Negotiable" }].map((o) => (
                    <button
                      type="button" key={o.t} role="radio"
                      aria-checked={form.negotiable === o.v}
                      className={`role ${form.negotiable === o.v ? "selected" : ""}`}
                      onClick={() => set("negotiable", o.v)}
                    >
                      <b>{o.t}</b>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <span>When do you need it?</span>
                <div className="when-row">
                  <select className="select" value={form.day} onChange={(e) => set("day", e.target.value)} aria-label="Day">
                    {DAYS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                  <input type="time" className="select" value={form.time} onChange={(e) => set("time", e.target.value)} aria-label="Time (optional)" />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <dl className="review">
                <div><dt>Category</dt><dd>{cat.icon} {cat.label}</dd></div>
                <div><dt>Title</dt><dd>{form.title}</dd></div>
                <div><dt>Description</dt><dd>{form.desc || "—"}</dd></div>
                <div><dt>Location</dt><dd>{form.area}</dd></div>
                <div><dt>Time</dt><dd>{when}</dd></div>
                <div><dt>Budget</dt><dd>{money(Number(form.amount))} ({form.negotiable ? "Negotiable" : "Fixed"})</dd></div>
                <div><dt>Photos</dt><dd>{photos.length}</dd></div>
              </dl>
            </>
          )}

          <p className="field-error" role="alert">{error}</p>

          {step < TOTAL ? (
            <button type="button" className="btn btn-primary btn-wide" onClick={next}>Next</button>
          ) : (
            <>
              <button type="button" className="btn btn-primary btn-wide" onClick={post}>Post Task</button>
              <button type="button" className="btn-link" onClick={() => setStep(1)}>Edit</button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
