export const PURPOSES = [
  { v: "poster", t: "Post tasks", d: "I need help" },
  { v: "helper", t: "Find work", d: "I want to earn" },
  { v: "both", t: "Both", d: "Post and do" },
];

export function validateProfile(v, agree) {
  const e = {};
  if (v.name.trim().length < 2) e.name = "Enter your full name.";
  if (v.email && !/^\S+@\S+\.\S+$/.test(v.email)) e.email = "Enter a valid email.";
  if (v.city.trim().length < 2) e.city = "Enter your city.";
  if (!agree) e.agree = "Please accept the terms to continue.";
  return e;
}

export default function ProfileFields({ values, onChange, errors, agree, onAgree, emailLocked = false }) {
  return (
    <>
      <label className="form-field">
        <span>Full name</span>
        <input value={values.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Dheeraj Parse" autoComplete="name" />
        {errors.name && <small>{errors.name}</small>}
      </label>

      <label className="form-field">
        <span>Email {emailLocked ? "(from Google)" : "(optional)"}</span>
        <input
          type="email"
          value={values.email}
          onChange={(e) => onChange("email", e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          readOnly={emailLocked}
        />
        {errors.email && <small>{errors.email}</small>}
      </label>

      <label className="form-field">
        <span>City</span>
        <input value={values.city} onChange={(e) => onChange("city", e.target.value)} placeholder="Pune" autoComplete="address-level2" />
        {errors.city && <small>{errors.city}</small>}
      </label>

      <div className="form-field">
        <span>What brings you to TaskYaar?</span>
        <div className="roles" role="radiogroup">
          {PURPOSES.map((r) => (
            <button
              type="button"
              key={r.v}
              role="radio"
              aria-checked={values.role === r.v}
              className={`role ${values.role === r.v ? "selected" : ""}`}
              onClick={() => onChange("role", r.v)}
            >
              <b>{r.t}</b>
              <span>{r.d}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="check-row">
        <input type="checkbox" checked={agree} onChange={(e) => onAgree(e.target.checked)} />
        <span>I agree to the Terms &amp; Conditions and Privacy Policy</span>
      </label>
      {errors.agree && <p className="field-error">{errors.agree}</p>}
    </>
  );
}