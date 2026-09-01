import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── CPSE Materials (raw ingested records from each company's ERP) ──────
  cpseMaterials: defineTable({
    cpseId: v.string(),                // "CPCL", "PowerGen Ltd", "SteelCo India"
    cpseName: v.string(),              // Full display name
    sourceMaterialCode: v.string(),    // Company's own material code
    sourceDescription: v.string(),     // Description as entered in their ERP
    uom: v.string(),                   // Unit of measure
    classificationCode: v.string(),    // Company's classification / category
    technicalAttrs: v.any(),           // Flexible key-value (size, grade, pressure class, etc.)
    ingestedAt: v.number(),            // Unix timestamp
  })
    .index("by_cpseId", ["cpseId"])
    .index("by_sourceCode", ["cpseId", "sourceMaterialCode"]),

  // ── National Material Master (harmonized ONOMC codes) ──────────────────
  nationalMaterials: defineTable({
    nationalCode: v.string(),          // e.g. "ONOMC-GV6CL300RF"
    standardDescription: v.string(),
    standardUom: v.string(),
    standardClassification: v.string(),
    status: v.union(v.literal("draft"), v.literal("approved")),
    createdAt: v.number(),
  })
    .index("by_nationalCode", ["nationalCode"]),

  // ── Material Mappings (bidirectional link: national ↔ CPSE source) ─────
  materialMappings: defineTable({
    nationalCode: v.string(),          // FK → nationalMaterials.nationalCode
    cpseId: v.string(),                // FK → cpseMaterials.cpseId
    sourceMaterialCode: v.string(),    // FK → cpseMaterials.sourceMaterialCode
    matchType: v.union(
      v.literal("exact"),
      v.literal("near_duplicate"),
      v.literal("functional_equivalent")
    ),
    confidenceScore: v.number(),       // 0-100
    reviewStatus: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedBy: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    syncedAt: v.optional(v.number()),
  })
    .index("by_nationalCode", ["nationalCode"])
    .index("by_cpseId", ["cpseId"])
    .index("by_reviewStatus", ["reviewStatus"]),

  // ── Audit Log (append-only, immutable trail) ───────────────────────────
  auditLog: defineTable({
    entityType: v.string(),            // "cpseMaterial" | "nationalMaterial" | "mapping"
    entityId: v.string(),              // The _id or key of the affected record
    action: v.string(),                // "created" | "updated" | "approved" | "rejected"
    actor: v.string(),                 // User or system identifier
    beforeState: v.optional(v.any()),
    afterState: v.optional(v.any()),
    timestamp: v.number(),
  })
    .index("by_entity", ["entityType", "entityId"])
    .index("by_timestamp", ["timestamp"]),
});
