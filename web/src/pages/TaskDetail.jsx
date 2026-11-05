import { Link, useNavigate, useParams } from "react-router-dom";
import { catById, money } from "../data/tasks.js";
import { useTasks } from "../lib/useTasks.js";
import { useIdSet } from "../lib/useIdSet.js";

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tasks: TASKS } = useTasks();
  const [applied, toggleApply] = useIdSet("applied");
  const [saved, toggleSave] = useIdSet("saved");

  const task = TASKS.find((t) => String(t.id) === id);

  if (!task) {
    return (
      <div className="page">
        <div className="empty">
          This task doesn&rsquo;t exist. <Link to="/tasks">Back to all tasks</Link>
        </div>
      </div>
    );
  }

  const cat = catById(task.cat);
  const isApplied = applied.includes(task.id);
  const isSaved = saved.includes(task.id);
  const p = task.poster;

  return (
    <div className="page">
      <button className="back" onClick={() => navigate(-1)}>← Back</button>

      <div className="detail">
        <section className="panel">
          <span className="tag">{cat.icon} {cat.label}</span>
          <h1 className="detail-title">{task.title}</h1>
          <div className="detail-price">
            {money(task.price)} {task.negotiable && <span className="nego">Negotiable</span>}
          </div>

          <ul className="facts">
            <li>📍 {task.km > 0 ? `${task.km} km away` : "Online"} · {task.location}</li>
            <li>🕓 {task.when}</li>
            <li>👥 {task.applicants} applied so far</li>
          </ul>

          <h2 className="h-sm">Description</h2>
          <p className="detail-desc">{task.desc}</p>
        </section>

        <aside className="panel side">
          <h2 className="h-sm">Posted by</h2>
          <div className="poster">
            <div className="avatar big" aria-hidden="true">{p.name.charAt(0)}</div>
            <div>
              <b>{p.name}</b>
              <div className="rating">
                {p.reviews > 0
                  ? `⭐ ${p.rating} (${p.reviews}) · ${p.completed} tasks completed`
                  : "New member"}
              </div>
            </div>
            {p.verified && <span className="verified">✔ Verified</span>}
          </div>

          <button
            className={`btn btn-wide ${isApplied ? "btn-outline" : "btn-primary"}`}
            onClick={() => toggleApply(task.id)}
          >
            {isApplied ? "Applied ✓ (tap to withdraw)" : "Apply for Task"}
          </button>

          <div className="two">
            <button className="btn btn-outline" onClick={() => navigate("/chat")}>💬 Chat</button>
            <button className="btn btn-outline" onClick={() => toggleSave(task.id)}>
              {isSaved ? "🔖 Saved" : "🔖 Save"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}