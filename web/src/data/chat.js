const KEY = "chats";

export const SEED_THREADS = [
  {
    id: "p1",
    name: "Sagar More",
    online: true,
    messages: [
      { id: 1, from: "them", text: "Hi, I can do this task. I am available at 4 PM.", at: "10:30 AM" },
      { id: 2, from: "me", text: "Great! Are you coming from nearby?", at: "10:31 AM" },
      { id: 3, from: "them", text: "Yes, I am nearby.", at: "10:32 AM" },
      { id: 4, from: "me", text: "Okay, I will share the details shortly.", at: "10:33 AM" },
    ],
  },
];

export function readThreads() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : SEED_THREADS;
  } catch {
    return SEED_THREADS;
  }
}

export function ensureThread(person) {
  const threads = readThreads();
  if (threads.some((t) => t.id === person.id)) return;
  const next = [...threads, { id: person.id, name: person.name, online: true, messages: [] }];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

export const nowLabel = () =>
  new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toUpperCase();