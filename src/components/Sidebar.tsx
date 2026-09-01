import { NavLink } from "react-router-dom";
import "./Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">⬡</div>
        <div className="logo-text">
          <span className="logo-title">ScrewIT</span>
          <span className="logo-subtitle">National Material Code Harmonizer</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/materials"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">📋</span>
          Materials
        </NavLink>
        <NavLink
          to="/review-queue"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">🔍</span>
          Review Queue
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">📊</span>
          Analytics
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="footer-label">CPSE Portal</div>
        <div className="footer-version">v0.1.0 — Hackathon Demo</div>
      </div>
    </aside>
  );
}
