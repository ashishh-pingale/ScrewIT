# -*- coding: utf-8 -*-
"""Generate the ScrewIT Technical Prototype Documentation PDF.

Run:  python tools/gen_tech_pdf.py
Out:  docs/ScrewIT_Technical_Prototype.pdf
"""
import os

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, PageBreak, KeepTogether,
)

# ── Theme (matches the refinery-dusk frontend palette) ──────────────────
NAVY   = HexColor("#0a1424")
NAVY2  = HexColor("#12243d")
ORANGE = HexColor("#ea580c")
AMBER  = HexColor("#f59e0b")
LIGHT  = HexColor("#fff7ed")
BORDER = HexColor("#cbd5e1")
GRAY   = HexColor("#374151")

PAGE_W, PAGE_H = A4

# ── Styles ───────────────────────────────────────────────────────────────
ss = getSampleStyleSheet()

def st(name, **kw):
    base = dict(fontName="Helvetica", fontSize=9.5, leading=14, textColor=GRAY)
    base.update(kw)
    return ParagraphStyle(name, **base)

S = {
    "h1":    st("h1", fontName="Helvetica-Bold", fontSize=17, leading=21,
                textColor=NAVY, spaceBefore=14, spaceAfter=8),
    "h2":    st("h2", fontName="Helvetica-Bold", fontSize=12.5, leading=16,
                textColor=NAVY, spaceBefore=12, spaceAfter=5),
    "body":  st("body", spaceAfter=6),
    "bullet": st("bullet", leftIndent=12, bulletIndent=4, spaceAfter=3),
    "code":  st("code", fontName="Courier", fontSize=8, leading=11.5,
                textColor=NAVY2, backColor=LIGHT, borderPadding=4,
                spaceBefore=3, spaceAfter=8),
    "small": st("small", fontSize=8, leading=11, textColor=GRAY),
    "th":    st("th", fontName="Helvetica-Bold", fontSize=8.5, leading=11,
                textColor=white),
    "td":    st("td", fontSize=8.5, leading=11.5, textColor=GRAY),
    "title": st("title", fontName="Helvetica-Bold", fontSize=26, leading=30,
                textColor=white, alignment=TA_CENTER),
    "subtitle": st("subtitle", fontSize=12, leading=16,
                   textColor=HexColor("#cbd5e1"), alignment=TA_CENTER),
    "covermeta": st("covermeta", fontSize=9.5, leading=15, alignment=TA_CENTER,
                    textColor=white),
}

# ── Page furniture ───────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, PAGE_H - 14 * mm, PAGE_W, 14 * mm, stroke=0, fill=1)
        canvas.setFillColor(white)
        canvas.setFont("Helvetica-Bold", 8.5)
        canvas.drawString(18 * mm, PAGE_H - 9 * mm, "ScrewIT — SIH 26099 Technical Prototype")
        canvas.setFont("Helvetica", 8.5)
        canvas.drawRightString(PAGE_W - 18 * mm, PAGE_H - 9 * mm, f"Page {doc.page}")
        canvas.setStrokeColor(AMBER)
        canvas.setLineWidth(1.4)
        canvas.line(0, PAGE_H - 14 * mm, PAGE_W, PAGE_H - 14 * mm)
        canvas.setFillColor(GRAY)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawString(18 * mm, 10 * mm, "ScrewIT · One Nation One Material Code")
        canvas.drawRightString(PAGE_W - 18 * mm, 10 * mm, "Ministry of Petroleum & Natural Gas")
    canvas.restoreState()

def cover_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
    canvas.setFillColor(NAVY2)
    canvas.rect(0, 0.62 * PAGE_H, PAGE_W, 0.38 * PAGE_H, stroke=0, fill=1)
    canvas.setStrokeColor(ORANGE)
    canvas.setLineWidth(2)
    canvas.line(0, 0.62 * PAGE_H, PAGE_W, 0.62 * PAGE_H)
    canvas.setFillColor(AMBER)
    for i, (x, y, r) in enumerate([(30, 40, 2.2), (55, 25, 1.6), (80, 48, 1.9),
                                   (PAGE_W - 40, 35, 2.0), (PAGE_W - 70, 22, 1.5)]):
        canvas.circle(x, y, r, stroke=0, fill=1)
    canvas.restoreState()

