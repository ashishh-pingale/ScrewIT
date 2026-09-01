import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Raw materials ingested from CPSE ERPs
  materials: defineTable({
    cpseId: v.string(),           // "CPCL", "NTPC", "SAIL", etc.
    sourceCode: v.string(),        // Original material code from CPSE
    description: v.string(),
    uom: v.string(),               // Unit of measure
    classification: v.optional(v.string()),
    nationalCode: v.optional(v.string()),  // Mapped national code (null if unmapped)
    status: v.union(
      v.literal("ingested"),
      v.literal("mapped"),
      v.literal("review"),
      v.literal("approved")
    ),
    confidenceScore: v.optional(v.number()),
  }),

  // Duplicate match candidates awaiting review
  reviewQueue: defineTable({
    clusterId: v.string(),
    materials: v.array(v.id("materials")),
    similarityScore: v.number(),
    suggestedNationalCode: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewedBy: v.optional(v.string()),
  }),
});
