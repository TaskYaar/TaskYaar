import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { SEED_THREADS, nowLabel } from "../data/chat.js";
import { useLocalState } from "../lib/useLocalState.js";

const REPLIES = [
  "Sounds good!",
  "Okay, understood.",
  "I'll be there on time.",
  "Can you share the exact address?",
  "Thanks for the update 👍",
];

export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [threads, setThreads] = useLocalState("chats", SEED_THREADS);
  const [text, setText] = useState("");
  const msgsRef = useRef(null);

  const active = threads.find((t) => t.id === id);
  const count = active?.messages.length;

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [id, count]);

  const push = (threadId, msg) =>
    setThreads((all) =>
      all.map((t) => (t.id === threadId ? { ...t, messages: [...t.messages, msg] } : t))
    );

  const send = (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !active) return;
    const tid = active.id;
    push(tid, { id: Date.now(), from: "me", text: body, at: nowLabel() });
    setText("");
    setTimeout(() => {
      push(tid, {
        id: Date.now() + 1,
        from: "them",
        text: REPLIES[Math.floor(Math.random() * REPLIES.length)],
        at: nowLabel(),
      });
    }, 1200);
  };

  return (
    <div className="page">
      <div className={`chat ${active ? "has-active" : ""}`}>
        <aside className="chat-list">
          <h2>Chats</h2>
          {threads.length === 0 && <p className="chat-empty" style={{ padding: 18 }}>No chats yet.</p>}
          {threads.map((t) => {
            const last = t.messages[t.messages.length - 1];
            return (
              <button
                key={t.id}
                className={`thread ${t.id === id ? "active" : ""}`}
                onClick={() => navigate(`/chat/${t.id}`)}
              >
                <div className="avatar big" aria-hidden="true">{t.name.charAt(0)}</div>
                <div className="meta">
                  <b>{t.name}</b>
                  <div className="last">{last ? last.text : "Say hello 👋"}</div>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="chat-pane">
          {!active ? (
            <div className="chat-empty">
              <div style={{ fontSize: 40 }}>💬</div>
              <p>Select a conversation to start chatting.</p>
            </div>
          ) : (
            <>
              <header className="chat-head">
                <Link to="/chat" className="chat-back" aria-label="Back to chats">←</Link>
                <div className="avatar" aria-hidden="true">{active.name.charAt(0)}</div>
                <div>
                  <b>{active.name}</b>
                  {active.online && <small>Online</small>}
                </div>
              </header>

              <div className="msgs" ref={msgsRef}>
                {active.messages.length === 0 && (
                  <p className="chat-empty">You accepted {active.name}. Say hello!</p>
                )}
                {active.messages.map((m) => (
                  <div key={m.id} className={`bubble ${m.from}`}>
                    {m.text}
                    <time>{m.at}</time>
                  </div>
                ))}
              </div>

              <form className="composer" onSubmit={send}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message…"
                  aria-label="Message"
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()}>Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}