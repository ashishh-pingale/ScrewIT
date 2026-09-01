import "./PageLayout.css";

export default function ReviewQueuePage() {
  const sampleMatches = [
    {
      id: "cl-001",
      similarity: 96.2,
      suggestedCode: "ONOMC-GV6CL300RF",
      materials: [
        { cpse: "CPCL", code: "MAT-00123", desc: "6 inch, Class 300, RF flanged gate valve" },
        { cpse: "NTPC", code: "NTPC-VLV-441", desc: "Gate Valve 6\" CL300 RF" },
        { cpse: "SAIL", code: "SAIL-GV-6-300", desc: "GATE VALVE 6 INCH 300# FLANGED" },
      ],
    },
    {
      id: "cl-002",
      similarity: 91.8,
      suggestedCode: "ONOMC-SSP2S80",
      materials: [
        { cpse: "CPCL", code: "MAT-00456", desc: "SS 316L seamless pipe, 2 inch, SCH 80" },
        { cpse: "ONGC", code: "ONGC-PIP-089", desc: "Stainless Steel Pipe 2\" Sch80 SS316L" },
      ],
    },
    {
      id: "cl-003",
      similarity: 88.5,
      suggestedCode: "ONOMC-BF4CL150",
      materials: [
        { cpse: "NTPC", code: "NTPC-FLG-221", desc: "Carbon Steel Blind Flange 4\" CL150" },
        { cpse: "SAIL", code: "SAIL-BF-4-150", desc: "BLIND FLANGE CS 4 INCH 150#" },
        { cpse: "CPCL", code: "MAT-00789", desc: "Blind Flange, 4 inch, 150#, Carbon Steel" },
      ],
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Review Queue</h1>
        <p className="page-description">
          AI-detected duplicate material clusters awaiting human review. Confirm or reject mappings before they are published to the national code registry.
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">38</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">214</div>
          <div className="stat-label">Approved This Month</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">12</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">94.1%</div>
          <div className="stat-label">Avg. Confidence</div>
        </div>
      </div>

      <div className="match-list">
        {sampleMatches.map((match) => (
          <div key={match.id} className="match-card">
            <div className="match-header">
              <div className="match-info">
                <h3>Cluster {match.id.replace("cl-", "#")}</h3>
                <span className="similarity-badge">
                  {match.similarity}% match
                </span>
                <span className="suggested-code">
                  Suggested: <strong>{match.suggestedCode}</strong>
                </span>
              </div>
              <div className="match-actions">
                <button className="btn btn-approve" disabled>✓ Approve</button>
                <button className="btn btn-reject" disabled>✗ Reject</button>
              </div>
            </div>
            <div className="match-materials">
              {match.materials.map((mat, i) => (
                <div key={i} className="match-material-row">
                  <span className="cpse-badge">{mat.cpse}</span>
                  <span className="code-cell">{mat.code}</span>
                  <span>{mat.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
