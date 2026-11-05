import { useCallback, useState } from "react";
import { TASKS } from "../data/tasks.js";

const KEY = "posted";

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
};

export function useTasks() {
  const [posted, setPosted] = useState(read);

  const addTask = useCallback((task) => {
    const next = [task, ...read()];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setPosted(next);
  }, []);

  return { tasks: [...posted, ...TASKS], addTask };
}