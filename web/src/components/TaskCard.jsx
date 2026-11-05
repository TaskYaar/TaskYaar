import { Link } from "react-router-dom";
import { catById, money } from "../data/tasks.js";

export default function TaskCard({ task, applied, onApply }) {
  const cat = catById(task.cat);

  return (
    <article className="tcard">
      <Link to={`/tasks/${task.id}`} className="tcard-main">
        <div className="tcard-icon" aria-hidden="true">{cat.icon}</div>
        <div className="tcard-text">
          <h3>{task.title}</h3>
          <p>{task.short}</p>
          <div className="tmeta">
            <span>{task.km > 0 ? `${task.km} km away` : "Online"}</span>
            <span>• {task.when}</span>
          </div>
        </div>
      </Link>

      <div className="tcard-side">
        <b className="price">{money(task.price)}</b>
        <button
          className={`btn btn-sm ${applied ? "btn-outline" : "btn-primary"}`}
          onClick={() => onApply(task.id)}
        >
          {applied ? "Applied ✓" : "Apply"}
        </button>
      </div>
    </article>
  );
}