# ── Helpers ──────────────────────────────────────────────────────────────
def T(title):
    return Paragraph(title, S["h1"])

def H(txt):
    return Paragraph(txt, S["h2"])

def P(txt):
    return Paragraph(txt, S["body"])

def B(items):
    return [Paragraph(f"• {i}", S["bullet"]) for i in items]

def CODE(txt):
    pre = (txt.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
    return Paragraph(pre.replace("\n", "<br/>").replace(" ", "&nbsp;"), S["code"])

def table(headers, rows, widths):
    data = [[Paragraph(h, S["th"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(c, S["td"]) for c in r])
    t = Table(data, colWidths=widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY2),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [white, LIGHT]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t

def flow(tbl):
    cw = [w for w in tbl._argW]
    avail = PAGE_W - 36 * mm
    if sum(cw) > avail:
        scale = avail / sum(cw)
        cw = [w * scale for w in cw]
        data = tbl._cellvalues
        t2 = Table(data, colWidths=cw, repeatRows=1)
        t2.setStyle(tbl.getStyle())
        return t2
    return tbl

story = []

# ═════════════════════════════════════════════════════════════════════════
#  COVER
# ═════════════════════════════════════════════════════════════════════════
story.append(Spacer(1, 150 * mm))
story.append(Paragraph("ScrewIT", S["title"]))
story.append(Spacer(1, 4 * mm))
story.append(Paragraph("Technical Prototype Documentation", S["subtitle"]))
story.append(Spacer(1, 2 * mm))
story.append(Paragraph("How the system works, the technology behind it, and how it solves the problem statement", S["subtitle"]))
story.append(Spacer(1, 10 * mm))
meta = Table([
    [Paragraph("Problem Statement", S["covermeta"]), Paragraph("SIH 2026 · Problem 26099 — AI-Driven Standardization & Harmonization of Material Codes across CPSEs", S["covermeta"])],
    [Paragraph("Ministry", S["covermeta"]), Paragraph("Ministry of Petroleum & Natural Gas", S["covermeta"])],
    [Paragraph("Theme", S["covermeta"]), Paragraph("Clean & Green Technology / Smart Automation", S["covermeta"])],
    [Paragraph("Prototype", S["covermeta"]), Paragraph("ONOMC — One Nation, One Material Code", S["covermeta"])],
], colWidths=[45 * mm, 110 * mm])
meta.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#12243d")),
    ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#1e3a5f")),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
]))
story.append(meta)
story.append(PageBreak())

# ═════════════════════════════════════════════════════════════════════════
#  1. PROBLEM + SOLUTION SUMMARY
# ═════════════════════════════════════════════════════════════════════════
story.append(T("1. Problem Statement & Solution Overview"))
story.append(H("1.1 The problem"))
story.append(P(
    "Central Public Sector Enterprises (CPSEs) across Oil &amp; Gas, Power, and Steel each run "
    "independent SAP/ERP instances. The same physical item — e.g. a <b>6 inch, Class 300, RF "
    "flanged gate valve</b> — is created as different material codes, different units of measure, "
    "and inconsistently worded free-text descriptions in every company's catalog. Consequences:"))
story.extend(B([
    "<b>15–30% catalog redundancy</b> — duplicate material masters inflate inventory and procurement records in every CPSE.",
    "<b>Lost bulk-procurement leverage</b> — with no visibility into aggregate demand across companies, CPSEs buy the same item separately at higher unit prices.",
    "<b>Error-prone reconciliation</b> — every cross-CPSE sourcing attempt today is a manual, spreadsheet-driven matching exercise.",
]))
story.append(H("1.2 The solution in one line"))
story.append(P(
    "ScrewIT is an <b>AI material-code harmonization platform</b> that ingests each CPSE's raw material "
    "catalog, detects duplicate items across companies with a similarity-scoring engine, routes them "
    "through a human review workflow, and publishes a single <b>national material code (ONOMC)</b> that "
    "maps bidirectionally back to every source system — <i>without replacing or disrupting any legacy ERP</i>."))

