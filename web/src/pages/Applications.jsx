import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PEOPLE } from "../data/people.js";
import { ensureThread } from "../data/chat.js";
import { useTasks } from "../lib/useTasks.js";
import { useLocalState } from "../lib/useLocalState.js";

export default function Applications() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const [status, setStatus] = useLocalState("appstatus", {});
  const [open, setOpen] = useState(null);

  // Your own tasks, plus task #1 as a demo so this page always has something to show
  const demo = tasks.find((t) => t.id === 1);
  const options = [...tasks.filter((t) => t.mine), ...(demo ? [demo] : [])];
  const taskId = Number(params.get("task")) || options[0]?.id;
  const task = options.find((t) => t.id === taskId) || options[0];

  if (!task) return <div className="page"><div className="empty">No tasks yet.</div></div>;

  const keyOf = (p) => `${task.id}:${p.id}`;
  const setOne = (p, value) =>
    setStatus((s) => {
      const n = { ...s };
      if (value) n[keyOf(p)] = value;
      else delete n[keyOf(p)];
      return n;
    });

  const accept = (p) => {
    ensureThread(p); // opens a chat with this helper
    setOne(p, "accepted");
  };

  return (
    <div className="page">
      <h1 className="page-title">Applications ({PEOPLE.length})</h1>

      <div className="tools" style={{ maxWidth: 760 }}>
        <select
          className="select"
          style={{ padding: "12px 14px", flex: 1 }}
          value={task.id}
          onChange={(e) => setParams({ task: e.target.value }, { replace: true })}
          aria-label="Task"
        >
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}{t.mine ? "" : " (demo)"}
            </option>
          ))}
        </select>
      </div>

      <div className="alist">
        {PEOPLE.map((p) => {
          const st = status[keyOf(p)];
          return (
            <article key={p.id} className="acard">
              <div className="arow">
                <div className="avatar big" aria-hidden="true">{p.name.charAt(0)}</div>
                <div className="who">
                  <b>{p.name}</b>
                  <small>⭐ {p.rating} ({p.reviews}) · {p.km} km away</small>
                </div>

                <div className="acts">
                  {!st && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => setOne(p, "rejected")}>Reject</button>
                      <button className="btn btn-primary btn-sm" onClick={() => accept(p)}>Accept</button>
                    </>
                  )}
                  {st === "accepted" && (
                    <>
                      <span className="status ok">Accepted ✓</span>
                      <button className="btn btn-outline btn-sm" onClick={() => navigate(`/chat/${p.id}`)}>💬 Chat</button>
                    </>
                  )}
                  {st === "rejected" && (
                    <>
                      <span className="status no">Rejected</span>
                      <button className="link-btn" onClick={() => setOne(p, null)}>Undo</button>
                    </>
                  )}
                </div>
              </div>

              <button className="link-btn" onClick={() => setOpen(open === p.id ? null : p.id)}>
                {open === p.id ? "Hide profile" : "View Profile"}
              </button>

              {open === p.id && (
                <div className="ainfo">
                  <span>✅ {p.completed} tasks completed</span>
                  <span>⭐ {p.rating} average rating</span>
                  <span>📅 Member since {p.since}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}