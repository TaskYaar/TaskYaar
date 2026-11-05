export const STEPS = [
  {
    key: "notifications",
    icon: "🔔",
    title: "Enable notifications",
    desc: "Get instant alerts when someone applies to your task, sends you a message, or a payment arrives.",
    allow: "Allow notifications",
    request: async () => {
      if (!("Notification" in window)) return "unsupported";
      const result = await Notification.requestPermission();
      return result === "default" ? "denied" : result;
    },
  },
  {
    key: "camera",
    icon: "📷",
    title: "Allow camera access",
    desc: "Take photos of your task or profile directly in the app, so helpers know exactly what you need.",
    allow: "Allow camera",
    request: async () => {
      if (!navigator.mediaDevices?.getUserMedia) return "unsupported";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        return "granted";
      } catch {
        return "denied";
      }
    },
  },
  {
    key: "location",
    icon: "📍",
    title: "Share your location",
    desc: "See tasks and helpers near you. Your exact location is never shown to other users.",
    allow: "Allow location",
    request: () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) return resolve("unsupported");
        navigator.geolocation.getCurrentPosition(
          () => resolve("granted"),
          () => resolve("denied"),
          { timeout: 15000 }
        );
      }),
  },
  {
    key: "contacts",
    icon: "👥",
    title: "Access your contacts",
    desc: "Invite friends and find people you know on TaskYaar. We never message anyone without your approval.",
    allow: "Allow contacts",
    request: async () => {
      if (!("contacts" in navigator) || !("ContactsManager" in window)) return "unsupported";
      try {
        await navigator.contacts.select(["name", "tel"], { multiple: true });
        return "granted";
      } catch {
        return "denied";
      }
    },
  },
];