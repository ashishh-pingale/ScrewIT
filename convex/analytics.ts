import { query } from "./_generated/server";

// ── Category inference from classificationCode ──────────────────────
// Maps the seed data's classification prefixes to display categories.
const CAT_MAP: Record<string, string> = {
  VLV: "Valves",
  PIPE: "Pipes",
  FIT: "Fittings",
  FLG: "Flanges",
  FST: "Fasteners",
  CBL: "Electrical",
  ELEC: "Electrical",
  INS: "Instruments",
  GSK: "Gaskets",
};

function inferCategory(code: string): string {
  const prefix = code.split("-")[0]?.toUpperCase();
  return CAT_MAP[prefix] ?? "Other";
}

// ══════════════════════════════════════════════════════════════════════
//  SUMMARY STATS
// ══════════════════════════════════════════════════════════════════════

export const summaryStats = query({
  args: {},
  handler: async (ctx) => {
    const materials = await ctx.db.query("cpseMaterials").collect();
    const mappings = await ctx.db.query("materialMappings").collect();
    const nationals = await ctx.db.query("nationalMaterials").collect();

    const pendingCount = mappings.filter(
      (m) => m.reviewStatus === "pending"
    ).length;
    const approvedCount = mappings.filter(
      (m) => m.reviewStatus === "approved"
    ).length;

    // Clusters = distinct nationalCodes that have ≥2 approved mappings
    const codeToApproved = new Map<string, number>();
    for (const m of mappings) {
      if (m.reviewStatus === "approved") {
        codeToApproved.set(
          m.nationalCode,
          (codeToApproved.get(m.nationalCode) ?? 0) + 1
        );
      }
    }
    const clusterCount = [...codeToApproved.values()].filter(
      (n) => n >= 2
    ).length;

    const approvedNationals = nationals.filter(
      (n) => n.status === "approved"
    ).length;

    return {
      totalMaterials: materials.length,
      totalMappings: mappings.length,
      pendingCount,
      approvedCount,
      clusterCount,
      approvedNationals,
      totalNationals: nationals.length,
    };
  },
});

// ══════════════════════════════════════════════════════════════════════
//  CATEGORY BREAKDOWN — clusters per material category
// ══════════════════════════════════════════════════════════════════════

export const categoryBreakdown = query({
  args: {},
  handler: async (ctx) => {
    const mappings = await ctx.db.query("materialMappings").collect();

    // Group approved mappings by nationalCode, then infer category
    // from the first mapping's CPSE material classificationCode.
    const codeMembers = new Map<string, string[]>(); // nationalCode → [classificationCode]
    for (const m of mappings) {
      if (m.reviewStatus !== "approved") continue;
      const arr = codeMembers.get(m.nationalCode) ?? [];
      arr.push(m.cpseId + "|" + m.sourceMaterialCode);
      codeMembers.set(m.nationalCode, arr);
    }

    // Resolve classification for each nationalCode via cpseMaterials lookup
    const categoryCounts = new Map<string, number>();
    let totalClusters = 0;

    for (const [, members] of codeMembers) {
      if (members.length < 2) continue;
      totalClusters++;

      // Look up the first member's classificationCode
      const first = members[0];
      const [cpseId, sourceCode] = [first.split("|")[0], first.split("|").slice(1).join("|")];
      const mat = await ctx.db
        .query("cpseMaterials")
        .withIndex("by_sourceCode", (q) =>
          q.eq("cpseId", cpseId).eq("sourceMaterialCode", sourceCode)
        )
        .unique();

      const category = mat ? inferCategory(mat.classificationCode) : "Other";
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }

    // Also count total cpseMaterials per category for context
    const allMaterials = await ctx.db.query("cpseMaterials").collect();
    const materialByCategory = new Map<string, number>();
    for (const m of allMaterials) {
      const cat = inferCategory(m.classificationCode);
      materialByCategory.set(cat, (materialByCategory.get(cat) ?? 0) + 1);
    }

    return {
      categories: [...categoryCounts.entries()]
        .map(([name, clusterCount]) => ({
          name,
          clusterCount,
          totalMaterials: materialByCategory.get(name) ?? 0,
        }))
        .sort((a, b) => b.clusterCount - a.clusterCount),
      totalClusters,
    };
  },
});

