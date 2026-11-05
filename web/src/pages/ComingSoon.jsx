import { Link } from "react-router-dom";

export default function ComingSoon({ title = "Coming soon" }) {
  return (
    <div className="page">
      <div className="empty">
        <h1 className="page-title" style={{ fontSize: 24 }}>{title}</h1>
        <p style={{ margin: "8px 0 16px" }}>This page is being built next.</p>
        <Link to="/home" className="btn btn-primary">Back to Home</Link>
      </div>
    </div>
  );
}