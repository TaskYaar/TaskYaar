import { useSearchParams } from "react-router-dom";
import { CATEGORIES } from "../data/tasks.js";
import { useTasks } from "../lib/useTasks.js";
import TaskCard from "../components/TaskCard.jsx";
import { useIdSet } from "../lib/useIdSet.js";

const CHIPS = [
  { v: "all", t: "All" },
  { v: "nearby", t: "Nearby" },
  { v: "popular", t: "Popular" },
  { v: "latest", t: "Latest" },
];

export default function Tasks() {
  const [params, setParams] = useSearchParams();
  const { tasks: TASKS } = useTasks();
  const [applied, toggleApply] = useIdSet("applied");

  const q = params.get("q") || "";
  const cat = params.get("cat") || "";
  const sort = params.get("sort") || "all";

  const setParam = (key, value) => {
    const p = new URLSearchParams(params);
    if (value && value !== "all") p.set(key, value);
    else p.delete(key);
    setParams(p, { replace: true });
  };

  let list = TASKS.filter((t) => {
    if (cat && t.cat !== cat) return false;
    const text = `${t.title} ${t.short} ${t.desc}`.toLowerCase();
    return text.includes(q.trim().toLowerCase());
  });

  if (sort === "nearby") list = list.filter((t) => t.km <= 3).sort((a, b) => a.km - b.km);
  if (sort === "popular") list = [...list].sort((a, b) => b.applicants - a.applicants);
  if (sort === "latest") list = [...list].sort((a, b) => a.postedHours - b.postedHours);

  return (
    <div className="page">
      <h1 className="page-title">All Tasks</h1>

      <div className="tools">
        <label className="search">
          <span aria-hidden="true">🔍</span>
          <input
            value={q}
            onChange={(e) => setParam("q", e.target.value)}
            placeholder="Search tasks…"
            aria-label="Search tasks"
          />
        </label>

        <select
          className="select"
          value={cat}
          onChange={(e) => setParam("cat", e.target.value)}
          aria-label="Category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div className="chips" role="tablist">
        {CHIPS.map((c) => (
          <button
            key={c.v}
            role="tab"
            aria-selected={sort === c.v}
            className={`chip ${sort === c.v ? "active" : ""}`}
            onClick={() => setParam("sort", c.v)}
          >
            {c.t}
          </button>
        ))}
      </div>

      <p className="count">{list.length} task{list.length === 1 ? "" : "s"} found</p>

      {list.length === 0 ? (
        <div className="empty">No tasks match your search. Try different words or clear the filters.</div>
      ) : (
        <div className="tlist">
          {list.map((t) => (
            <TaskCard key={t.id} task={t} applied={applied.includes(t.id)} onApply={toggleApply} />
          ))}
        </div>
      )}
    </div>
  );
}