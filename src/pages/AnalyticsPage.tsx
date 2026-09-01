import "./PageLayout.css";

export default function AnalyticsPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analytics Dashboard</h1>
        <p className="page-description">
          Cross-CPSE material harmonization metrics, cost savings estimates, and deduplication progress.
        </p>
      </div>

      <div className="stats-row">
        <div className="stat-card highlight">
          <div className="stat-value">₹12.4 Cr</div>
          <div className="stat-label">Estimated Annual Savings</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-value">23%</div>
          <div className="stat-label">Catalog Redundancy Eliminated</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">1,891</div>
          <div className="stat-label">National Codes Created</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">4,723</div>
          <div className="stat-label">Duplicate Clusters Found</div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Deduplication by Sector</h3>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div className="bar-group">
                <div className="bar" style={{ height: "75%" }}>
                  <span className="bar-label">356</span>
                </div>
                <span className="bar-category">Oil & Gas</span>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: "55%" }}>
                  <span className="bar-label">224</span>
                </div>
                <span className="bar-category">Power</span>
              </div>
              <div className="bar-group">
                <div className="bar" style={{ height: "90%" }}>
                  <span className="bar-label">412</span>
                </div>
                <span className="bar-category">Steel</span>
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Mapping Confidence Distribution</h3>
          <div className="chart-placeholder">
            <div className="bar-chart">
              <div className="bar-group">
                <div className="bar green" style={{ height: "85%" }}>
                  <span className="bar-label">1,102</span>
                </div>
                <span className="bar-category">90–100%</span>
              </div>
              <div className="bar-group">
                <div className="bar blue" style={{ height: "50%" }}>
                  <span className="bar-label">534</span>
                </div>
                <span className="bar-category">70–89%</span>
              </div>
              <div className="bar-group">
                <div className="bar amber" style={{ height: "25%" }}>
                  <span className="bar-label">255</span>
                </div>
                <span className="bar-category">&lt;70%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-card">
        <h3 style={{ padding: "1rem 1.5rem 0", margin: 0 }}>Top CPSEs by Material Volume</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>CPSE</th>
              <th>Sector</th>
              <th>Materials</th>
              <th>Mapped</th>
              <th>Duplicates Found</th>
              <th>Est. Savings</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="cpse-badge">SAIL</span></td>
              <td>Steel</td>
              <td>4,127</td>
              <td>3,891</td>
              <td>1,204</td>
              <td>₹4.8 Cr</td>
            </tr>
            <tr>
              <td><span className="cpse-badge">NTPC</span></td>
              <td>Power</td>
              <td>2,856</td>
              <td>2,512</td>
              <td>834</td>
              <td>₹3.2 Cr</td>
            </tr>
            <tr>
              <td><span className="cpse-badge">CPCL</span></td>
              <td>Oil & Gas</td>
              <td>1,943</td>
              <td>1,756</td>
              <td>612</td>
              <td>₹2.1 Cr</td>
            </tr>
            <tr>
              <td><span className="cpse-badge">ONGC</span></td>
              <td>Oil & Gas</td>
              <td>1,678</td>
              <td>1,498</td>
              <td>523</td>
              <td>₹1.6 Cr</td>
            </tr>
            <tr>
              <td><span className="cpse-badge">IOCL</span></td>
              <td>Oil & Gas</td>
              <td>1,234</td>
              <td>1,102</td>
              <td>389</td>
              <td>₹0.7 Cr</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
