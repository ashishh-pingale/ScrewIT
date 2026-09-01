import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import "./PageLayout.css";
import "./SystemIntegrationPage.css";

// ── Fake ERP metadata per CPSE ─────────────────────────────────────────
const ERP_META: Record<
  string,
  { system: string; version: string; protocol: string; icon: string }
> = {
  CPCL: {
    system: "SAP ECC 6.0",
    version: "EHP8",
    protocol: "RFC / BAPI",
    icon: "🏭",
  },
  "PowerGen Ltd": {
    system: "Oracle EBS R12",
    version: "12.2.11",
    protocol: "REST API",
    icon: "⚡",
  },
  "SteelCo India": {
    system: "SAP S/4HANA",
    version: "2023 FPS02",
    protocol: "OData V2",
    icon: "🔩",
  },
};

// ── Component ──────────────────────────────────────────────────────────
export default function SystemIntegrationPage() {
  const syncData = useQuery(api.integration.syncStatus);
  const syncCpseMut = useMutation(api.integration.syncCpse);
  const syncAllMut = useMutation(api.integration.syncAll);

  const [syncingCpse, setSyncingCpse] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<
    Record<string, { synced: number; timestamp: number }>
  >({});
  const [expandedPayload, setExpandedPayload] = useState<string | null>(null);
  const [syncAllBusy, setSyncAllBusy] = useState(false);

  // ── Sync a single CPSE ────────────────────────────────────────────
  async function handleSync(cpseId: string) {
    setSyncingCpse(cpseId);
    // Simulate network delay for the animated "sending..." state
    await new Promise((r) => setTimeout(r, 1800));
    try {
      const result = await syncCpseMut({ cpseId });
      setSyncResults((prev) => ({
        ...prev,
        [cpseId]: { synced: result.synced, timestamp: result.timestamp },
      }));
    } finally {
      setSyncingCpse(null);
    }
  }

  // ── Sync all CPSEs ────────────────────────────────────────────────
  async function handleSyncAll() {
    setSyncAllBusy(true);
    await new Promise((r) => setTimeout(r, 2200));
    try {
      const result = await syncAllMut({});
      setSyncResults((prev) => {
        const next = { ...prev };
        // Mark all as synced
        for (const cpse of syncData ?? []) {
          if (cpse.unsynced > 0) {
            next[cpse.cpseId] = { synced: cpse.unsynced, timestamp: result.timestamp };
          }
        }
        return next;
      });
    } finally {
      setSyncAllBusy(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (!syncData) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>System Integration</h1>
          <p className="page-description">Loading integration status…</p>
        </div>
      </div>
    );
  }

  const totalApproved = syncData.reduce((s, c) => s + c.totalApproved, 0);
  const totalSynced = syncData.reduce((s, c) => s + c.synced, 0);
  const totalUnsynced = syncData.reduce((s, c) => s + c.unsynced, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>System Integration</h1>
        <p className="page-description">
          Simulates the ERP sync-back step: pushing approved national material
          codes back to each CPSE's ERP system via RFC/BAPI, REST, or OData
          connectors. In production this writes to SAP custom fields or
          extension tables.
        </p>
      </div>

      {/* ── Summary ─────────────────────────────────────────────── */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalApproved}</div>
          <div className="stat-label">Approved Mappings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalSynced}</div>
          <div className="stat-label">Synced to ERPs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalUnsynced}</div>
          <div className="stat-label">Pending Sync</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{syncData.length}</div>
          <div className="stat-label">Connected ERPs</div>
        </div>
      </div>

      {/* ── Sync All ────────────────────────────────────────────── */}
      {totalUnsynced > 0 && (
        <div className="sync-all-bar">
          <button
            className="btn btn-sync-all"
            disabled={syncAllBusy}
            onClick={handleSyncAll}
          >
            {syncAllBusy ? (
              <>
                <span className="sync-spinner" /> Sending to all ERPs…
              </>
            ) : (
              <>🔄 Sync All CPSEs</>
            )}
          </button>
          <span className="sync-all-hint">
            Pushes {totalUnsynced} pending national codes back to all connected
            ERP systems
          </span>
        </div>
      )}

      {/* ── ERP Cards ───────────────────────────────────────────── */}
      <div className="erp-grid">
        {syncData.map((cpse) => {
          const meta = ERP_META[cpse.cpseId] ?? {
            system: "Unknown ERP",
            version: "—",
            protocol: "—",
            icon: "📦",
          };
          const isSyncing = syncingCpse === cpse.cpseId;
          const justSynced = syncResults[cpse.cpseId];
          const allSynced = cpse.unsynced === 0 && cpse.totalApproved > 0;

          return (
            <div
              key={cpse.cpseId}
              className={`erp-card ${isSyncing ? "erp-card--syncing" : ""} ${allSynced ? "erp-card--synced" : ""}`}
            >
              {/* ── Card header ─────────────────────────────────── */}
              <div className="erp-card-header">
                <div className="erp-icon">{meta.icon}</div>
                <div className="erp-info">
                  <h3>{cpse.cpseName}</h3>
                  <span className="erp-meta">
                    {meta.system} {meta.version} · {meta.protocol}
                  </span>
                </div>
                <div className={`erp-status-dot ${allSynced ? "erp-status-dot--ok" : isSyncing ? "erp-status-dot--syncing" : ""}`} />
              </div>

              {/* ── Sync progress bar ──────────────────────────── */}
              <div className="erp-progress">
                <div className="erp-progress-bar">
                  <div
                    className="erp-progress-fill"
                    style={{
                      width:
                        cpse.totalApproved > 0
                          ? `${(cpse.synced / cpse.totalApproved) * 100}%`
                          : "0%",
                    }}
                  />
                </div>
                <div className="erp-progress-labels">
                  <span>
                    {cpse.synced} / {cpse.totalApproved} synced
                  </span>
                  {cpse.unsynced > 0 && (
                    <span className="erp-pending-count">
                      {cpse.unsynced} pending
                    </span>
                  )}
                </div>
              </div>

              {/* ── Sync result flash ───────────────────────────── */}
              {justSynced && (
                <div className="erp-sync-flash">
                  ✅ Synced {justSynced.synced} mappings at{" "}
                  {new Date(justSynced.timestamp).toLocaleTimeString("en-IN")}
                </div>
              )}

              {/* ── Sync button ─────────────────────────────────── */}
              <div className="erp-card-actions">
                {cpse.unsynced > 0 ? (
                  <button
                    className="btn btn-sync"
                    disabled={isSyncing || syncAllBusy}
                    onClick={() => handleSync(cpse.cpseId)}
                  >
                    {isSyncing ? (
                      <>
                        <span className="sync-spinner" /> Sending to{" "}
                        {cpse.cpseId} ERP…
                      </>
                    ) : (
                      <>🔄 Sync Now</>
                    )}
                  </button>
                ) : (
                  <span className="erp-synced-label">✓ All synced</span>
                )}

                {cpse.payloads.length > 0 && (
                  <button
                    className="btn btn-ghost"
                    onClick={() =>
                      setExpandedPayload(
                        expandedPayload === cpse.cpseId ? null : cpse.cpseId
                      )
                    }
                  >
                    {expandedPayload === cpse.cpseId
                      ? "Hide payload"
                      : `View payload (${cpse.payloads.length})`}
                  </button>
                )}
              </div>

              {/* ── Payload preview ─────────────────────────────── */}
              {expandedPayload === cpse.cpseId && cpse.payloads.length > 0 && (
                <div className="erp-payload">
                  <div className="erp-payload-header">
                    <span className="erp-payload-title">
                      Outbound SAP Payload — {cpse.cpseId}
                    </span>
                    <span className="erp-payload-format">
                      POST /api/v1/materials/save · JSON
                    </span>
                  </div>
                  <pre className="erp-payload-json">
                    {JSON.stringify(
                      cpse.payloads.map((p) => ({
                        sourceMaterialCode: p.sourceMaterialCode,
                        nationalMaterialCode: p.nationalCode,
                        standardDescription: p.description,
                        matchConfidence: `${p.confidenceScore}%`,
                        matchType: p.matchType,
                      })),
                      null,
                      2
                    )}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Architecture note ────────────────────────────────────── */}
      <div className="integration-note">
        <h4>How ERP sync-back works in production</h4>
        <p>
          Once a national code is approved, the integration layer pushes a
          cross-reference record to each CPSE's ERP via their native connector
          (SAP RFC/BAPI, Oracle REST, or OData). The CPSE's material master
          gains a new custom field <code>Z_NATIONAL_CODE</code> that links
          their legacy code to the harmonized ONOMC code — enriching, not
          replacing, existing data. Future procurement bids can then aggregate
          demand across all CPSEs using the shared national code.
        </p>
      </div>
    </div>
  );
}
