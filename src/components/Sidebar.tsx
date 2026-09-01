import { NavLink } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./Sidebar.css";

export default function Sidebar() {
  const pendingCount = useQuery(api.queries.pendingCount);

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
          to="/"
          end
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">🏠</span>
          Overview
        </NavLink>
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
          {pendingCount !== undefined && pendingCount > 0 && (
            <span className="nav-badge">{pendingCount}</span>
          )}
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">📊</span>
          Analytics
        </NavLink>
        <NavLink
          to="/audit-trail"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">📜</span>
          Audit Trail
        </NavLink>
        <NavLink
          to="/ingestion"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">📥</span>
          Data Ingestion
        </NavLink>
        <NavLink
          to="/integration"
          className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">🔄</span>
          Integration
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="footer-label">CPSE Portal</div>
        <div className="footer-version">v0.1.0 — Hackathon Demo</div>
      </div>
    </aside>
  );
}
