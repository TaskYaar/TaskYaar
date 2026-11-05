import { Link } from "react-router-dom";
import { useTasks } from "../lib/useTasks.js";
import { useIdSet } from "../lib/useIdSet.js";
import TaskCard from "../components/TaskCard.jsx";

export default function TaskList({ mode }) {
  const { tasks } = useTasks();
  const [saved] = useIdSet("saved");
  const [applied, toggleApply] = useIdSet("applied");

  const isSaved = mode === "saved";
  const list = isSaved ? tasks.filter((t) => saved.includes(t.id)) : tasks.filter((t) => t.mine);

  return (
    <div className="page">
      <h1 className="page-title">{isSaved ? "Saved Tasks" : "My Tasks"}</h1>

      {list.length === 0 ? (
        <div className="empty" style={{ marginTop: 20 }}>
          {isSaved ? "You haven't saved any tasks yet." : "You haven't posted any tasks yet."}
          <div style={{ marginTop: 14 }}>
            <Link to={isSaved ? "/tasks" : "/post"} className="btn btn-primary">
              {isSaved ? "Browse tasks" : "Post a task"}
            </Link>
          </div>
        </div>
      ) : (
        <div className="tlist" style={{ marginTop: 20 }}>
          {list.map((t) => (
            <div key={t.id}>
              <TaskCard task={t} applied={applied.includes(t.id)} onApply={toggleApply} />
              {!isSaved && (
                <Link to={`/applications?task=${t.id}`} className="link-btn" style={{ display: "inline-block", marginTop: 6 }}>
                  View applications →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}