import { Link, NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  { to: "/home", label: "Home", icon: "🏠" },
  { to: "/tasks", label: "Tasks", icon: "📋" },
  { to: "/chat", label: "Chat", icon: "💬" },
  { to: "/wallet", label: "Wallet", icon: "👛" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="shell">
      <header className="shell-bar">
        <div className="shell-inner">
          <Link to="/home" aria-label="TaskYaar home"><Logo size={26} /></Link>

          <nav className="shell-nav" aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? "active" : "")}>
                <span aria-hidden="true">{n.icon}</span>
                {n.label}
              </NavLink>
            ))}
          </nav>

          <div className="shell-right">
            <span className="loc-chip">📍 {user?.city || "Pune"}</span>
            <Link to="/post" className="btn btn-primary btn-sm">+ Post a Task</Link>
            <button className="avatar" onClick={logout} title="Logout" aria-label="Logout">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      <div className="shell-body">
        <Outlet />
      </div>
    </div>
  );
}