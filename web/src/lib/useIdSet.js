import { useCallback, useState } from "react";

export function useIdSet(key) {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  });

  const toggle = useCallback(
    (id) => {
      setIds((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    },
    [key]
  );

  return [ids, toggle];
}