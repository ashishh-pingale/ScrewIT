import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import "./PageLayout.css";
import "./ReviewQueue.css";

// ── helpers ────────────────────────────────────────────────────────────
function confidenceColor(score: number) {
  if (score >= 85) return "green";
  if (score >= 70) return "amber";
  return "red";
}

function matchTypeLabel(t: string) {
  const map: Record<string, string> = {
    exact: "Exact Match",
    near_duplicate: "Near Duplicate",
    functional_equivalent: "Functional Equivalent",
  };
  return map[t] ?? t;
}

// ── CPSE color map for consistent badge colours ────────────────────────
const cpseColors: Record<string, string> = {
  CPCL: "#0f4c81",
  "PowerGen Ltd": "#1a5632",
  "SteelCo India": "#7c2d12",
};

// ── component ──────────────────────────────────────────────────────────
export default function ReviewQueuePage() {
  // live data
  const mappings = useQuery(api.queries.pendingMappings) ?? [];
  const cpseIds = useQuery(api.queries.pendingCpseIds) ?? [];
  const pendingCount = useQuery(api.queries.pendingCount);

  // mutations
  const approveMut = useMutation(api.review.approve);
  const rejectMut = useMutation(api.review.reject);
  const editAndApproveMut = useMutation(api.review.editAndApprove);

  // filters
  const [cpseFilter, setCpsFilter] = useState<string>("all");
  const [confFilter, setConfFilter] = useState<"all" | "high" | "mid" | "low">("all");

  // edit state
  const [editingId, setEditingId] = useState<Id<"materialMappings"> | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editUom, setEditUom] = useState("");
  const [busyId, setBusyId] = useState<Id<"materialMappings"> | null>(null);

  // ── apply filters ──────────────────────────────────────────────────
  const filtered = mappings.filter((m) => {
    if (cpseFilter !== "all" && m.cpseId !== cpseFilter) return false;
    if (confFilter === "high" && m.confidenceScore < 85) return false;
    if (confFilter === "mid" && (m.confidenceScore < 70 || m.confidenceScore >= 85))
      return false;
    if (confFilter === "low" && m.confidenceScore >= 70) return false;
    return true;
  });

  // ── action handlers ────────────────────────────────────────────────
  async function handleApprove(id: Id<"materialMappings">) {
    setBusyId(id);
    try {
      await approveMut({ mappingId: id });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: Id<"materialMappings">) {
    setBusyId(id);
    try {
      await rejectMut({ mappingId: id });
    } finally {
      setBusyId(null);
    }
  }

  function startEdit(m: (typeof mappings)[number]) {
    setEditingId(m._id);
    setEditDesc(m.nationalMaterial?.standardDescription ?? "");
    setEditUom(m.nationalMaterial?.standardUom ?? "");
  }

  async function handleEditApprove() {
    if (!editingId) return;
    const m = mappings.find((x) => x._id === editingId);
    if (!m) return;
    setBusyId(editingId);
    try {
      await editAndApproveMut({
        mappingId: editingId,
        nationalCode: m.nationalCode,
        standardDescription: editDesc,
        standardUom: editUom,
      });
      setEditingId(null);
    } finally {
      setBusyId(null);
    }
  }

  // ── loading skeleton ───────────────────────────────────────────────
  if (mappings === undefined) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Review Queue</h1>
          <p className="page-description">Loading pending mappings…</p>
        </div>
        <div className="match-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="match-card skeleton-card">
              <div className="skeleton-bar" />
              <div className="skeleton-bar short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── render ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Review Queue</h1>
        <p className="page-description">
          AI-detected duplicate material mappings awaiting human review.
          Approve to publish, reject to discard, or edit the standard
          description before approving.
        </p>
      </div>

      {/* ── stats row ─────────────────────────────────────────────── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{pendingCount ?? "…"}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{mappings.length}</div>
          <div className="stat-label">Showing (filtered)</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {mappings.length > 0
              ? (
                  mappings.reduce((s, m) => s + m.confidenceScore, 0) /
                  mappings.length
                ).toFixed(1)
              : "—"}
            %
          </div>
          <div className="stat-label">Avg Confidence</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cpseIds.length}</div>
          <div className="stat-label">CPSEs with Pending</div>
        </div>
      </div>

      {/* ── filters ───────────────────────────────────────────────── */}
      <div className="filter-bar">
        <label className="filter-label">
          CPSE
          <select
            value={cpseFilter}
            onChange={(e) => setCpsFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All CPSEs</option>
            {cpseIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-label">
          Confidence
          <select
            value={confFilter}
            onChange={(e) => setConfFilter(e.target.value as typeof confFilter)}
            className="filter-select"
          >
            <option value="all">All Bands</option>
            <option value="high">High (≥85%)</option>
            <option value="mid">Medium (70–84%)</option>
            <option value="low">Low (&lt;70%)</option>
          </select>
        </label>
        {(cpseFilter !== "all" || confFilter !== "all") && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setCpsFilter("all");
              setConfFilter("all");
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── match cards ───────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <p>No pending mappings match the current filters.</p>
        </div>
      ) : (
        <div className="match-list">
          {filtered.map((m) => {
            const isEditing = editingId === m._id;
            const isBusy = busyId === m._id;
            const conf = confidenceColor(m.confidenceScore);

            return (
              <div
                key={m._id}
                className={`match-card ${isBusy ? "match-card--busy" : ""}`}
              >
                {/* ── card header ──────────────────────────────── */}
                <div className="match-header">
                  <div className="match-info">
                    <span
                      className={`confidence-badge confidence-${conf}`}
                    >
                      {m.confidenceScore.toFixed(1)}%
                    </span>
                    <span className="match-type-badge">
                      {matchTypeLabel(m.matchType)}
                    </span>
                    <span className="suggested-code">
                      <strong>{m.nationalCode}</strong>
                    </span>
                  </div>
                  {!isEditing && (
                    <div className="match-actions">
                      <button
                        className="btn btn-approve"
                        disabled={isBusy}
                        onClick={() => handleApprove(m._id)}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn btn-edit"
                        disabled={isBusy}
                        onClick={() => startEdit(m)}
                      >
                        ✎ Edit &amp; Approve
                      </button>
                      <button
                        className="btn btn-reject"
                        disabled={isBusy}
                        onClick={() => handleReject(m._id)}
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* ── standard description preview ─────────────── */}
                <div className="standard-preview">
                  <span className="standard-preview-label">
                    Standard description:
                  </span>{" "}
                  {isEditing ? (
                    <span className="standard-preview--editing">
                      (editing below)
                    </span>
                  ) : (
                    m.nationalMaterial?.standardDescription ?? "—"
                  )}
                </div>

                {/* ── side-by-side materials ───────────────────── */}
                <div className="materials-compare">
                  {/* Pending material (left / highlighted) */}
                  <div className="material-col material-col--pending">
                    <div className="material-col-header">
                      <span
                        className="cpse-badge"
                        style={{
                          background:
                            cpseColors[m.cpseId] ?? "var(--navy-800)",
                        }}
                      >
                        {m.cpseId}
                      </span>
                      <span className="material-col-label">Pending</span>
                    </div>
                    {m.cpseMaterial ? (
                      <div className="material-detail">
                        <div className="material-code">
                          {m.cpseMaterial.sourceMaterialCode}
                        </div>
                        <div className="material-desc">
                          {m.cpseMaterial.sourceDescription}
                        </div>
                        <div className="material-meta">
                          <span>UoM: {m.cpseMaterial.uom}</span>
                          <span>
                            Class: {m.cpseMaterial.classificationCode}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="material-detail material-detail--missing">
                        Material record not found
                      </div>
                    )}
                  </div>

                  {/* Sibling materials (right / context) */}
                  {m.siblings.length > 0 && (
                    <div className="material-col material-col--siblings">
                      <div className="material-col-header">
                        <span className="material-col-label">
                          Other mappings in this cluster
                        </span>
                      </div>
                      {m.siblings.map((sib) => (
                        <div
                          key={sib.mapping._id}
                          className="material-detail material-detail--sibling"
                        >
                          <div className="sibling-header">
                            <span
                              className="cpse-badge"
                              style={{
                                background:
                                  cpseColors[sib.mapping.cpseId] ??
                                  "var(--navy-800)",
                              }}
                            >
                              {sib.mapping.cpseId}
                            </span>
                            <span
                              className={`sibling-status sibling-status--${sib.mapping.reviewStatus}`}
                            >
                              {sib.mapping.reviewStatus}
                            </span>
                          </div>
                          {sib.material ? (
                            <>
                              <div className="material-code">
                                {sib.material.sourceMaterialCode}
                              </div>
                              <div className="material-desc">
                                {sib.material.sourceDescription}
                              </div>
                              <div className="material-meta">
                                <span>UoM: {sib.material.uom}</span>
                                <span>
                                  Class: {sib.material.classificationCode}
                                </span>
                              </div>
                            </>
                          ) : (
                            <div className="material-detail--missing">
                              Record not found
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── edit form (inline) ───────────────────────── */}
                {isEditing && (
                  <div className="edit-form">
                    <h4>Edit Standard Description Before Approving</h4>
                    <div className="edit-fields">
                      <label className="edit-field">
                        <span>Standard Description</span>
                        <textarea
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          rows={2}
                        />
                      </label>
                      <label className="edit-field edit-field--small">
                        <span>UoM</span>
                        <input
                          value={editUom}
                          onChange={(e) => setEditUom(e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="edit-actions">
                      <button
                        className="btn btn-approve"
                        disabled={isBusy || !editDesc.trim() || !editUom.trim()}
                        onClick={handleEditApprove}
                      >
                        {isBusy ? "Saving…" : "✓ Save & Approve"}
                      </button>
                      <button
                        className="btn btn-ghost"
                        disabled={isBusy}
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
