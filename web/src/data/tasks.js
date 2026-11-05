export const CATEGORIES = [
  { id: "home-help", label: "Home Help", icon: "🏠" },
  { id: "delivery", label: "Delivery", icon: "🚚" },
  { id: "cleaning", label: "Cleaning", icon: "🧹" },
  { id: "repair", label: "Repair", icon: "🔧" },
  { id: "digital", label: "Digital Work", icon: "💻" },
  { id: "education", label: "Education", icon: "🎓" },
  { id: "events", label: "Events", icon: "🎉" },
];

export const catById = (id) =>
  CATEGORIES.find((c) => c.id === id) || { id: "other", label: "Other", icon: "📌" };

export const TASKS = [
  {
    id: 1, title: "Need a delivery helper", cat: "delivery",
    short: "Collect a parcel and deliver in Kothrud.",
    price: 500, negotiable: true, km: 2.4, when: "Today, 4:00 PM",
    applicants: 4, postedHours: 1, location: "Kothrud, Pune",
    desc: "Need someone to collect a document from FC Road and deliver it to Kothrud. Should be available today evening.",
    poster: { name: "Rahul Sharma", rating: 4.8, reviews: 23, completed: 23, verified: true },
  },
  {
    id: 2, title: "Home Cleaning", cat: "cleaning",
    short: "2 BHK flat cleaning required.",
    price: 800, negotiable: false, km: 1.1, when: "Today", applicants: 9, postedHours: 3,
    location: "Karve Nagar, Pune",
    desc: "Full cleaning of a 2 BHK flat including kitchen and bathrooms. Cleaning supplies will be provided.",
    poster: { name: "Neha Joshi", rating: 4.9, reviews: 31, completed: 31, verified: true },
  },
  {
    id: 3, title: "Website Designer", cat: "digital",
    short: "Need a website for my business.",
    price: 3000, negotiable: true, km: 0, when: "Online", applicants: 14, postedHours: 6,
    location: "Online",
    desc: "Need a simple 4-page website for my small business. Design and basic development. Content will be shared.",
    poster: { name: "Amit Patil", rating: 4.6, reviews: 9, completed: 9, verified: false },
  },
  {
    id: 4, title: "Electrician", cat: "repair",
    short: "Repair wiring in 1 room.",
    price: 600, negotiable: false, km: 2.7, when: "Tomorrow", applicants: 3, postedHours: 8,
    location: "Aundh, Pune",
    desc: "Wiring in one room needs repair. Two switchboards are not working. Bring basic tools.",
    poster: { name: "Sagar More", rating: 4.7, reviews: 15, completed: 15, verified: true },
  },
  {
    id: 5, title: "Tuition Teacher", cat: "education",
    short: "Maths teacher for 10th std.",
    price: 1200, negotiable: true, km: 1.5, when: "Daily", applicants: 6, postedHours: 20,
    location: "Baner, Pune",
    desc: "Looking for a maths teacher for a 10th standard student, one hour daily in the evening.",
    poster: { name: "Sneha Kale", rating: 4.9, reviews: 18, completed: 18, verified: true },
  },
  {
    id: 6, title: "Birthday party helper", cat: "events",
    short: "Help with setup and decoration.",
    price: 700, negotiable: true, km: 3.8, when: "Saturday", applicants: 2, postedHours: 26,
    location: "Wakad, Pune",
    desc: "Need two people to help with balloon decoration and setup for a birthday party on Saturday afternoon.",
    poster: { name: "Rohit Jadhav", rating: 4.6, reviews: 9, completed: 9, verified: false },
  },
  {
    id: 7, title: "Move furniture", cat: "home-help",
    short: "Shift furniture within the same building.",
    price: 450, negotiable: false, km: 0.9, when: "Today, 6:00 PM", applicants: 5, postedHours: 2,
    location: "Kothrud, Pune",
    desc: "Shift a sofa, a bed and a table from the 2nd floor to the 4th floor of the same building. Two helpers preferred.",
    poster: { name: "Priya Nair", rating: 4.8, reviews: 12, completed: 12, verified: true },
  },
];

export const money = (n) => "₹" + n.toLocaleString("en-IN");