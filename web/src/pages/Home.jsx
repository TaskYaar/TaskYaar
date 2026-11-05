import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../data/tasks.js";
import { useTasks } from "../lib/useTasks.js";
import TaskCard from "../components/TaskCard.jsx";
import { useIdSet } from "../lib/useIdSet.js";

export default function Home() {
  const { user } = useAuth();
  const { tasks: TASKS } = useTasks();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [applied, toggleApply] = useIdSet("applied");

  const nearby = [...TASKS].sort((a, b) => a.km - b.km).slice(0, 4);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/tasks?q=${encodeURIComponent(q.trim())}` : "/tasks");
  };

  return (
    <div className="page">
      <h1 className="page-title">Hi, {user?.name?.split(" ")[0] || "there"} 👋</h1>
      <p className="page-sub">What do you need today?</p>

      <form className="search" onSubmit={onSearch} role="search">
        <span aria-hidden="true">🔍</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks or services…"
          aria-label="Search tasks"
        />
      </form>

      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <Link key={c.id} to={`/tasks?cat=${c.id}`} className="cat">
            <span className="cat-icon" aria-hidden="true">{c.icon}</span>
            {c.label}
          </Link>
        ))}
        <Link to="/tasks" className="cat">
          <span className="cat-icon" aria-hidden="true">⋯</span>
          More
        </Link>
      </div>

      <div className="section-head">
        <h2>Nearby Tasks</h2>
        <Link to="/tasks?sort=nearby">See all</Link>
      </div>

      <div className="tlist">
        {nearby.map((t) => (
          <TaskCard key={t.id} task={t} applied={applied.includes(t.id)} onApply={toggleApply} />
        ))}
      </div>
    </div>
  );
}