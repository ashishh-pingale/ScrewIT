import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./PageLayout.css";
import "./AuditTrailPage.css";

// ── Formatting helpers ─────────────────────────────────────────────────
function fmtDateShort(ts: number) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── Action / entity styling ────────────────────────────────────────────
const actionStyles: Record<string, { bg: string; fg: string; icon: string }> = {
  created: { bg: "#dbeafe", fg: "#1e40af", icon: "+" },
  approved: { bg: "#dcfce7", fg: "#166534", icon: "✓" },
  rejected: { bg: "#fee2e2", fg: "#991b1b", icon: "✗" },
  updated: { bg: "#fef3c7", fg: "#92400e", icon: "✎" },
};

const entityIcons: Record<string, string> = {
  nationalMaterial: "📄",
  mapping: "🔗",
  cpseMaterial: "📦",
};

// ── JSON diff viewer ───────────────────────────────────────────────────
function JsonDiff({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  if (allKeys.size === 0) {
    return <div className="json-empty">No state data recorded</div>;
  }

  return (
    <div className="json-diff">
      <div className="json-diff-header">
        <span className="json-diff-col json-diff-col--before">Before</span>
        <span className="json-diff-col json-diff-col--after">After</span>
      </div>
      {[...allKeys].sort().map((key) => {
        const bVal = before?.[key];
        const aVal = after?.[key];
        const bStr = bVal === undefined ? "—" : formatVal(bVal);
        const aStr = aVal === undefined ? "—" : formatVal(aVal);
        const changed = bStr !== aStr;
        return (
          <div
            key={key}
            className={`json-diff-row ${changed ? "json-diff-row--changed" : ""}`}
          >
            <div className="json-diff-key">{key}</div>
            <div className="json-diff-col json-diff-col--before">
              <code>{bStr}</code>
            </div>
            <div className="json-diff-col json-diff-col--after">
              <code>{aStr}</code>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatVal(v: unknown): string {
  if (v === null) return "null";
  if (v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v, null, 0);
  return String(v);
}

// ── Main component ─────────────────────────────────────────────────────
export default function AuditTrailPage() {
  const trail = useQuery(api.analytics.auditTrail);
  const counts = useQuery(api.analytics.auditTrailCounts);

  // ── Filter state ──────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");

  // ── Expand state ──────────────────────────────────────────────────
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Sort state ────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<"timestamp" | "action" | "entityType" | "actor">("timestamp");
  const [sortAsc, setSortAsc] = useState(false);

  // ── Filtered + sorted data ────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!trail) return [];
    let rows = trail;

    if (actionFilter !== "all")
      rows = rows.filter((r) => r.action === actionFilter);
    if (entityFilter !== "all")
      rows = rows.filter((r) => r.entityType === entityFilter);
    if (actorFilter !== "all")
      rows = rows.filter((r) => r.actor === actorFilter);

    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => {
        const hay = [
          r.entityType,
          r.entityId,
          r.action,
          r.actor,
          r.beforeState ? JSON.stringify(r.beforeState) : "",
          r.afterState ? JSON.stringify(r.afterState) : "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    rows = [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

    return rows;
  }, [trail, search, actionFilter, entityFilter, actorFilter, sortKey, sortAsc]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === "timestamp" ? false : true);
    }
  }

  const sortIcon = (key: typeof sortKey) =>
    sortKey === key ? (sortAsc ? " ▲" : " ▼") : "";

  // ── Loading ───────────────────────────────────────────────────────
  if (!trail || !counts) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>Audit Trail</h1>
          <p className="page-description">Loading audit log…</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Audit Trail</h1>
        <p className="page-description">
          Immutable, append-only log of all system actions. Every material
          creation, mapping approval, and configuration change is recorded
          with full before/after state for compliance verification.
        </p>
      </div>

      {/* ── Summary counts ────────────────────────────────────────── */}
      <div className="audit-counts-row">
        <div className="audit-count-chip">
          <span className="audit-count-value">{counts.total}</span>
          <span className="audit-count-label">Total Entries</span>
        </div>
        {counts.actions.map((a) => {
          const s = actionStyles[a] ?? { bg: "#f3f4f6", fg: "#374151", icon: "?" };
          return (
            <div key={a} className="audit-count-chip" style={{ borderLeftColor: s.fg }}>
              <span className="audit-count-value" style={{ color: s.fg }}>
                {counts.byAction[a]}
              </span>
              <span className="audit-count-label">{a}</span>
            </div>
          );
        })}
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div className="audit-filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by actor, entity, action, or JSON content…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="all">All Actions</option>
          {counts.actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="all">All Entity Types</option>
          {counts.entityTypes.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          className="filter-select"
          value={actorFilter}
          onChange={(e) => setActorFilter(e.target.value)}
        >
          <option value="all">All Actors</option>
          {counts.actors.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {(actionFilter !== "all" || entityFilter !== "all" || actorFilter !== "all" || search) && (
          <button
            className="btn btn-ghost"
            onClick={() => {
              setActionFilter("all");
              setEntityFilter("all");
              setActorFilter("all");
              setSearch("");
            }}
          >
            Clear
          </button>
        )}
        <span className="audit-result-count">
          {filtered.length} of {trail.length} entries
        </span>
      </div>

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div className="audit-table-card">
        <table className="audit-table">
          <thead>
            <tr>
              <th className="audit-th-expand" />
              <th
                className="audit-th-sortable"
                onClick={() => toggleSort("timestamp")}
              >
                Timestamp{sortIcon("timestamp")}
              </th>
              <th
                className="audit-th-sortable"
                onClick={() => toggleSort("actor")}
              >
                Actor{sortIcon("actor")}
              </th>
              <th
                className="audit-th-sortable"
                onClick={() => toggleSort("action")}
              >
                Action{sortIcon("action")}
              </th>
              <th
                className="audit-th-sortable"
                onClick={() => toggleSort("entityType")}
              >
                Entity{sortIcon("entityType")}
              </th>
              <th>Entity ID</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              const isExpanded = expandedId === entry._id;
              const s = actionStyles[entry.action] ?? {
                bg: "#f3f4f6",
                fg: "#374151",
                icon: "?",
              };
              return (
                <AuditRow
                  key={entry._id}
                  entry={entry}
                  isExpanded={isExpanded}
                  onToggle={() =>
                    setExpandedId(isExpanded ? null : entry._id)
                  }
                  actionStyle={s}
                />
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="audit-empty">
                  No audit entries match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Single row (with expandable detail) ────────────────────────────────
function AuditRow({
  entry,
  isExpanded,
  onToggle,
  actionStyle,
}: {
  entry: {
    _id: string;
    entityType: string;
    entityId: string;
    action: string;
    actor: string;
    timestamp: number;
    beforeState: Record<string, unknown> | null;
    afterState: Record<string, unknown> | null;
  };
  isExpanded: boolean;
  onToggle: () => void;
  actionStyle: { bg: string; fg: string; icon: string };
}) {
  const entityIdShort =
    entry.entityId.length > 12
      ? entry.entityId.slice(0, 12) + "…"
      : entry.entityId;

  return (
    <>
      <tr
        className={`audit-row ${isExpanded ? "audit-row--expanded" : ""}`}
        onClick={onToggle}
      >
        <td className="audit-td-expand">
          <span className={`expand-arrow ${isExpanded ? "expand-arrow--open" : ""}`}>
            ▸
          </span>
        </td>
        <td className="audit-td-time">
          <div className="audit-date">{fmtDateShort(entry.timestamp)}</div>
          <div className="audit-time">{new Date(entry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</div>
        </td>
        <td>
          <span className="audit-actor">{entry.actor}</span>
        </td>
        <td>
          <span
            className="audit-action-badge"
            style={{ backgroundColor: actionStyle.bg, color: actionStyle.fg }}
          >
            <span className="audit-action-icon">{actionStyle.icon}</span>
            {entry.action}
          </span>
        </td>
        <td>
          <span className="audit-entity">
            <span className="audit-entity-icon">
              {entityIcons[entry.entityType] ?? "📌"}
            </span>
            {entry.entityType}
          </span>
        </td>
        <td className="audit-td-id">
          <code title={entry.entityId}>{entityIdShort}</code>
        </td>
      </tr>
      {isExpanded && (
        <tr className="audit-detail-row">
          <td colSpan={6} className="audit-detail-cell">
            <div className="audit-detail-header">
              Full Entity ID:
              <code className="audit-full-id">{entry.entityId}</code>
            </div>
            <div className="audit-detail-cols">
              <div className="audit-detail-section">
                <h4>Before State</h4>
                <JsonDiff before={entry.beforeState} after={null} />
              </div>
              <div className="audit-detail-section">
                <h4>After State</h4>
                <JsonDiff before={null} after={entry.afterState} />
              </div>
            </div>
            {entry.beforeState && entry.afterState && (
              <div className="audit-detail-section audit-detail-diff">
                <h4>Change Summary</h4>
                <JsonDiff before={entry.beforeState} after={entry.afterState} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
