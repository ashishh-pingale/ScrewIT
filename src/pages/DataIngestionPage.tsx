import { useState, useRef, useCallback } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import Papa from "papaparse";
import "./PageLayout.css";
import "./DataIngestionPage.css";

// ── Expected CSV columns ───────────────────────────────────────────────
const EXPECTED_COLS = [
  "cpseId",
  "cpseName",
  "sourceMaterialCode",
  "sourceDescription",
  "uom",
  "classificationCode",
] as const;

type CsvRow = {
  cpseId: string;
  cpseName: string;
  sourceMaterialCode: string;
  sourceDescription: string;
  uom: string;
  classificationCode: string;
};

type ParseResult = {
  rows: CsvRow[];
  errors: string[];
  meta: { delimiter: string; fields: string[] };
};

// ── Parse CSV client-side ──────────────────────────────────────────────
function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      complete(results) {
        const errors: string[] = [];
        const fields = results.meta.fields ?? [];

        // Check required columns exist
        const missing = EXPECTED_COLS.filter(
          (c) => !fields.some((f) => f.toLowerCase() === c.toLowerCase())
        );
        if (missing.length > 0) {
          errors.push(`Missing required columns: ${missing.join(", ")}`);
        }

        // Map and validate rows
        const rows: CsvRow[] = [];
        for (let i = 0; i < results.data.length; i++) {
          const raw = results.data[i] as Record<string, string>;
          const row: CsvRow = {
            cpseId: (raw.cpseId ?? "").trim(),
            cpseName: (raw.cpseName ?? "").trim(),
            sourceMaterialCode: (raw.sourceMaterialCode ?? "").trim(),
            sourceDescription: (raw.sourceDescription ?? "").trim(),
            uom: (raw.uom ?? "").trim(),
            classificationCode: (raw.classificationCode ?? "").trim(),
          };

          // Validate required fields
          const missingFields: string[] = [];
          if (!row.cpseId) missingFields.push("cpseId");
          if (!row.sourceMaterialCode) missingFields.push("sourceMaterialCode");
          if (!row.sourceDescription) missingFields.push("sourceDescription");

          if (missingFields.length > 0) {
            errors.push(
              `Row ${i + 2}: missing ${missingFields.join(", ")}`
            );
          } else {
            rows.push(row);
          }
        }

        resolve({
          rows,
          errors,
          meta: {
            delimiter: results.meta.delimiter ?? ",",
            fields,
          },
        });
      },
      error(err) {
        resolve({ rows: [], errors: [err.message], meta: { delimiter: ",", fields: [] } });
      },
    });
  });
}

