import { useState } from "react";
import { money } from "../data/tasks.js";
import { useLocalState } from "../lib/useLocalState.js";

const SEED = {
  balance: 2450,
  tx: [
    { id: 1, label: "Task completed", amount: 500, at: "Today, 10:30 AM" },
    { id: 2, label: "Payment for task", amount: -200, at: "Yesterday, 4:20 PM" },
    { id: 3, label: "Task completed", amount: 1000, at: "2 May, 11:10 AM" },
    { id: 4, label: "Withdrawal", amount: -150, at: "1 May, 7:30 PM" },
  ],
};

export default function Wallet() {
  const [w, setW] = useLocalState("wallet", SEED);
  const [mode, setMode] = useState(null); // null | "add" | "withdraw"
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const toggle = (m) => {
    setMode(m === mode ? null : m);
    setAmount("");
    setError("");
  };

  const confirm = () => {
    const n = Number(amount);
    if (!(n > 0)) return setError("Enter an amount greater than 0.");
    if (mode === "add" && n > 50000) return setError("You can add up to ₹50,000 at a time.");
    if (mode === "withdraw" && n > w.balance) return setError("That's more than your balance.");

    const signed = mode === "add" ? n : -n;
    setW({
      balance: w.balance + signed,
      tx: [
        { id: Date.now(), label: mode === "add" ? "Money added" : "Withdrawal", amount: signed, at: "Just now" },
        ...w.tx,
      ],
    });
    setMode(null);
    setAmount("");
  };

  const rows = showAll ? w.tx : w.tx.slice(0, 4);

  return (
    <div className="page">
      <h1 className="page-title">Wallet</h1>

      <div className="wallet-card" style={{ marginTop: 18 }}>
        <small>Available Balance</small>
        <div className="bal">{money(w.balance)}</div>
      </div>

      <div className="wallet-actions">
        <button className={`btn ${mode === "add" ? "btn-primary" : "btn-outline"}`} onClick={() => toggle("add")}>
          ➕ Add Money
        </button>
        <button className={`btn ${mode === "withdraw" ? "btn-primary" : "btn-outline"}`} onClick={() => toggle("withdraw")}>
          ⬇️ Withdraw
        </button>
      </div>

      {mode && (
        <div className="wpanel">
          <b>{mode === "add" ? "Add money" : "Withdraw money"}</b>
          <div className="phone-field" style={{ marginTop: 12 }}>
            <span className="cc">₹</span>
            <input
              type="number" min="1" inputMode="numeric" placeholder="500"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              aria-label="Amount"
            />
          </div>
          <div className="quick">
            {[100, 500, 1000].map((n) => (
              <button key={n} type="button" className="chip" onClick={() => { setAmount(String(n)); setError(""); }}>
                ₹{n}
              </button>
            ))}
          </div>
          <p className="field-error" role="alert">{error}</p>
          <button className="btn btn-primary btn-wide" onClick={confirm}>
            {mode === "add" ? "Add money" : "Withdraw"}
          </button>
          <p className="demo-hint">Demo wallet: no real money is moved.</p>
        </div>
      )}

      <div className="section-head" style={{ maxWidth: 560 }}>
        <h2>Transactions</h2>
      </div>

      <div className="tx-list">
        {rows.map((t) => (
          <div key={t.id} className="tx">
            <div>
              {t.label}
              <small>{t.at}</small>
            </div>
            <span className={t.amount > 0 ? "pos" : "neg"}>
              {t.amount > 0 ? "+" : "-"}{money(Math.abs(t.amount))}
            </span>
          </div>
        ))}
      </div>

      {w.tx.length > 4 && (
        <button className="btn btn-outline btn-wide" style={{ maxWidth: 560, marginTop: 12 }} onClick={() => setShowAll(!showAll)}>
          {showAll ? "Show less" : "View All"}
        </button>
      )}
    </div>
  );
}