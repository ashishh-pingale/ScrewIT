import { query } from "./_generated/server";

/**
 * Return pending mappings enriched with their source material,
 * national material, and sibling mappings in the same cluster.
 *
 * Each result = one pending mapping + full context for the reviewer.
 */
export const pendingMappings = query({
  args: {},
  handler: async (ctx) => {
    // 1. All pending mappings
    const pending = await ctx.db
      .query("materialMappings")
      .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", "pending"))
      .collect();

    // 2. Enrich each with source material + national material + siblings
    const results = await Promise.all(
      pending.map(async (mapping) => {
        // Source CPSE material
        const cpseMaterial = await ctx.db
          .query("cpseMaterials")
          .withIndex("by_sourceCode", (q) =>
            q
              .eq("cpseId", mapping.cpseId)
              .eq("sourceMaterialCode", mapping.sourceMaterialCode)
          )
          .unique();

        // National material
        const nationalMaterial = await ctx.db
          .query("nationalMaterials")
          .withIndex("by_nationalCode", (q) =>
            q.eq("nationalCode", mapping.nationalCode)
          )
          .unique();

        // Sibling mappings (same nationalCode, already approved) for context
        const siblings = await ctx.db
          .query("materialMappings")
          .withIndex("by_nationalCode", (q) =>
            q.eq("nationalCode", mapping.nationalCode)
          )
          .collect();

        // Resolve sibling CPSE materials
        const siblingDetails = await Promise.all(
          siblings
            .filter((s) => s._id !== mapping._id)
            .map(async (s) => {
              const mat = await ctx.db
                .query("cpseMaterials")
                .withIndex("by_sourceCode", (q) =>
                  q
                    .eq("cpseId", s.cpseId)
                    .eq("sourceMaterialCode", s.sourceMaterialCode)
                )
                .unique();
              return { mapping: s, material: mat };
            })
        );

        return {
          _id: mapping._id,
          nationalCode: mapping.nationalCode,
          cpseId: mapping.cpseId,
          sourceMaterialCode: mapping.sourceMaterialCode,
          matchType: mapping.matchType,
          confidenceScore: mapping.confidenceScore,
          cpseMaterial,
          nationalMaterial,
          siblings: siblingDetails,
        };
      })
    );

    return results;
  },
});

/**
 * Return all distinct cpseIds that appear in pending mappings,
 * for the filter dropdown.
 */
export const pendingCpseIds = query({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("materialMappings")
      .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", "pending"))
      .collect();
    const ids = [...new Set(pending.map((m) => m.cpseId))];
    return ids.sort();
  },
});

/**
 * Count of pending mappings — used by sidebar badge.
 */
export const pendingCount = query({
  args: {},
  handler: async (ctx) => {
    const pending = await ctx.db
      .query("materialMappings")
      .withIndex("by_reviewStatus", (q) => q.eq("reviewStatus", "pending"))
      .collect();
    return pending.length;
  },
});
