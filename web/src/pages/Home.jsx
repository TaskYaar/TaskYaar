import Logo from "../components/Logo.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <main className="home">
      <div className="home-inner">
        <header className="home-bar">
          <Logo size={28} />
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </header>

        <section className="home-card">
          <h1>Hi, {user.name} 👋</h1>
          <p>
            You&rsquo;re logged in with +91 {user.phone} in {user.city}.
            <br />
            Role: <b>{user.role}</b>
          </p>
          <p>Tasks, chat and wallet pages come next.</p>
        </section>
      </div>
    </main>
  );
}