// ── Component ──────────────────────────────────────────────────────────
export default function DataIngestionPage() {
  const bulkInsert = useMutation(api.ingestion.bulkInsert);
  const runMatching = useAction(api.matching.generateMatchCandidates);

  const fileRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const [matching, setMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    clustersFound: number;
    mappingsCreated: number;
  } | null>(null);

  // ── Handle file selection ──────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name);
    setImportResult(null);
    setMatchResult(null);
    const result = await parseCsv(file);
    setParseResult(result);
  }, []);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // ── Handle import ──────────────────────────────────────────────────
  async function handleImport() {
    if (!parseResult || parseResult.rows.length === 0) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await bulkInsert({ rows: parseResult.rows });
      setImportResult(result);
    } finally {
      setImporting(false);
    }
  }

  // ── Handle post-import matching ────────────────────────────────────
  async function handleRunMatching() {
    setMatching(true);
    setMatchResult(null);
    try {
      const result = await runMatching({});
      setMatchResult(result);
    } finally {
      setMatching(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────
  function handleReset() {
    setFileName(null);
    setParseResult(null);
    setImportResult(null);
    setMatchResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Data Ingestion</h1>
        <p className="page-description">
          Import new material catalog entries from CPSE ERP systems via CSV
          upload. Supported columns: cpseId, cpseName, sourceMaterialCode,
          sourceDescription, uom, classificationCode.
        </p>
      </div>

      {/* ── Step 1: Upload ──────────────────────────────────────── */}
      {!parseResult && (
        <div
          className={`upload-zone ${dragOver ? "upload-zone--drag" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="upload-input"
            onChange={onFileChange}
          />
          <div className="upload-icon">📄</div>
          <div className="upload-title">
            {dragOver ? "Drop CSV file here" : "Drag & drop a CSV file or click to browse"}
          </div>
          <div className="upload-hint">
            Accepts .csv files with headers: cpseId, cpseName, sourceMaterialCode,
            sourceDescription, uom, classificationCode
          </div>
        </div>
      )}

      {/* ── Parse errors ────────────────────────────────────────── */}
      {parseResult && parseResult.errors.length > 0 && (
        <div className="ingestion-errors">
          <h4>⚠️ Parsing warnings</h4>
          <ul>
            {parseResult.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Step 2: Preview ─────────────────────────────────────── */}
      {parseResult && parseResult.rows.length > 0 && !importResult && (
        <>
          <div className="preview-header">
            <div className="preview-info">
              <h2>
                Preview: {parseResult.rows.length} rows from{" "}
                <code>{fileName}</code>
              </h2>
              <span className="preview-meta">
                Delimiter: <code>"{parseResult.meta.delimiter}"</code> ·{" "}
                Columns detected: {parseResult.meta.fields.length}
              </span>
            </div>
            <div className="preview-actions">
              <button className="btn btn-ghost" onClick={handleReset}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={importing}
                onClick={handleImport}
              >
                {importing ? "Importing…" : `✓ Import ${parseResult.rows.length} Materials`}
              </button>
            </div>
          </div>

          <div className="table-card">
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>CPSE</th>
                    <th>CPSE Name</th>
                    <th>Source Code</th>
                    <th>Description</th>
                    <th>UoM</th>
                    <th>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.map((row, i) => (
                    <tr key={i}>
                      <td className="row-num">{i + 1}</td>
                      <td>
                        <span className="cpse-badge">{row.cpseId}</span>
                      </td>
                      <td>{row.cpseName || "—"}</td>
                      <td className="code-cell">{row.sourceMaterialCode}</td>
                      <td>{row.sourceDescription}</td>
                      <td>{row.uom || "NOS"}</td>
                      <td className="code-cell">
                        {row.classificationCode || "UNCAT"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── Step 3: Import result ───────────────────────────────── */}
      {importResult && (
        <div className="import-result">
          <div className="import-result-header">
            <div className="import-result-icon">
              {importResult.inserted > 0 ? "✅" : "⚠️"}
            </div>
            <div>
              <h2>Import Complete</h2>
              <p className="import-result-summary">
                <strong>{importResult.inserted}</strong> materials imported
                successfully
                {importResult.skipped > 0 && (
                  <>
                    {" "}
                    · <strong>{importResult.skipped}</strong> skipped
                  </>
                )}
                {importResult.errors.length > 0 && (
                  <>
                    {" "}
                    · {importResult.errors.length} warning
                    {importResult.errors.length > 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="ingestion-errors">
              <h4>Skipped rows</h4>
              <ul>
                {importResult.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Post-import matching prompt ──────────────────────── */}
          {!matchResult && importResult.inserted > 0 && (
            <div className="match-prompt">
              <div className="match-prompt-content">
                <h3>Run AI Matching on new records?</h3>
                <p>
                  Scan the {importResult.inserted} newly imported materials
                  against existing catalog entries to find duplicate candidates.
                </p>
              </div>
              <div className="match-prompt-actions">
                <button
                  className="btn btn-ai"
                  disabled={matching}
                  onClick={handleRunMatching}
                >
                  {matching ? (
                    <>
                      <span className="sync-spinner" /> Running…
                    </>
                  ) : (
                    "⚡ Run AI Matching"
                  )}
                </button>
                <button className="btn btn-ghost" onClick={handleReset}>
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* ── Match result ─────────────────────────────────────── */}
          {matchResult && (
            <div className="match-result">
              <div className="match-result-icon">🎉</div>
              <h3>Matching Complete</h3>
              <p>
                Found <strong>{matchResult.clustersFound}</strong> duplicate
                cluster{matchResult.clustersFound !== 1 ? "s" : ""} and
                created <strong>{matchResult.mappingsCreated}</strong> new
                pending mapping{matchResult.mappingsCreated !== 1 ? "s" : ""}.
              </p>
              <div className="match-result-actions">
                <a href="/review-queue" className="btn btn-primary">
                  Go to Review Queue →
                </a>
                <button className="btn btn-ghost" onClick={handleReset}>
                  Import another CSV
                </button>
              </div>
            </div>
          )}

          {!matchResult && importResult.inserted > 0 && (
            <div className="import-done-actions">
              <a href="/materials" className="btn btn-primary">
                View Materials →
              </a>
              <button className="btn btn-ghost" onClick={handleReset}>
                Import another CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state after import with no insertions ─────────── */}
      {importResult && importResult.inserted === 0 && (
        <div className="import-done-actions">
          <button className="btn btn-primary" onClick={handleReset}>
            Try another file
          </button>
        </div>
      )}
    </div>
  );
}