story.append(H("1.3 How the prototype solves the problem (end-to-end flow)"))
story.append(flow(table(
    ["Stage", "What the prototype does", "Where it lives (code)"],
    [
        ["1 · Ingest",
         "CSV/catalog upload is parsed client-side, validated against required columns, previewed, then bulk-inserted into the materials table.",
         "src/pages/DataIngestionPage.tsx (PapaParse) → convex/ingestion.ts (bulkInsert)"],
        ["2 · Match",
         "The AI matching engine normalizes descriptions, scores every cross-CPSE pair, clusters items above threshold, and drafts a national code per cluster.",
         "convex/matching.ts — generateMatchCandidates (action)"],
        ["3 · Review",
         "Pending mappings appear in a review queue with side-by-side comparison and confidence scores. A reviewer approves, edits-and-approves, or rejects each one.",
         "src/pages/ReviewQueuePage.tsx → convex/review.ts"],
        ["4 · Harmonize",
         "Approved clusters become published national codes; analytics computes duplicate clusters, CPSE participation, and estimated procurement savings.",
         "convex/analytics.ts, src/pages/AnalyticsPage.tsx"],
        ["5 · Sync back",
         "Approved mappings are pushed back to each simulated CPSE ERP connector (RFC/BAPI / REST / OData) with progress tracking per company.",
         "convex/integration.ts, src/pages/SystemIntegrationPage.tsx"],
        ["6 · Audit",
         "Every create/approve/reject/edit is written to an append-only audit log with full before/after state — viewable with filters and JSON diff.",
         "convex/analytics.ts (recentActivity), src/pages/AuditTrailPage.tsx"],
    ],
    [22 * mm, 78 * mm, 60 * mm],
)))

story.append(PageBreak())

# ═════════════════════════════════════════════════════════════════════════
#  2. TECH STACK
# ═════════════════════════════════════════════════════════════════════════
story.append(T("2. Technology Stack (as built in this prototype)"))
story.append(flow(table(
    ["Layer", "Technology", "Role in the prototype"],
    [
        ["Frontend", "React 19 + TypeScript (SPA)", "7-page governance dashboard: Overview, Materials, Review Queue, Analytics, Audit Trail, Data Ingestion, System Integration."],
        ["Build tool", "Vite 8", "Dev server with HMR; production bundling (tsc -b && vite build)."],
        ["Routing", "React Router DOM v7", "Client-side navigation between the dashboard pages."],
        ["Backend / DB", "Convex (TypeScript serverless backend)", "Managed database + queries + mutations + actions. Real-time data sync to the UI without hand-written REST endpoints."],
        ["Matching engine", "TypeScript action + string-similarity (Dice coefficient)", "Pairwise text similarity, classification bonuses, technical-attribute conflict penalties, union-find clustering."],
        ["CSV ingestion", "PapaParse", "Browser-side CSV parsing, header validation, row-level error reporting."],
        ["Styling", "Hand-written CSS (custom design system)", "Enterprise navy/amber theme over a fixed refinery-dusk photographic backdrop."],
        ["Code quality", "TypeScript strict mode, Oxlint", "Type-safe end-to-end (shared types from Convex schema) and lint-clean."],
    ],
    [24 * mm, 52 * mm, 84 * mm],
)))
story.append(Spacer(1, 4 * mm))
story.append(P(
    "<b>Note for evaluators:</b> the prototype deliberately consolidates the production architecture "
    "(API gateway, FastAPI ML service, PostgreSQL + pgvector, Kafka, Keycloak — see the technical "
    "proposal) into Convex's single serverless backend. This keeps the demo self-contained and "
    "instantly runnable (<i>npm run dev:all</i>) while preserving every functional capability: "
    "ingestion, matching, review, analytics, sync-back, and auditability."))

