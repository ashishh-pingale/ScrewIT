import { mutation } from "./_generated/server";

/**
 * Seed the database with realistic CPSE material data, national codes,
 * and mappings. Includes intentional near-duplicate clusters across
 * CPCL / PowerGen Ltd / SteelCo India so the matching engine has
 * real duplicates to find.
 *
 * Safe to re-run — wipes existing data first.
 */
export const seedAll = mutation({
  args: {},
  handler: async (ctx) => {
    // ── wipe existing data ────────────────────────────────────────────
    for (const tbl of [
      "auditLog",
      "materialMappings",
      "nationalMaterials",
      "cpseMaterials",
    ] as const) {
      const rows = await ctx.db.query(tbl).collect();
      for (const r of rows) await ctx.db.delete(r._id);
    }

    const now = Date.now();
    const day = 86_400_000;

    // ──────────────────────────────────────────────────────────────────
    //  1.  CPSE MATERIALS  (41 rows)
    // ──────────────────────────────────────────────────────────────────
    const cpseRows = [
      // ── CPCL (14 rows) ──────────────────────────────────────────────
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00123", uom: "NOS", classificationCode: "VLV-GATE",
        sourceDescription: "6 inch, Class 300, RF flanged gate valve",
        technicalAttrs: { size: "6 inch", pressureClass: "CL300", endConnection: "RF Flanged", bodyMaterial: "A216 WCB", trim: "13Cr" },
        ingestedAt: now - 12 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00456", uom: "MTR", classificationCode: "PIPE-SS",
        sourceDescription: "SS 316L seamless pipe, 2 inch, SCH 80",
        technicalAttrs: { size: "2 inch", schedule: "SCH 80", material: "SS 316L", type: "Seamless" },
        ingestedAt: now - 11 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00234", uom: "NOS", classificationCode: "FST-BOLT",
        sourceDescription: "Hex Head Bolt M20 x 70mm, Grade 8.8, Hot Dip Galvanized",
        technicalAttrs: { size: "M20 x 70mm", grade: "8.8", finish: "HDG", standard: "ISO 4014" },
        ingestedAt: now - 10 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00567", uom: "NOS", classificationCode: "VLV-BALL",
        sourceDescription: "Ball Valve 2 inch, Full Bore, SS 316, Flanged",
        technicalAttrs: { size: "2 inch", bore: "Full", bodyMaterial: "SS 316", endConnection: "Flanged", handle: "Lever" },
        ingestedAt: now - 9 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00789", uom: "NOS", classificationCode: "FLG-BLIND",
        sourceDescription: "Blind Flange, 4 inch, 150#, Carbon Steel",
        technicalAttrs: { size: "4 inch", pressureClass: "CL150", material: "A105", facing: "RF" },
        ingestedAt: now - 8 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00712", uom: "NOS", classificationCode: "FIT-ELBOW",
        sourceDescription: "CS Elbow 90deg, 4 inch, SCH 40, Buttweld",
        technicalAttrs: { size: "4 inch", angle: "90°", schedule: "SCH 40", material: "A234 WPB", end: "Buttweld" },
        ingestedAt: now - 7 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00445", uom: "NOS", classificationCode: "FLG-WN",
        sourceDescription: "Carbon Steel Flange WN 6 inch, Class 300, RF",
        technicalAttrs: { size: "6 inch", pressureClass: "CL300", type: "Weld Neck", material: "A105", facing: "RF" },
        ingestedAt: now - 7 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00556", uom: "NOS", classificationCode: "INS-GAUGE",
        sourceDescription: "Pressure Gauge 0-100 PSI, SS Case, 1/4\" NPT",
        technicalAttrs: { range: "0-100 PSI", caseMaterial: "SS 304", connection: "1/4\" NPT", accuracy: "±1% FS" },
        ingestedAt: now - 6 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00901", uom: "NOS", classificationCode: "FST-STUD",
        sourceDescription: "Stud Bolt M16 x 110mm, ASTM A193 Grade L7",
        technicalAttrs: { size: "M16 x 110mm", grade: "A193 L7", standard: "ASTM A193", finish: "Plain" },
        ingestedAt: now - 5 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00345", uom: "NOS", classificationCode: "VLV-GATE",
        sourceDescription: "Gate Valve 10 inch, Class 150, RF Flanged",
        technicalAttrs: { size: "10 inch", pressureClass: "CL150", endConnection: "RF Flanged", bodyMaterial: "A216 WCB" },
        ingestedAt: now - 4 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00678", uom: "MTR", classificationCode: "PIPE-CS",
        sourceDescription: "CS Pipe 6 inch, SCH 20, Seamless",
        technicalAttrs: { size: "6 inch", schedule: "SCH 20", material: "A106 Gr B", type: "Seamless" },
        ingestedAt: now - 4 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00112", uom: "MTR", classificationCode: "ELEC-CONDUIT",
        sourceDescription: "GI Conduit 25mm, Heavy Duty, Hot Dip Galvanized",
        technicalAttrs: { size: "25mm", type: "Heavy Duty", finish: "HDG", standard: "IS 9537 Part 1" },
        ingestedAt: now - 3 * day,
      },
      {
        cpseId: "CPCL", cpseName: "Chennai Petroleum Corporation Ltd",
        sourceMaterialCode: "MAT-00223", uom: "NOS", classificationCode: "VLV-GLOBE",
        sourceDescription: "Globe Valve 3 inch, Class 150, SS 14",
        technicalAttrs: { size: "3 inch", pressureClass: "CL150", bodyMaterial: "CF8M", trim: "SS 316" },
        ingestedAt: now - 2 * day,
      },

      // ── PowerGen Ltd (13 rows) ──────────────────────────────────────
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-VLV-441", uom: "EA", classificationCode: "VLV-GATE",
        sourceDescription: "Gate Valve 6\" CL300 RF Type",
        technicalAttrs: { size: "6\"", pressureClass: "CL300", endConnection: "RF", bodyMaterial: "WCB", trim: "13Cr" },
        ingestedAt: now - 12 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-PIP-089", uom: "M", classificationCode: "PIPE-SS",
        sourceDescription: "Stainless Steel Pipe 2\" Sch80 SS316L Seamless",
        technicalAttrs: { size: "2\"", schedule: "SCH80", material: "SS 316L", type: "Seamless" },
        ingestedAt: now - 11 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-FTB-112", uom: "NOS", classificationCode: "FST-BOLT",
        sourceDescription: "HDXG BOLT M20X70 GR8.8",
        technicalAttrs: { size: "M20X70", grade: "8.8", finish: "HDG", standard: "ISO 4014" },
        ingestedAt: now - 10 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-VLV-332", uom: "NOS", classificationCode: "VLV-BALL",
        sourceDescription: "FULL BORE BALL VALVE 2\" SS316 FLGD",
        technicalAttrs: { size: "2\"", bore: "Full", bodyMaterial: "SS316", endConnection: "Flanged" },
        ingestedAt: now - 9 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-CBL-201", uom: "MTR", classificationCode: "CBL-HT",
        sourceDescription: "XLPE Armoured Cable 3 Core x 185 sqmm",
        technicalAttrs: { cores: 3, crossSection: "185 sqmm", insulation: "XLPE", armour: "Steel Wire" },
        ingestedAt: now - 8 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-CBL-105", uom: "MTR", classificationCode: "CBL-CTRL",
        sourceDescription: "Control Cable 4 Core x 2.5 sqmm PVC",
        technicalAttrs: { cores: 4, crossSection: "2.5 sqmm", insulation: "PVC", armour: "None" },
        ingestedAt: now - 7 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-VLV-555", uom: "NOS", classificationCode: "VLV-CHECK",
        sourceDescription: "Check Valve 4 inch, Class 600, Swing Type",
        technicalAttrs: { size: "4 inch", pressureClass: "CL600", type: "Swing", bodyMaterial: "A216 WCB" },
        ingestedAt: now - 6 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-PIP-220", uom: "MTR", classificationCode: "PIPE-CS",
        sourceDescription: "Carbon Steel Pipe 8 inch, SCH 40, Seamless",
        technicalAttrs: { size: "8 inch", schedule: "SCH 40", material: "A106 Gr B", type: "Seamless" },
        ingestedAt: now - 5 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-FTB-333", uom: "NOS", classificationCode: "FST-NUT",
        sourceDescription: "SS Hex Nut M12, A4-80, ISO 4032",
        technicalAttrs: { size: "M12", grade: "A4-80", material: "SS 316", standard: "ISO 4032" },
        ingestedAt: now - 4 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-TRF-440", uom: "NOS", classificationCode: "ELEC-TRF",
        sourceDescription: "3-Phase Transformer 500 kVA, 11kV/415V, Dyn11",
        technicalAttrs: { type: "3-Phase", rating: "500 kVA", primaryVoltage: "11 kV", secondaryVoltage: "415 V", vectorGroup: "Dyn11" },
        ingestedAt: now - 3 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-MTR-789", uom: "NOS", classificationCode: "ELEC-MTR",
        sourceDescription: "Induction Motor 55 kW, 3-Phase, 1480 RPM, TEFC",
        technicalAttrs: { rating: "55 kW", phases: 3, speed: "1480 RPM", enclosure: "TEFC", frame: "280S" },
        ingestedAt: now - 2 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-INS-401", uom: "NOS", classificationCode: "INS-RTD",
        sourceDescription: "RTD Sensor PT100, Class A, SS Sheath, 6x100mm",
        technicalAttrs: { element: "PT100", accuracyClass: "A", sheathMaterial: "SS 316", dimensions: "6x100mm" },
        ingestedAt: now - 2 * day,
      },
      {
        cpseId: "PowerGen Ltd", cpseName: "PowerGen Ltd",
        sourceMaterialCode: "PG-CBL-300", uom: "MTR", classificationCode: "CBL-HT",
        sourceDescription: "Power Cable 3 Core x 300 sqmm XLPE Armoured",
        technicalAttrs: { cores: 3, crossSection: "300 sqmm", insulation: "XLPE", armour: "Steel Wire" },
        ingestedAt: now - 1 * day,
      },

      // ── SteelCo India (14 rows) ─────────────────────────────────────
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-GV-6-300", uom: "NOS", classificationCode: "VLV-GATE",
        sourceDescription: "GATE VALVE 6IN300# FLANGED END",
        technicalAttrs: { size: "6IN", pressureClass: "300#", endConnection: "Flanged", bodyMaterial: "WCB" },
        ingestedAt: now - 12 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-CBL-185", uom: "MTR", classificationCode: "CBL-HT",
        sourceDescription: "3C X 185 SQ MM XLPE ABRD CABLE",
        technicalAttrs: { cores: 3, crossSection: "185 sqmm", insulation: "XLPE", armour: "Steel Wire" },
        ingestedAt: now - 8 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-HB-20-70", uom: "NOS", classificationCode: "FST-BOLT",
        sourceDescription: "HEX BOLT 20MM X 70MM 8.8 HDG",
        technicalAttrs: { size: "20MM X 70MM", grade: "8.8", finish: "HDG" },
        ingestedAt: now - 10 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-BF-4-150", uom: "NOS", classificationCode: "FLG-BLIND",
        sourceDescription: "BLIND FLANGE CS 4 INCH 150#",
        technicalAttrs: { size: "4 INCH", pressureClass: "150#", material: "CS A105", facing: "RF" },
        ingestedAt: now - 8 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-CC-4X25", uom: "MTR", classificationCode: "CBL-CTRL",
        sourceDescription: "4C X 2.5 SQ MM PVC CTRL CABLE",
        technicalAttrs: { cores: 4, crossSection: "2.5 sqmm", insulation: "PVC", armour: "None" },
        ingestedAt: now - 7 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-ELB-4-90", uom: "NOS", classificationCode: "FIT-ELBOW",
        sourceDescription: "CARBON STEEL 90 DEGREE ELBOW 4\" BW SCH40",
        technicalAttrs: { size: "4\"", angle: "90°", schedule: "SCH40", material: "CS WPB", end: "BW" },
        ingestedAt: now - 7 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-PG-0-100", uom: "NOS", classificationCode: "INS-GAUGE",
        sourceDescription: "PRESSURE GAUGE 0-100PSI SS 1/4NPT",
        technicalAttrs: { range: "0-100PSI", caseMaterial: "SS", connection: "1/4NPT" },
        ingestedAt: now - 6 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-FLG-6-300", uom: "NOS", classificationCode: "FLG-WN",
        sourceDescription: "WN FLANGE CS 6IN CL300 RF",
        technicalAttrs: { size: "6IN", pressureClass: "CL300", type: "Weld Neck", material: "CS A105", facing: "RF" },
        ingestedAt: now - 7 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-SB-16-110", uom: "NOS", classificationCode: "FST-STUD",
        sourceDescription: "STUD BOLT M16X110 GR L7 ASTM A193",
        technicalAttrs: { size: "M16X110", grade: "L7", standard: "ASTM A193" },
        ingestedAt: now - 5 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-PIP-6-20", uom: "MTR", classificationCode: "PIPE-CS",
        sourceDescription: "CS SEAMLESS PIPE 6IN SCH20",
        technicalAttrs: { size: "6IN", schedule: "SCH20", material: "CS A106", type: "Seamless" },
        ingestedAt: now - 4 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-GV-10-150", uom: "NOS", classificationCode: "VLV-GATE",
        sourceDescription: "GATE VALVE 10IN 150# RF FLANGED",
        technicalAttrs: { size: "10IN", pressureClass: "150#", endConnection: "RF Flanged", bodyMaterial: "WCB" },
        ingestedAt: now - 4 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-CBL-3X50", uom: "MTR", classificationCode: "CBL-HT",
        sourceDescription: "3C X 50 SQ MM XLPE POWER CABLE",
        technicalAttrs: { cores: 3, crossSection: "50 sqmm", insulation: "XLPE", armour: "Steel Wire" },
        ingestedAt: now - 3 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-FG-3-150", uom: "NOS", classificationCode: "GSK-SPRW",
        sourceDescription: "Spiral Wound Gasket 3 inch, CL150, CS + Graphite",
        technicalAttrs: { size: "3 inch", pressureClass: "CL150", material: "CS + Graphite", type: "Spiral Wound" },
        ingestedAt: now - 2 * day,
      },
      {
        cpseId: "SteelCo India", cpseName: "SteelCo India Ltd",
        sourceMaterialCode: "SC-BL-8-150", uom: "NOS", classificationCode: "VLV-BALL",
        sourceDescription: "BALL VALVE 8IN 150# FB CS",
        technicalAttrs: { size: "8IN", pressureClass: "150#", bore: "Full", bodyMaterial: "CS" },
        ingestedAt: now - 1 * day,
      },
    ];

    // Insert all CPSE materials and collect their IDs + lookup keys
    const cpseIds: Record<string, string> = {};
    for (const row of cpseRows) {
      const id = await ctx.db.insert("cpseMaterials", row);
      cpseIds[`${row.cpseId}|${row.sourceMaterialCode}`] = id;
    }

    // ──────────────────────────────────────────────────────────────────
    //  2.  NATIONAL MATERIALS  (12 codes for duplicate clusters + 5 unique)
    // ──────────────────────────────────────────────────────────────────
    const nationalRows = [
      // Duplicate cluster codes
      { nationalCode: "ONOMC-GV6CL300RF",  standardDescription: "Gate Valve, 6 inch, Class 300, RF Flanged, Carbon Steel Body (A216 WCB), 13Cr Trim", standardUom: "NOS", standardClassification: "VLV-GATE",  status: "approved" as const },
      { nationalCode: "ONOMC-SSP2S80",      standardDescription: "Seamless Pipe, 2 inch, SCH 80, Stainless Steel 316L", standardUom: "MTR", standardClassification: "PIPE-SS",  status: "approved" as const },
      { nationalCode: "ONOMC-HB20X70G88",  standardDescription: "Hex Head Bolt, M20 x 70mm, Grade 8.8, ISO 4014, Hot Dip Galvanized", standardUom: "NOS", standardClassification: "FST-BOLT",  status: "approved" as const },
      { nationalCode: "ONOMC-FB2SS316FL",  standardDescription: "Full Bore Ball Valve, 2 inch, SS 316 Body, Flanged End", standardUom: "NOS", standardClassification: "VLV-BALL",  status: "approved" as const },
      { nationalCode: "ONOMC-BF4CL150CS",  standardDescription: "Blind Flange, 4 inch, Class 150, Carbon Steel (A105), RF Facing", standardUom: "NOS", standardClassification: "FLG-BLIND", status: "approved" as const },
      { nationalCode: "ONOMC-ELB90-4S40",  standardDescription: "90° Elbow, 4 inch, SCH 40, Carbon Steel (A234 WPB), Buttweld", standardUom: "NOS", standardClassification: "FIT-ELBOW", status: "approved" as const },
      { nationalCode: "ONOMC-XLPE3C185",   standardDescription: "XLPE Insulated, Steel Wire Armoured Power Cable, 3 Core x 185 sqmm", standardUom: "MTR", standardClassification: "CBL-HT",   status: "approved" as const },
      { nationalCode: "ONOMC-CC4C25PVC",   standardDescription: "PVC Insulated Control Cable, 4 Core x 2.5 sqmm, Unarmoured", standardUom: "MTR", standardClassification: "CBL-CTRL", status: "approved" as const },
      { nationalCode: "ONOMC-PG0100SS",    standardDescription: "Pressure Gauge, 0–100 PSI, SS 304 Case, 1/4\" NPT Bottom Entry, ±1% FS", standardUom: "NOS", standardClassification: "INS-GAUGE", status: "approved" as const },
      { nationalCode: "ONOMC-WNF6CL300",   standardDescription: "Weld Neck Flange, 6 inch, Class 300, Carbon Steel (A105), RF Facing", standardUom: "NOS", standardClassification: "FLG-WN",   status: "approved" as const },
      { nationalCode: "ONOMC-SB16X110L7",  standardDescription: "Stud Bolt, M16 x 110mm, ASTM A193 Grade L7", standardUom: "NOS", standardClassification: "FST-STUD",  status: "approved" as const },
      { nationalCode: "ONOMC-CSP6S20",     standardDescription: "Seamless Pipe, 6 inch, SCH 20, Carbon Steel (A106 Gr B)", standardUom: "MTR", standardClassification: "PIPE-CS",  status: "approved" as const },

      // Unique national codes (mapped to single CPSE items)
      { nationalCode: "ONOMC-GV10CL150RF", standardDescription: "Gate Valve, 10 inch, Class 150, RF Flanged, Carbon Steel", standardUom: "NOS", standardClassification: "VLV-GATE",  status: "draft" as const },
      { nationalCode: "ONOMC-CV4CL600SW",  standardDescription: "Swing Check Valve, 4 inch, Class 600, Carbon Steel", standardUom: "NOS", standardClassification: "VLV-CHECK", status: "draft" as const },
      { nationalCode: "ONOMC-CSP8S40",     standardDescription: "Seamless Pipe, 8 inch, SCH 40, Carbon Steel (A106 Gr B)", standardUom: "MTR", standardClassification: "PIPE-CS",  status: "draft" as const },
      { nationalCode: "ONOMC-XLPE3C50",    standardDescription: "XLPE Insulated, Steel Wire Armoured Power Cable, 3 Core x 50 sqmm", standardUom: "MTR", standardClassification: "CBL-HT",   status: "draft" as const },
      { nationalCode: "ONOMC-SWGF3CL150",  standardDescription: "Spiral Wound Gasket, 3 inch, CL150, CS Windings + Graphite Filler", standardUom: "NOS", standardClassification: "GSK-SPRW", status: "draft" as const },
    ];

    for (const row of nationalRows) {
      await ctx.db.insert("nationalMaterials", {
        ...row,
        createdAt: now - 10 * day,
      });
    }

    // ──────────────────────────────────────────────────────────────────
    //  3.  MATERIAL MAPPINGS  (one per CPSE material → national code)
    // ──────────────────────────────────────────────────────────────────
    type MappingRow = {
      nationalCode: string;
      cpseId: string;
      sourceMaterialCode: string;
      matchType: "exact" | "near_duplicate" | "functional_equivalent";
      confidenceScore: number;
      reviewStatus: "pending" | "approved" | "rejected";
    };

    const mappings: MappingRow[] = [
      // ── Gate Valve 6" CL300 RF  (3-way near-duplicate) ──
      { nationalCode: "ONOMC-GV6CL300RF", cpseId: "CPCL",         sourceMaterialCode: "MAT-00123",  matchType: "near_duplicate",       confidenceScore: 96.2, reviewStatus: "pending" },
      { nationalCode: "ONOMC-GV6CL300RF", cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-VLV-441", matchType: "near_duplicate",       confidenceScore: 94.8, reviewStatus: "pending" },
      { nationalCode: "ONOMC-GV6CL300RF", cpseId: "SteelCo India",sourceMaterialCode: "SC-GV-6-300",matchType: "near_duplicate",       confidenceScore: 91.5, reviewStatus: "approved" },

      // ── SS Pipe 2" SCH80 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-SSP2S80",     cpseId: "CPCL",         sourceMaterialCode: "MAT-00456",  matchType: "near_duplicate",       confidenceScore: 97.1, reviewStatus: "approved" },
      { nationalCode: "ONOMC-SSP2S80",     cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-PIP-089", matchType: "near_duplicate",       confidenceScore: 95.3, reviewStatus: "pending" },

      // ── Hex Bolt M20x70 8.8 (3-way near-duplicate) ──
      { nationalCode: "ONOMC-HB20X70G88", cpseId: "CPCL",         sourceMaterialCode: "MAT-00234",  matchType: "near_duplicate",       confidenceScore: 98.5, reviewStatus: "approved" },
      { nationalCode: "ONOMC-HB20X70G88", cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-FTB-112", matchType: "near_duplicate",       confidenceScore: 96.0, reviewStatus: "pending" },
      { nationalCode: "ONOMC-HB20X70G88", cpseId: "SteelCo India",sourceMaterialCode: "SC-HB-20-70",matchType: "exact",               confidenceScore: 99.0, reviewStatus: "approved" },

      // ── Ball Valve 2" SS316 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-FB2SS316FL", cpseId: "CPCL",         sourceMaterialCode: "MAT-00567",  matchType: "near_duplicate",       confidenceScore: 95.7, reviewStatus: "pending" },
      { nationalCode: "ONOMC-FB2SS316FL", cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-VLV-332", matchType: "exact",               confidenceScore: 99.2, reviewStatus: "approved" },

      // ── Blind Flange 4" CL150 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-BF4CL150CS", cpseId: "CPCL",         sourceMaterialCode: "MAT-00789",  matchType: "near_duplicate",       confidenceScore: 97.8, reviewStatus: "pending" },
      { nationalCode: "ONOMC-BF4CL150CS", cpseId: "SteelCo India",sourceMaterialCode: "SC-BF-4-150",matchType: "exact",               confidenceScore: 99.1, reviewStatus: "approved" },

      // ── 90° Elbow 4" SCH40 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-ELB90-4S40", cpseId: "CPCL",         sourceMaterialCode: "MAT-00712",  matchType: "near_duplicate",       confidenceScore: 96.4, reviewStatus: "pending" },
      { nationalCode: "ONOMC-ELB90-4S40", cpseId: "SteelCo India",sourceMaterialCode: "SC-ELB-4-90",matchType: "near_duplicate",       confidenceScore: 95.1, reviewStatus: "pending" },

      // ── XLPE Cable 3C×185 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-XLPE3C185",  cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-CBL-201", matchType: "near_duplicate",       confidenceScore: 94.6, reviewStatus: "approved" },
      { nationalCode: "ONOMC-XLPE3C185",  cpseId: "SteelCo India",sourceMaterialCode: "SC-CBL-185", matchType: "near_duplicate",       confidenceScore: 92.3, reviewStatus: "pending" },

      // ── Control Cable 4C×2.5 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-CC4C25PVC",  cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-CBL-105", matchType: "near_duplicate",       confidenceScore: 93.8, reviewStatus: "pending" },
      { nationalCode: "ONOMC-CC4C25PVC",  cpseId: "SteelCo India",sourceMaterialCode: "SC-CC-4X25", matchType: "near_duplicate",       confidenceScore: 91.2, reviewStatus: "pending" },

      // ── Pressure Gauge 0-100 PSI SS (2-way near-duplicate) ──
      { nationalCode: "ONOMC-PG0100SS",   cpseId: "CPCL",         sourceMaterialCode: "MAT-00556",  matchType: "near_duplicate",       confidenceScore: 97.3, reviewStatus: "pending" },
      { nationalCode: "ONOMC-PG0100SS",   cpseId: "SteelCo India",sourceMaterialCode: "SC-PG-0-100",matchType: "near_duplicate",       confidenceScore: 95.9, reviewStatus: "approved" },

      // ── WN Flange 6" CL300 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-WNF6CL300",  cpseId: "CPCL",         sourceMaterialCode: "MAT-00445",  matchType: "near_duplicate",       confidenceScore: 96.8, reviewStatus: "pending" },
      { nationalCode: "ONOMC-WNF6CL300",  cpseId: "SteelCo India",sourceMaterialCode: "SC-FLG-6-300",matchType: "near_duplicate",       confidenceScore: 95.4, reviewStatus: "pending" },

      // ── Stud Bolt M16x110 L7 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-SB16X110L7", cpseId: "CPCL",         sourceMaterialCode: "MAT-00901",  matchType: "near_duplicate",       confidenceScore: 98.1, reviewStatus: "approved" },
      { nationalCode: "ONOMC-SB16X110L7", cpseId: "SteelCo India",sourceMaterialCode: "SC-SB-16-110",matchType: "exact",               confidenceScore: 99.5, reviewStatus: "approved" },

      // ── CS Pipe 6" SCH20 (2-way near-duplicate) ──
      { nationalCode: "ONOMC-CSP6S20",    cpseId: "CPCL",         sourceMaterialCode: "MAT-00678",  matchType: "near_duplicate",       confidenceScore: 97.0, reviewStatus: "pending" },
      { nationalCode: "ONOMC-CSP6S20",    cpseId: "SteelCo India",sourceMaterialCode: "SC-PIP-6-20", matchType: "exact",               confidenceScore: 99.3, reviewStatus: "approved" },

      // ── Unique single-CPSE mappings ──
      { nationalCode: "ONOMC-GV10CL150RF", cpseId: "CPCL",         sourceMaterialCode: "MAT-00345",  matchType: "exact",               confidenceScore: 100,  reviewStatus: "approved" },
      { nationalCode: "ONOMC-CV4CL600SW",  cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-VLV-555", matchType: "exact",               confidenceScore: 100,  reviewStatus: "approved" },
      { nationalCode: "ONOMC-CSP8S40",     cpseId: "PowerGen Ltd", sourceMaterialCode: "PG-PIP-220", matchType: "exact",               confidenceScore: 100,  reviewStatus: "approved" },
      { nationalCode: "ONOMC-XLPE3C50",    cpseId: "SteelCo India",sourceMaterialCode: "SC-CBL-3X50",matchType: "exact",               confidenceScore: 100,  reviewStatus: "approved" },
      { nationalCode: "ONOMC-SWGF3CL150",  cpseId: "SteelCo India",sourceMaterialCode: "SC-FG-3-150",matchType: "exact",               confidenceScore: 100,  reviewStatus: "approved" },
    ];

    for (const row of mappings) {
      await ctx.db.insert("materialMappings", row);
    }

    // ──────────────────────────────────────────────────────────────────
    //  4.  AUDIT LOG  (seed entries for each national code creation)
    // ──────────────────────────────────────────────────────────────────
    for (const nat of nationalRows) {
      await ctx.db.insert("auditLog", {
        entityType: "nationalMaterial",
        entityId: nat.nationalCode,
        action: "created",
        actor: "system:seed",
        afterState: { ...nat },
        timestamp: now - 10 * day,
      });
    }

    return {
      cpseMaterials: cpseRows.length,
      nationalMaterials: nationalRows.length,
      materialMappings: mappings.length,
      auditEntries: nationalRows.length,
    };
  },
});
