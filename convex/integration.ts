import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Per-CPSE sync status: how many approved mappings are synced vs pending.
 * Also returns the full list of unsynced mappings for payload preview.
 */
export const syncStatus = query({
  args: {},
  handler: async (ctx) => {
    const mappings = await ctx.db.query("materialMappings").collect();
    const materials = await ctx.db.query("cpseMaterials").collect();

    // Build a cpseId → cpseName lookup
    const cpseNames = new Map<string, string>();
    for (const m of materials) {
      if (!cpseNames.has(m.cpseId)) cpseNames.set(m.cpseId, m.cpseName);
    }

    // Group approved mappings by CPSE
    const byCpse = new Map<
      string,
      { synced: number; unsynced: number; unsyncedMappings: typeof mappings }
    >();

    for (const m of mappings) {
      if (m.reviewStatus !== "approved") continue;
      const entry = byCpse.get(m.cpseId) ?? {
        synced: 0,
        unsynced: 0,
        unsyncedMappings: [],
      };
      if (m.syncedAt) {
        entry.synced++;
      } else {
        entry.unsynced++;
        entry.unsyncedMappings.push(m);
      }
      byCpse.set(m.cpseId, entry);
    }

    // Resolve national material descriptions for unsynced payloads
    const result = await Promise.all(
      [...byCpse.entries()].map(async ([cpseId, data]) => {
        const payloads = await Promise.all(
          data.unsyncedMappings.map(async (m) => {
            const nat = await ctx.db
              .query("nationalMaterials")
              .withIndex("by_nationalCode", (q) =>
                q.eq("nationalCode", m.nationalCode)
              )
              .unique();
            return {
              sourceMaterialCode: m.sourceMaterialCode,
              nationalCode: m.nationalCode,
              description: nat?.standardDescription ?? "—",
              matchType: m.matchType,
              confidenceScore: m.confidenceScore,
            };
          })
        );

        return {
          cpseId,
          cpseName: cpseNames.get(cpseId) ?? cpseId,
          totalApproved: data.synced + data.unsynced,
          synced: data.synced,
          unsynced: data.unsynced,
          payloads,
        };
      })
    );

    return result.sort((a, b) => b.unsynced - a.unsynced);
  },
});

/**
 * Mark all unsynced approved mappings for a given CPSE as synced.
 * Simulates writing the national code back to the ERP.
 */
export const syncCpse = mutation({
  args: { cpseId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();

    const mappings = await ctx.db
      .query("materialMappings")
      .withIndex("by_cpseId", (q) => q.eq("cpseId", args.cpseId))
      .collect();

    let synced = 0;
    for (const m of mappings) {
      if (m.reviewStatus !== "approved" || m.syncedAt) continue;

      const before = { ...m };
      await ctx.db.patch(m._id, { syncedAt: now });
      synced++;

      await ctx.db.insert("auditLog", {
        entityType: "mapping",
        entityId: m._id,
        action: "updated",
        actor: "system:erp-sync",
        beforeState: before,
        afterState: { ...before, syncedAt: now },
        timestamp: now,
      });
    }

    return { cpseId: args.cpseId, synced, timestamp: now };
  },
});

/**
 * Sync all CPSEs at once.
 */
export const syncAll = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const cpseIds = new Set<string>();

    const allMappings = await ctx.db.query("materialMappings").collect();
    for (const m of allMappings) {
      if (m.reviewStatus === "approved" && !m.syncedAt) {
        cpseIds.add(m.cpseId);
      }
    }

    let totalSynced = 0;
    for (const cpseId of cpseIds) {
      const mappings = await ctx.db
        .query("materialMappings")
        .withIndex("by_cpseId", (q) => q.eq("cpseId", cpseId))
        .collect();

      for (const m of mappings) {
        if (m.reviewStatus !== "approved" || m.syncedAt) continue;
        const before = { ...m };
        await ctx.db.patch(m._id, { syncedAt: now });
        totalSynced++;

        await ctx.db.insert("auditLog", {
          entityType: "mapping",
          entityId: m._id,
          action: "updated",
          actor: "system:erp-sync",
          beforeState: before,
          afterState: { ...before, syncedAt: now },
          timestamp: now,
        });
      }
    }

    return { totalSynced, cpseCount: cpseIds.size, timestamp: now };
  },
});