// ══════════════════════════════════════════════════════════════════════
//  APPROVED NATIONAL CODES with CPSE member counts (for cost savings)
// ══════════════════════════════════════════════════════════════════════

export const approvedClusters = query({
  args: {},
  handler: async (ctx) => {
    const mappings = await ctx.db.query("materialMappings").collect();

    // Group approved mappings by nationalCode
    const groups = new Map<
      string,
      { cpseId: string; sourceMaterialCode: string }[]
    >();
    for (const m of mappings) {
      if (m.reviewStatus !== "approved") continue;
      const arr = groups.get(m.nationalCode) ?? [];
      arr.push({ cpseId: m.cpseId, sourceMaterialCode: m.sourceMaterialCode });
      groups.set(m.nationalCode, arr);
    }

    // Resolve national material details and filter to clusters with 2+ CPSEs
    const results = await Promise.all(
      [...groups.entries()]
        .filter(([, members]) => members.length >= 2)
        .map(async ([natCode, members]) => {
          const nat = await ctx.db
            .query("nationalMaterials")
            .withIndex("by_nationalCode", (q) =>
              q.eq("nationalCode", natCode)
            )
            .unique();

          const uniqueCPSEs = [...new Set(members.map((m) => m.cpseId))];

          return {
            nationalCode: natCode,
            standardDescription: nat?.standardDescription ?? "—",
            standardClassification: nat?.standardClassification ?? "—",
            cpseCount: uniqueCPSEs.length,
            memberCount: members.length,
            cpseIds: uniqueCPSEs,
          };
        })
    );

    return results.sort((a, b) => b.cpseCount - a.cpseCount || b.memberCount - a.memberCount);
  },
});

// ══════════════════════════════════════════════════════════════════════
//  RECENT ACTIVITY FEED from auditLog
// ══════════════════════════════════════════════════════════════════════

export const recentActivity = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .take(20);

    return logs.map((entry) => {
      // Build a human-readable description
      const actionVerb =
        entry.action === "approved"
          ? "Approved"
          : entry.action === "rejected"
            ? "Rejected"
            : entry.action === "updated"
              ? "Updated"
              : entry.action === "created"
                ? "Created"
                : entry.action;

      const targetLabel =
        entry.entityType === "nationalMaterial"
          ? `national code ${entry.afterState?.nationalCode ?? entry.entityId}`
          : entry.entityType === "mapping"
            ? `mapping ${entry.entityId.slice(0, 8)}…`
            : `${entry.entityType} ${entry.entityId.slice(0, 8)}…`;

      return {
        _id: entry._id,
        actor: entry.actor,
        action: entry.action,
        verb: actionVerb,
        target: targetLabel,
        entityType: entry.entityType,
        timestamp: entry.timestamp,
        beforeState: entry.beforeState,
        afterState: entry.afterState,
      };
    });
  },
});

// ══════════════════════════════════════════════════════════════════════
//  AUDIT TRAIL — full, filterable list for compliance/governance
// ══════════════════════════════════════════════════════════════════════

export const auditTrail = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db
      .query("auditLog")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    return logs.map((entry) => ({
      _id: entry._id,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.action,
      actor: entry.actor,
      timestamp: entry.timestamp,
      beforeState: entry.beforeState ?? null,
      afterState: entry.afterState ?? null,
    }));
  },
});

export const auditTrailCounts = query({
  args: {},
  handler: async (ctx) => {
    const logs = await ctx.db.query("auditLog").collect();

    const byAction: Record<string, number> = {};
    const byEntity: Record<string, number> = {};
    const byActor: Record<string, number> = {};

    for (const l of logs) {
      byAction[l.action] = (byAction[l.action] ?? 0) + 1;
      byEntity[l.entityType] = (byEntity[l.entityType] ?? 0) + 1;
      byActor[l.actor] = (byActor[l.actor] ?? 0) + 1;
    }

    return {
      total: logs.length,
      byAction,
      byEntity,
      byActor,
      actors: Object.keys(byActor).sort(),
      actions: Object.keys(byAction).sort(),
      entityTypes: Object.keys(byEntity).sort(),
    };
  },
});
