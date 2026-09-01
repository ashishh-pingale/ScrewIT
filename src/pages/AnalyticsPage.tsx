import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./PageLayout.css";
import "./AnalyticsPage.css";

// ── Formatting helpers ─────────────────────────────────────────────────
function fmtNumber(n: number) {
  return n.toLocaleString("en-IN");
}

function fmtCurrency(amount: number) {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${fmtNumber(amount)}`;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Category colour palette ────────────────────────────────────────────
const catColors: Record<string, string> = {
  Valves: "#1e40af",
  Pipes: "#047857",
  Fasteners: "#9333ea",
  Electrical: "#dc2626",
  Fittings: "#d97706",
  Flanges: "#0891b2",
  Instruments: "#be185d",
  Gaskets: "#65a30d",
  Other: "#6b7280",
};

export default function AnalyticsPage() {
  const summary = useQuery(api.analytics.summaryStats);
  const categoryData = useQuery(api.analytics.categoryBreakdown);
  const clusters = useQuery(api.analytics.approvedClusters);
  const activity = useQuery(api.analytics.recentActivity);

  // ── Cost savings calculator state ──────────────────────────────────
  const [unitCost, setUnitCost] = useState<number>(25000);

  const savingsData = useMemo(() => {
    if (!clusters) return { total: 0, items: [] as { code: string; desc: string; saving: number; cpseCount: number; memberCount: number }[] };
    let total = 0;
    const items = clusters.map((c) => {
      // Savings = (duplicate_count - 1) × unitCost
      // Because each duplicate is an extra procurement that could be eliminated
      const duplicates = c.memberCount - 1;
      const saving = duplicates * unitCost;
      total += saving;
      return {
        code: c.nationalCode,
        desc: c.standardDescription,
        saving,
        cpseCount: c.cpseCount,
        memberCount: c.memberCount,
      };
    });
    return { total, items };
  }, [clusters, unitCost]);

  // ── Loading state ──────────────────────────────────────────────────
  if (!summary || !categoryData || !clusters || !activity) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Analytics Dashboard</h1>
          <p className="page-description">Loading analytics…</p>
        </div>
        <div className="stats-row">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton-bar" />
              <div className="skeleton-bar short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Bar chart scaling ──────────────────────────────────────────────
  const maxClusterCount = Math.max(
    ...categoryData.categories.map((c) => c.clusterCount),
    1
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p className="page-description">
          Cross-CPSE material harmonization metrics, deduplication progress,
          and cost-savings estimates.
        </p>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────────── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{fmtNumber(summary.totalMaterials)}</div>
          <div className="stat-label">Materials Ingested</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.clusterCount}</div>
          <div className="stat-label">Duplicate Clusters</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.approvedNationals}</div>
          <div className="stat-label">Approved National Codes</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{summary.pendingCount}</div>
          <div className="stat-label">Still Needing Review</div>
        </div>
      </div>

      {/* ── Bar Chart: Clusters by Category ───────────────────────── */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Duplicate Clusters by Category</h2>
          <span className="section-sub">
            {categoryData.totalClusters} total clusters across{" "}
            {categoryData.categories.length} categories
          </span>
        </div>
        <div className="chart-card">
          <div className="bar-chart">
            {categoryData.categories.map((cat) => {
              const pct = (cat.clusterCount / maxClusterCount) * 100;
              const color = catColors[cat.name] ?? catColors.Other;
              return (
                <div key={cat.name} className="bar-group">
                  <div className="bar-stack">
                    <div
                      className="bar"
                      style={{
                        height: `${pct}%`,
                        backgroundColor: color,
                      }}
                    >
                      <span className="bar-label">{cat.clusterCount}</span>
                    </div>
                  </div>
                  <div className="bar-meta">
                    <span className="bar-category">{cat.name}</span>
                    <span className="bar-sub">
                      {cat.totalMaterials} materials
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Cost Savings Calculator ───────────────────────────────── */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Estimated Procurement Savings</h2>
          <div className="cost-input-row">
            <label className="cost-label">Assumed avg. unit cost (₹)</label>
            <input
              type="number"
              className="cost-input"
              value={unitCost}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 0) setUnitCost(v);
              }}
              min={0}
              step={1000}
            />
          </div>
        </div>

        <div className="savings-highlight">
          <div className="savings-total">
            {fmtCurrency(savingsData.total)}
          </div>
          <div className="savings-sublabel">
            potential savings from consolidated procurement across{" "}
            {clusters.length} approved clusters
          </div>
        </div>

        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>National Code</th>
                <th>Description</th>
                <th>CPSEs</th>
                <th>Duplicates</th>
                <th>Est. Savings</th>
              </tr>
            </thead>
            <tbody>
              {savingsData.items.map((item) => (
                <tr key={item.code}>
                  <td className="code-cell">{item.code}</td>
                  <td className="desc-cell">{item.desc}</td>
                  <td>
                    <span className="cpse-count">{item.cpseCount}</span>
                  </td>
                  <td>{item.memberCount - 1}</td>
                  <td className="savings-cell">{fmtCurrency(item.saving)}</td>
                </tr>
              ))}
              {savingsData.items.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No approved multi-CPSE clusters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Activity Feed ─────────────────────────────────────────── */}
      <div className="analytics-section">
        <div className="section-header">
          <h2>Recent Activity</h2>
          <span className="section-sub">
            Last {activity.length} audit log entries
          </span>
        </div>
        <div className="activity-feed">
          {activity.map((entry) => (
            <div key={entry._id} className="activity-item">
              <div
                className={`activity-dot activity-dot--${entry.action}`}
              />
              <div className="activity-content">
                <div className="activity-text">
                  <span className="activity-actor">{entry.actor}</span>{" "}
                  {entry.verb.toLowerCase()}{" "}
                  <span className="activity-target">{entry.target}</span>
                </div>
                <div className="activity-time">{timeAgo(entry.timestamp)}</div>
              </div>
            </div>
          ))}
          {activity.length === 0 && (
            <div className="empty-state">
              <p>No activity recorded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
