import { useEffect, useState } from "react";

export default function App() {
  const [health, setHealth] = useState("checking...");
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  const load = async () => {
    const res = await fetch("/api/tasks/");
    setTasks(await res.json());
  };

  useEffect(() => {
    fetch("/api/health/")
      .then((r) => r.json())
      .then((d) => setHealth(d.status))
      .catch(() => setHealth("unreachable"));
    load().catch(() => {});
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/tasks/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    load();
  };

  return (
    <main>
      <h1>Taskyaar</h1>
      <p>
        API status:{" "}
        <strong className={health === "ok" ? "ok" : "bad"}>{health}</strong>
      </p>
      <form onSubmit={add}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task"
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.title} <small>({t.status})</small>
          </li>
        ))}
      </ul>
    </main>
  );
}
