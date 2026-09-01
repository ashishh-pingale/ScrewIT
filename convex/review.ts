import { v } from "convex/values";
import { mutation } from "./_generated/server";

const ACTOR = "demo-reviewer";

/**
 * Approve a single mapping:
 *  - Set reviewStatus → "approved" + reviewedBy / reviewedAt
 *  - Set linked nationalMaterial status → "approved" if still "draft"
 *  - Write auditLog entries for both
 */
export const approve = mutation({
  args: { mappingId: v.id("materialMappings") },
  handler: async (ctx, args) => {
    const mapping = await ctx.db.get(args.mappingId);
    if (!mapping) throw new Error("Mapping not found");
    if (mapping.reviewStatus !== "pending")
      throw new Error("Mapping is not pending");

    const now = Date.now();

    // Snapshot before
    const beforeMapping = { ...mapping };

    // Update mapping
    await ctx.db.patch(args.mappingId, {
      reviewStatus: "approved",
      reviewedBy: ACTOR,
      reviewedAt: now,
    });

    // Audit: mapping approved
    await ctx.db.insert("auditLog", {
      entityType: "mapping",
      entityId: args.mappingId,
      action: "approved",
      actor: ACTOR,
      beforeState: beforeMapping,
      afterState: { ...beforeMapping, reviewStatus: "approved", reviewedBy: ACTOR, reviewedAt: now },
      timestamp: now,
    });

    // Upgrade national material from draft → approved if needed
    const nat = await ctx.db
      .query("nationalMaterials")
      .withIndex("by_nationalCode", (q) =>
        q.eq("nationalCode", mapping.nationalCode)
      )
      .unique();

    if (nat && nat.status === "draft") {
      const beforeNat = { ...nat };
      await ctx.db.patch(nat._id, { status: "approved" });
      await ctx.db.insert("auditLog", {
        entityType: "nationalMaterial",
        entityId: nat._id,
        action: "approved",
        actor: ACTOR,
        beforeState: beforeNat,
        afterState: { ...beforeNat, status: "approved" },
        timestamp: now,
      });
    }

    return { success: true };
  },
});

/**
 * Reject a single mapping:
 *  - Set reviewStatus → "rejected" + reviewedBy / reviewedAt
 *  - Write auditLog entry
 */
export const reject = mutation({
  args: { mappingId: v.id("materialMappings") },
  handler: async (ctx, args) => {
    const mapping = await ctx.db.get(args.mappingId);
    if (!mapping) throw new Error("Mapping not found");
    if (mapping.reviewStatus !== "pending")
      throw new Error("Mapping is not pending");

    const now = Date.now();
    const beforeMapping = { ...mapping };

    await ctx.db.patch(args.mappingId, {
      reviewStatus: "rejected",
      reviewedBy: ACTOR,
      reviewedAt: now,
    });

    await ctx.db.insert("auditLog", {
      entityType: "mapping",
      entityId: args.mappingId,
      action: "rejected",
      actor: ACTOR,
      beforeState: beforeMapping,
      afterState: { ...beforeMapping, reviewStatus: "rejected", reviewedBy: ACTOR, reviewedAt: now },
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Edit & Approve:
 *  - Patch the national material's standardDescription and/or standardUom
 *  - Approve the mapping
 *  - Write audit log for both changes
 */
export const editAndApprove = mutation({
  args: {
    mappingId: v.id("materialMappings"),
    nationalCode: v.string(),
    standardDescription: v.string(),
    standardUom: v.string(),
  },
  handler: async (ctx, args) => {
    const mapping = await ctx.db.get(args.mappingId);
    if (!mapping) throw new Error("Mapping not found");
    if (mapping.reviewStatus !== "pending")
      throw new Error("Mapping is not pending");

    const now = Date.now();
    const beforeMapping = { ...mapping };

    // 1. Update national material
    const nat = await ctx.db
      .query("nationalMaterials")
      .withIndex("by_nationalCode", (q) =>
        q.eq("nationalCode", args.nationalCode)
      )
      .unique();

    if (!nat) throw new Error("National material not found");

    const beforeNat = { ...nat };
    await ctx.db.patch(nat._id, {
      standardDescription: args.standardDescription,
      standardUom: args.standardUom,
      status: "approved",
    });

    await ctx.db.insert("auditLog", {
      entityType: "nationalMaterial",
      entityId: nat._id,
      action: "updated",
      actor: ACTOR,
      beforeState: beforeNat,
      afterState: {
        ...beforeNat,
        standardDescription: args.standardDescription,
        standardUom: args.standardUom,
        status: "approved",
      },
      timestamp: now,
    });

    // 2. Approve the mapping
    await ctx.db.patch(args.mappingId, {
      reviewStatus: "approved",
      reviewedBy: ACTOR,
      reviewedAt: now,
    });

    await ctx.db.insert("auditLog", {
      entityType: "mapping",
      entityId: args.mappingId,
      action: "approved",
      actor: ACTOR,
      beforeState: beforeMapping,
      afterState: { ...beforeMapping, reviewStatus: "approved", reviewedBy: ACTOR, reviewedAt: now },
      timestamp: now,
    });

    return { success: true };
  },
});