story.append(H("2.1 Data model (four core tables)"))
story.append(CODE(
"cpseMaterials        one row per CPSE material, as-is from their ERP\n"
"  cpseId, cpseName, sourceMaterialCode, sourceDescription,\n"
"  uom, classificationCode, technicalAttrs(JSON), ingestedAt\n\n"
"nationalMaterials    the harmonized national master (ONOMC codes)\n"
"  nationalCode, standardDescription, standardUom,\n"
"  standardClassification, status(draft|approved), createdAt\n\n"
"materialMappings     bidirectional link: national code <-> CPSE source\n"
"  nationalCode, cpseId, sourceMaterialCode,\n"
"  matchType(exact|near_duplicate|functional_equivalent),\n"
"  confidenceScore(0-100), reviewStatus(pending|approved|rejected),\n"
"  reviewedBy, reviewedAt, syncedAt\n\n"
"auditLog             append-only, immutable trail\n"
"  entityType, entityId, action, actor,\n"
"  beforeState(JSON), afterState(JSON), timestamp"))

story.append(PageBreak())

# ═════════════════════════════════════════════════════════════════════════
#  3. MATCHING ENGINE — HOW IT TECHNICALLY WORKS
# ═════════════════════════════════════════════════════════════════════════
story.append(T("3. The AI Matching Engine — Technical Walkthrough"))
story.append(P(
    "The engine lives in <b>convex/matching.ts</b> and runs as a Convex <b>action</b> "
    "(generateMatchCandidates). It is a deterministic, explainable pipeline — every score it "
    "produces can be traced back to its inputs, which matters for auditability in a government context."))

story.append(H("3.1 Pipeline"))
story.append(CODE(
"Load materials + existing mappings (queries)\n"
"        |\n"
"        v\n"
"Filter out already-mapped materials\n"
"        |\n"
"        v\n"
"Pairwise scoring of every cross-CPSE pair        threshold >= 0.55\n"
"  score = Dice(normalizedDescA, normalizedDescB)   0 .. 1\n"
"        + 0.08  if classificationCode matches        (category bonus)\n"
"        - 0.15  if technical attrs conflict          (size/pressure/etc.)\n"
"        |\n"
"        v\n"
"Union-Find clustering of scored pairs            transitive merge\n"
"        |\n"
"        v\n"
"For each cluster with >= 2 members:\n"
"  - canonical description  = longest member description\n"
"  - standard UoM           = most frequent member UoM\n"
"  - standard classification= most frequent member class\n"
"  - nationalCode           = 'ONOMC-' + FNV-1a hash of sorted member keys\n"
"  - matchType              = exact(>0.85) | near_duplicate(>=0.70) | functional_equivalent\n"
"  - confidenceScore        = score * 100 (1 decimal)\n"
"        |\n"
"        v\n"
"createCluster mutation:\n"
"  insert nationalMaterials (status = draft) + one materialMappings row\n"
"  per member (reviewStatus = pending) + auditLog entry"))

story.append(H("3.2 Worked example (from the seeded demo data)"))
story.append(flow(table(
    ["CPSE", "Source code", "Description as entered", "Result"],
    [
        ["CPCL", "MAT-00123", "6 inch, Class 300, RF flanged gate valve", "Clustered together → national code ONOMC-XXXXX drafted, 3 pending mappings with high confidence."],
        ["PowerGen Ltd", "PG-VLV-889", "Gate valve, flanged, 6\", class 300#, rising stem", "Same cluster (near_duplicate)."],
        ["SteelCo India", "SC/VALVE/045", "6 inch gate valve CL300 RF A216 WCB", "Same cluster (near_duplicate)."],
    ],
    [26 * mm, 28 * mm, 72 * mm, 42 * mm],
)))
story.append(P(
    "The three descriptions differ in wording, quoting, and abbreviation — a keyword match would "
    "miss them. The Dice coefficient on <i>normalized</i> text (lowercased, punctuation stripped, "
    "whitespace collapsed) scores these pairs high enough to cluster, while the technical-attribute "
    "conflict penalty prevents a 6-inch CL300 valve from ever being merged with a 4-inch CL150 one "
    "even if the wording is similar."))

