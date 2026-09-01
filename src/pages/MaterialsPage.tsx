import "./PageLayout.css";

export default function MaterialsPage() {
  const sampleMaterials = [
    { id: "1", cpse: "CPCL", code: "MAT-00123", description: "6 inch, Class 300, RF flanged gate valve", uom: "NOS", status: "ingested" },
    { id: "2", cpse: "NTPC", code: "NTPC-VLV-441", description: "Gate Valve 6\" CL300 RF", uom: "EA", status: "mapped" },
    { id: "3", cpse: "SAIL", code: "SAIL-GV-6-300", description: "GATE VALVE 6 INCH 300# FLANGED", uom: "NOS", status: "review" },
    { id: "4", cpse: "CPCL", code: "MAT-00456", description: "SS 316L seamless pipe, 2 inch, SCH 80", uom: "MTR", status: "ingested" },
    { id: "5", cpse: "ONGC", code: "ONGC-PIP-089", description: "Stainless Steel Pipe 2\" Sch80 SS316L", uom: "M", status: "approved" },
    { id: "6", cpse: "NTPC", code: "NTPC-FLG-221", description: "Carbon Steel Blind Flange 4\" CL150", uom: "NOS", status: "ingested" },
  ];

  const statusColor: Record<string, string> = {
    ingested: "#6b7280",
    mapped: "#2563eb",
    review: "#d97706",
    approved: "#16a34a",
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Ingested Materials</h1>
        <p className="page-description">
          Material catalog entries ingested from CPSE ERP systems. Items are automatically analyzed and mapped to national material codes.
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">1,247</div>
          <div className="stat-label">Total Materials</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">892</div>
          <div className="stat-label">Mapped</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">156</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">6</div>
          <div className="stat-label">CPSEs Connected</div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <input
            type="text"
            className="search-input"
            placeholder="Search materials by code, description, or CPSE..."
            readOnly
          />
          <button className="btn btn-primary" disabled>Import Materials</button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>CPSE</th>
              <th>Source Code</th>
              <th>Description</th>
              <th>UoM</th>
              <th>Status</th>
              <th>National Code</th>
            </tr>
          </thead>
          <tbody>
            {sampleMaterials.map((m) => (
              <tr key={m.id}>
                <td><span className="cpse-badge">{m.cpse}</span></td>
                <td className="code-cell">{m.code}</td>
                <td>{m.description}</td>
                <td>{m.uom}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: statusColor[m.status] }}
                  >
                    {m.status}
                  </span>
                </td>
                <td className="code-cell">
                  {m.status === "mapped" || m.status === "approved"
                    ? `ONOMC-${m.code.slice(-5).toUpperCase()}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
