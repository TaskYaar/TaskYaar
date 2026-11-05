import { useCallback, useState } from "react";

// Like useState, but the value is saved in localStorage
export function useLocalState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const v = typeof next === "function" ? next(prev) : next;
        try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
        return v;
      });
    },
    [key]
  );

  return [value, update];
}