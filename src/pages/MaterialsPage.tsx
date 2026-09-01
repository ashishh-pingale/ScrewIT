import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
// api.matching.* = queries + action defined in convex/matching.ts
// api.queries.* = queries defined in convex/queries.ts
import "./PageLayout.css";
import "./MaterialsPage.css";

const statusColor: Record<string, string> = {
  ingested: "#6b7280",
  mapped: "#2563eb",
  review: "#d97706",
  approved: "#16a34a",
};

export default function MaterialsPage() {
  const materials = useQuery(api.matching.allCpseMaterials);
  const allMappings = useQuery(api.matching.allMappings);
  const runMatching = useAction(api.matching.generateMatchCandidates);

  const [matching, setMatching] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // ── Derived stats ─────────────────────────────────────────────────
  const totalMaterials = materials?.length ?? 0;

  const cpseIds = materials
    ? [...new Set(materials.map((m) => m.cpseId))]
    : [];
  const cpseCount = cpseIds.length;

  const mappedCount =
    allMappings?.filter((m) => m.reviewStatus === "approved").length ?? 0;
  const pendingCount =
    allMappings?.filter((m) => m.reviewStatus === "pending").length ?? 0;

  // ── Build a lookup of mapping status per material ──────────────────
  const mappingLookup = new Map<string, string>();
  for (const m of allMappings ?? []) {
    const key = `${m.cpseId}|${m.sourceMaterialCode}`;
    // Use the "worst" status: pending > approved > rejected
    const existing = mappingLookup.get(key);
    if (
      !existing ||
      (m.reviewStatus === "pending" && existing !== "pending") ||
      (m.reviewStatus === "approved" && existing === "rejected")
    ) {
      mappingLookup.set(key, m.reviewStatus);
    }
  }

  // ── Filter state ──────────────────────────────────────────────────
  const [cpseFilter, setCpsFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = (materials ?? []).filter((m) => {
    if (cpseFilter !== "all" && m.cpseId !== cpseFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${m.sourceMaterialCode} ${m.sourceDescription} ${m.cpseId} ${m.classificationCode}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  // ── Handler ───────────────────────────────────────────────────────
  async function handleRunMatching() {
    setMatching(true);
    setToast(null);
    try {
      const result = await runMatching({});
      setToast(
        `✅ Matching complete — ${result.clustersFound} cluster${result.clustersFound !== 1 ? "s" : ""} found, ${result.mappingsCreated} new mapping${result.mappingsCreated !== 1 ? "s" : ""} created`
      );
    } catch (err) {
      setToast(`❌ Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setMatching(false);
      // Auto-dismiss toast after 8 seconds
      setTimeout(() => setToast(null), 8000);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (materials === undefined) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Ingested Materials</h1>
          <p className="page-description">Loading materials…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div className={`toast ${toast.startsWith("❌") ? "toast--error" : ""}`}>
          {toast}
        </div>
      )}

      <div className="page-header">
        <h1>Ingested Materials</h1>
        <p className="page-description">
          Material catalog entries ingested from CPSE ERP systems. Run the AI
          matching engine to detect cross-CPSE duplicate candidates.
        </p>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalMaterials.toLocaleString()}</div>
          <div className="stat-label">Total Materials</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mappedCount.toLocaleString()}</div>
          <div className="stat-label">Mapped</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{pendingCount.toLocaleString()}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cpseCount}</div>
          <div className="stat-label">CPSEs Connected</div>
        </div>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────── */}
      <div className="table-card">
        <div className="table-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search materials by code, description, or CPSE…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="filter-select"
            value={cpseFilter}
            onChange={(e) => setCpsFilter(e.target.value)}
          >
            <option value="all">All CPSEs</option>
            {cpseIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <button
            className="btn btn-ai"
            disabled={matching}
            onClick={handleRunMatching}
          >
            {matching ? (
              <>
                <span className="spinner" /> Running…
              </>
            ) : (
              "⚡ Run AI Matching"
            )}
          </button>
        </div>

        {/* ── Table ──────────────────────────────────────────────── */}
        {totalMaterials === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📥</div>
            <p>No materials ingested yet.</p>
            <a href="/ingestion" className="btn btn-primary" style={{ marginTop: "0.75rem" }}>
              Import Materials →
            </a>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>CPSE</th>
                <th>Source Code</th>
                <th>Description</th>
                <th>UoM</th>
                <th>Classification</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row" style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--gray-500)", fontStyle: "italic" }}>
                    No materials match the current search or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const key = `${m.cpseId}|${m.sourceMaterialCode}`;
                  const mapStatus = mappingLookup.get(key);
                  const displayStatus = mapStatus ?? "ingested";
                  return (
                    <tr key={m._id}>
                      <td>
                        <span className="cpse-badge">{m.cpseId}</span>
                      </td>
                      <td className="code-cell">{m.sourceMaterialCode}</td>
                      <td>{m.sourceDescription}</td>
                      <td>{m.uom}</td>
                      <td className="code-cell">{m.classificationCode}</td>
                      <td>
                        <span
                          className="status-badge"
                          style={{ backgroundColor: statusColor[displayStatus] ?? "#6b7280" }}
                        >
                          {displayStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