story.append(H("3.3 Why this design"))
story.extend(B([
    "<b>Explainable:</b> each mapping carries its numeric confidence and match type — reviewers see <i>why</i> items were grouped.",
    "<b>Conservative by default:</b> attribute conflicts (size, pressure class, schedule, grade) actively veto bad merges instead of relying on text alone.",
    "<b>Idempotent:</b> already-mapped materials are skipped, so re-running matching after new imports only processes the delta.",
    "<b>Human-in-the-loop:</b> the engine never publishes anything — it drafts clusters and mappings for review.",
]))

story.append(PageBreak())

# ═════════════════════════════════════════════════════════════════════════
#  4. APPLICATION MODULES
# ═════════════════════════════════════════════════════════════════════════
story.append(T("4. Prototype Modules (what each screen does)"))
story.append(flow(table(
    ["Module / Route", "Technical behavior"],
    [
        ["/ · Overview (Landing)",
         "Live stats from Convex (materials ingested, duplicate clusters, national codes, pending reviews) + workflow explainer. Hero sits over the refinery-dusk backdrop."],
        ["/materials",
         "Full material catalog with free-text search, CPSE filter, mapping-status badges (ingested/mapped/review/approved), and a one-click 'Run AI Matching' action with toast feedback."],
        ["/review-queue",
         "Pending mappings with confidence badges (green ≥85%, amber 70–84%, red <70%), side-by-side material comparison, cluster siblings, inline edit-and-approve of the standard description/UoM, approve/reject mutations."],
        ["/analytics",
         "Category breakdown bar chart of duplicate clusters, interactive procurement-savings calculator ((duplicates − 1) × assumed unit cost, formatted in ₹ Lakh/Crore), and a recent-activity feed from the audit log."],
        ["/audit-trail",
         "Searchable, filterable (action/entity/actor) audit log with expandable rows showing full before/after JSON diffs, sortable by timestamp — the compliance backbone."],
        ["/ingestion",
         "Drag-and-drop CSV upload (PapaParse), column validation with row-level warnings, preview table, bulk insert, then optional one-click AI matching on the fresh rows."],
        ["/integration",
         "Per-CPSE ERP cards (SAP RFC/BAPI, REST, OData simulated) with sync progress, per-record sync state (syncedAt), a 'Sync All' orchestrator, and JSON payload previews of what would be pushed to each ERP."],
    ],
    [40 * mm, 120 * mm],
)))

story.append(H("4.1 Approval state machine"))
story.append(CODE(
"  material uploaded          engine clusters it          reviewer acts\n"
"---------------          ------------------          -------------\n"
"cpseMaterials  --->  mapping: pending  --->  APPROVED --> nationalCode published\n"
"                        |                     |          (available for ERP sync-back)\n"
"                        |                     +--> REJECTED --> mapping discarded\n"
"                        +--> edited standard desc/UoM --> approved (editAndApprove)\n"
"\n"
"Every transition writes an auditLog row (actor, beforeState, afterState, timestamp)."))

story.append(PageBreak())

# ═════════════════════════════════════════════════════════════════════════
#  5. IMPACT + RUNNING
# ═════════════════════════════════════════════════════════════════════════
story.append(T("5. How This Solves the Problem Statement — Impact Mapping"))
story.append(flow(table(
    ["Problem (SIH 26099)", "ScrewIT's answer", "Evidence in prototype"],
    [
        ["15–30% duplicate material masters across CPSE catalogs",
         "AI matching engine detects cross-CPSE duplicates (exact, near-duplicate, functional-equivalent) and consolidates them under one national code.",
         "Materials + Review Queue screens; cluster counts on Overview/Analytics."],
        ["No aggregate-demand visibility → lost bulk-procurement leverage",
         "National code master gives a single view of who holds what; the savings calculator quantifies consolidated procurement gains in ₹.",
         "Analytics → 'Estimated Procurement Savings' with editable unit-cost assumption."],
        ["Manual, error-prone cross-CPSE reconciliation",
         "The engine drafts candidates with confidence scores; experts approve/edit/reject in a guided queue instead of eyeballing spreadsheets.",
         "Review Queue side-by-side comparison with confidence badges."],
        ["Legacy ERP systems cannot be disrupted",
         "Non-invasive by design: CPSE codes stay untouched; national codes are added as cross-reference mappings and synced back via connectors.",
         "System Integration screen with per-ERP sync simulation + payload preview."],
        ["Government-grade accountability",
         "Append-only audit log with before/after JSON for every action; nothing is deleted.",
         "Audit Trail screen with filters and JSON diff viewer."],
    ],
    [42 * mm, 58 * mm, 60 * mm],
)))

