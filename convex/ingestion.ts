import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * Bulk-insert CPSE materials from parsed CSV rows.
 * Validates required fields, checks for duplicates, and writes audit entries.
 * Returns a summary of what was inserted and what was skipped.
 */
export const bulkInsert = mutation({
  args: {
    rows: v.array(
      v.object({
        cpseId: v.string(),
        cpseName: v.string(),
        sourceMaterialCode: v.string(),
        sourceDescription: v.string(),
        uom: v.string(),
        classificationCode: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of args.rows) {
      // ── Validate required fields ────────────────────────────────
      if (
        !row.cpseId.trim() ||
        !row.sourceMaterialCode.trim() ||
        !row.sourceDescription.trim()
      ) {
        errors.push(
          `Row "${row.sourceMaterialCode || "(empty)"}": missing required field`
        );
        skipped++;
        continue;
      }

      const cpseId = row.cpseId.trim();
      const sourceMaterialCode = row.sourceMaterialCode.trim();

      // ── Check for duplicate ─────────────────────────────────────
      const existing = await ctx.db
        .query("cpseMaterials")
        .withIndex("by_sourceCode", (q) =>
          q.eq("cpseId", cpseId).eq("sourceMaterialCode", sourceMaterialCode)
        )
        .unique();

      if (existing) {
        errors.push(
          `Duplicate: ${cpseId}/${sourceMaterialCode} already exists — skipped`
        );
        skipped++;
        continue;
      }

      // ── Insert ──────────────────────────────────────────────────
      const insertedRow = await ctx.db.insert("cpseMaterials", {
        cpseId,
        cpseName: row.cpseName.trim() || cpseId,
        sourceMaterialCode,
        sourceDescription: row.sourceDescription.trim(),
        uom: row.uom.trim() || "NOS",
        classificationCode: row.classificationCode.trim() || "UNCAT",
        technicalAttrs: {},
        ingestedAt: now,
      });

      await ctx.db.insert("auditLog", {
        entityType: "cpseMaterial",
        entityId: insertedRow,
        action: "created",
        actor: "user:csv-upload",
        afterState: { cpseId, sourceMaterialCode, sourceDescription: row.sourceDescription.trim() },
        timestamp: now,
      });

      inserted++;
    }

    return { inserted, skipped, total: args.rows.length, errors };
  },
});
