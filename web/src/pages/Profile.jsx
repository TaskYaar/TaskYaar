import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTasks } from "../lib/useTasks.js";
import { useIdSet } from "../lib/useIdSet.js";

const MENU = [
  { to: "/my-tasks", icon: "📋", label: "My Tasks" },
  { to: "/applications", icon: "📨", label: "Applications" },
  { to: "/wallet", icon: "👛", label: "Wallet" },
  { to: "/chat", icon: "💬", label: "Chats" },
  { to: "/reviews", icon: "⭐", label: "Reviews" },
  { to: "/saved", icon: "🔖", label: "Saved Tasks" },
  { to: "/settings", icon: "⚙️", label: "Settings" },
  { to: "/help", icon: "❓", label: "Help & Support" },
];

export default function Profile() {
  const { user, logout } = useAuth();
  const { tasks } = useTasks();
  const [applied] = useIdSet("applied");
  const [saved] = useIdSet("saved");
  const posted = tasks.filter((t) => t.mine).length;

  return (
    <div className="page">
      <div className="pcard">
        <div className="phead">
          <div className="avatar xl" aria-hidden="true">{(user?.name || "U").charAt(0).toUpperCase()}</div>
          <div>
            <h1 style={{ fontSize: 22 }}>{user?.name}</h1>
            <small style={{ color: "var(--mute)" }}>
              +91 {user?.phone} · {user?.city}
            </small>
          </div>
        </div>

        <div className="stats">
          <div className="stat"><b>{posted}</b><span>Tasks Posted</span></div>
          <div className="stat"><b>{applied.length}</b><span>Tasks Applied</span></div>
          <div className="stat"><b>{saved.length}</b><span>Saved</span></div>
        </div>

        <ul className="menu">
          {MENU.map((m) => (
            <li key={m.to}>
              <Link to={m.to}>
                <span>{m.icon} &nbsp;{m.label}</span>
                <span aria-hidden="true">›</span>
              </Link>
            </li>
          ))}
          <li>
            <button className="danger" onClick={logout}>
              <span>🚪 &nbsp;Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}