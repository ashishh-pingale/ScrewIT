import { useQuery } from "convex/react";
import { Link } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import "./LandingPage.css";

export default function LandingPage() {
  const summary = useQuery(api.analytics.summaryStats);

  return (
    <div className="landing">
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-badge">SIH 2026 · Problem 26099</div>
        <h1 className="landing-title">
          One Nation
          <br />
          <span className="landing-title-accent">One Material Code</span>
        </h1>
        <p className="landing-subtitle">
          ScrewIT harmonizes material catalogs across India's Central Public
          Sector Enterprises — eliminating duplicate inventory, unifying
          procurement, and saving crores through AI-driven material code
          standardization.
        </p>
        <div className="landing-hero-actions">
          <Link to="/ingestion" className="landing-btn landing-btn--primary">
            📥 Import Materials
          </Link>
          <Link to="/materials" className="landing-btn landing-btn--secondary">
            📋 View Catalog →
          </Link>
        </div>
      </section>

      {/* ── Live Stats ─────────────────────────────────────────────── */}
      {summary && (
        <section className="landing-stats">
          <div className="landing-stat">
            <div className="landing-stat-value">
              {summary.totalMaterials.toLocaleString("en-IN")}
            </div>
            <div className="landing-stat-label">Materials Ingested</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value">{summary.clusterCount}</div>
            <div className="landing-stat-label">Duplicate Clusters</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value">
              {summary.approvedNationals}
            </div>
            <div className="landing-stat-label">National Codes</div>
          </div>
          <div className="landing-stat">
            <div className="landing-stat-value">{summary.pendingCount}</div>
            <div className="landing-stat-label">Pending Review</div>
          </div>
        </section>
      )}

      {/* ── Problem Statement ──────────────────────────────────────── */}
      <section className="landing-section">
        <h2>The Problem</h2>
        <p>
          CPSEs across Oil &amp; Gas, Power, and Steel each run independent
          SAP/ERP instances. The same "6 inch, Class 300, RF flanged gate
          valve" might exist as three different material codes, three
          different units of measure, and three inconsistent descriptions
          across CPCL, NTPC, and SAIL. This causes:
        </p>
        <div className="landing-problems">
          <div className="landing-problem-card">
            <div className="landing-problem-icon">📦</div>
            <h3>15–30% Catalog Redundancy</h3>
            <p>Inflated inventory masters across every PSU material database</p>
          </div>
          <div className="landing-problem-card">
            <div className="landing-problem-icon">💰</div>
            <h3>Lost Bulk Procurement Leverage</h3>
            <p>No visibility into aggregate demand across companies</p>
          </div>
          <div className="landing-problem-card">
            <div className="landing-problem-icon">🔀</div>
            <h3>Error-Prone Reconciliation</h3>
            <p>Manual cross-CPSE sourcing attempts with inconsistent data</p>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────── */}
      <section className="landing-section">
        <h2>How It Works</h2>
        <div className="landing-workflow">
          <div className="landing-step">
            <div className="landing-step-num">1</div>
            <h3>Ingest</h3>
            <p>Upload material catalogs from each CPSE's ERP system</p>
          </div>
          <div className="landing-step-arrow">→</div>
          <div className="landing-step">
            <div className="landing-step-num">2</div>
            <h3>Match</h3>
            <p>AI engine detects duplicates using NLP similarity scoring</p>
          </div>
          <div className="landing-step-arrow">→</div>
          <div className="landing-step">
            <div className="landing-step-num">3</div>
            <h3>Review</h3>
            <p>Subject matter experts approve or reject proposed mappings</p>
          </div>
          <div className="landing-step-arrow">→</div>
          <div className="landing-step">
            <div className="landing-step-num">4</div>
            <h3>Harmonize</h3>
            <p>National codes are published and synced back to each ERP</p>
          </div>
        </div>
      </section>

      {/* ── Quick Links ────────────────────────────────────────────── */}
      <section className="landing-section">
        <h2>Quick Links</h2>
        <div className="landing-links">
          <Link to="/materials" className="landing-link-card">
            <span className="landing-link-icon">📋</span>
            <h3>Materials</h3>
            <p>Browse and search all ingested CPSE material entries</p>
          </Link>
          <Link to="/review-queue" className="landing-link-card">
            <span className="landing-link-icon">🔍</span>
            <h3>Review Queue</h3>
            <p>Approve or reject AI-detected duplicate matches</p>
          </Link>
          <Link to="/analytics" className="landing-link-card">
            <span className="landing-link-icon">📊</span>
            <h3>Analytics</h3>
            <p>Harmonization metrics, savings estimates, and activity feed</p>
          </Link>
          <Link to="/ingestion" className="landing-link-card">
            <span className="landing-link-icon">📥</span>
            <h3>Data Ingestion</h3>
            <p>Import new material catalogs via CSV upload</p>
          </Link>
          <Link to="/integration" className="landing-link-card">
            <span className="landing-link-icon">🔄</span>
            <h3>Integration</h3>
            <p>Simulate ERP sync-back to CPSE systems</p>
          </Link>
          <Link to="/audit-trail" className="landing-link-card">
            <span className="landing-link-icon">📜</span>
            <h3>Audit Trail</h3>
            <p>Immutable compliance log of all system actions</p>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <p>
          Built for Smart India Hackathon 2026 · Problem Statement 26099 ·
          Ministry of Petroleum &amp; Natural Gas
        </p>
      </footer>
    </div>
  );
}