story.append(H("5.1 Measurable outcomes the dashboard tracks"))
story.extend(B([
    "Total materials ingested across CPSEs",
    "Duplicate clusters detected and national codes approved",
    "Pending reviews (workflow health)",
    "Estimated procurement savings (₹ Lakh / ₹ Crore) at an assumed unit cost",
    "Sync status per CPSE ERP (approved vs synced vs pending)",
]))

story.append(H("5.2 Running the prototype"))
story.append(CODE(
"# prerequisites: Node.js >= 20.19 (or >= 22.12), npm\n"
"npm install\n"
"npm run dev:all      # Convex backend + Vite frontend together\n"
"npm run seed         # load demo CPSE data with real duplicate clusters\n"
"\n"
"# app:  http://localhost:5173\n"
"# then: Materials -> 'Run AI Matching' -> Review Queue -> approve\n"
"#       Analytics shows clusters + savings; Integration simulates ERP sync"))

story.append(Spacer(1, 6 * mm))
story.append(H("5.3 Production hardening path (prototype → deployment)"))
story.extend(B([
    "<b>Scale-out matching:</b> move the pairwise/cluster stage to a Python (FastAPI) worker with sentence-transformer embeddings + pgvector ANN search; the Convex action becomes the orchestrator.",
    "<b>Real ERP connectivity:</b> replace simulated connectors with SAP RFC/BAPI (BAPI_MATERIAL_SAVEDATA custom field) and Kafka topics (material.created / material.approved) for near-real-time delta sync.",
    "<b>Auth &amp; RBAC:</b> Keycloak (OIDC) integrated with CPSE AD/SSO; role-scoped queues per CPSE; maker-checker on approvals.",
    "<b>Security &amp; residency:</b> data-at-rest encryption, Indian data-centre deployment (Meity-empanelled cloud), DPDP-compliant access logging.",
]))

story.append(Spacer(1, 8 * mm))
sig = Table([[Paragraph(
    "ScrewIT — One Nation, One Material Code · Built for Smart India Hackathon 2026 · Problem Statement 26099",
    st("sig", fontSize=8.5, leading=12, alignment=TA_CENTER, textColor=HexColor("#64748b")),
)]], colWidths=[160 * mm])
sig.setStyle(TableStyle([
    ("LINEABOVE", (0, 0), (-1, 0), 0.75, BORDER),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
]))
story.append(KeepTogether(sig))

# ── Build ────────────────────────────────────────────────────────────────
doc = BaseDocTemplate(
    "docs/ScrewIT_Technical_Prototype.pdf",
    pagesize=A4,
    leftMargin=18 * mm, rightMargin=18 * mm,
    topMargin=20 * mm, bottomMargin=16 * mm,
    title="ScrewIT — Technical Prototype Documentation (SIH 26099)",
    author="Team ScrewIT",
)

frame_cover = Frame(18 * mm, 16 * mm, PAGE_W - 36 * mm, PAGE_H - 36 * mm, id="cover")
frame_body = Frame(18 * mm, 16 * mm, PAGE_W - 36 * mm, PAGE_H - 36 * mm, id="body")

doc.addPageTemplates([
    PageTemplate(id="cover", frames=[frame_cover], onPage=cover_bg),
    PageTemplate(id="body", frames=[frame_body], onPage=on_page),
])

story.insert(1, __import__("reportlab.platypus", fromlist=["NextPageTemplate"]).NextPageTemplate("body"))

os.makedirs("docs", exist_ok=True)
doc.build(story)
print("OK -> docs/ScrewIT_Technical_Prototype.pdf")
