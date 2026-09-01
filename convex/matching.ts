import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { compareTwoStrings } from "string-similarity";
import { api } from "./_generated/api";

// ── Union-Find for clustering ─────────────────────────────────────────
class UnionFind {
  parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    if (this.parent.get(x) !== x)
      this.parent.set(x, this.find(this.parent.get(x)!));
    return this.parent.get(x)!;
  }
  union(a: string, b: string) {
    const pa = this.find(a);
    const pb = this.find(b);
    if (pa !== pb) this.parent.set(pa, pb);
  }
  clusters(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const key of this.parent.keys()) {
      const root = this.find(key);
      const arr = groups.get(root) ?? [];
      arr.push(key);
      groups.set(root, arr);
    }
    return groups;
  }
}

// ── Text normalisation ────────────────────────────────────────────────
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[°″"'#/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Size / dimension keys that indicate physical compatibility ────────
const SIZE_KEYS = [
  "size",
  "pressureClass",
  "schedule",
  "cores",
  "crossSection",
  "range",
  "rating",
  "speed",
  "frame",
  "element",
  "dimensions",
];

function technicalAttrsConflicts(
  a: Record<string, unknown>,
  b: Record<string, unknown>
): boolean {
  for (const k of SIZE_KEYS) {
    const va = a[k];
    const vb = b[k];
    if (va !== undefined && vb !== undefined && String(va) !== String(vb))
      return true;
  }
  return false;
}

// ── Score a pair ──────────────────────────────────────────────────────
function scorePair(
  descA: string,
  descB: string,
  classA: string,
  classB: string,
  attrsA: Record<string, unknown>,
  attrsB: Record<string, unknown>
): number {
  // Base: Dice coefficient on normalised descriptions (0-1)
  const textSim = compareTwoStrings(normalize(descA), normalize(descB));

  // Classification bonus: +0.08 if same category
  const classBonus = classA === classB ? 0.08 : 0;

  // Technical-attr conflict penalty: −0.15
  const conflictPenalty = technicalAttrsConflicts(attrsA, attrsB) ? 0.15 : 0;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, textSim + classBonus - conflictPenalty));
}

// ── Generate a deterministic nationalCode from a cluster ──────────────
function generateNationalCode(materialIds: string[]): string {
  const sorted = [...materialIds].sort();
  // Simple FNV-1a hash → hex
  let hash = 0x811c9dc5;
  for (const s of sorted) {
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
  }
  const hex = (hash >>> 0).toString(36).toUpperCase().padStart(5, "0");
  return `ONOMC-${hex}`;
}

// ══════════════════════════════════════════════════════════════════════
//  QUERIES (used by the action via ctx.runQuery)
// ══════════════════════════════════════════════════════════════════════

/** Return all CPSE materials (lightweight — no joins). */
export const allCpseMaterials = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("cpseMaterials").collect();
  },
});

/** Return all existing materialMappings (lightweight). */
export const allMappings = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("materialMappings").collect();
  },
});

// ══════════════════════════════════════════════════════════════════════
//  MUTATION — creates a full cluster (national code + mappings)
// ══════════════════════════════════════════════════════════════════════

export const createCluster = mutation({
  args: {
    nationalCode: v.string(),
    standardDescription: v.string(),
    standardUom: v.string(),
    standardClassification: v.string(),
    members: v.array(
      v.object({
        cpseId: v.string(),
        sourceMaterialCode: v.string(),
        matchType: v.union(
          v.literal("exact"),
          v.literal("near_duplicate"),
          v.literal("functional_equivalent")
        ),
        confidenceScore: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check if this nationalCode already exists
    const existing = await ctx.db
      .query("nationalMaterials")
      .withIndex("by_nationalCode", (q) =>
        q.eq("nationalCode", args.nationalCode)
      )
      .unique();

    if (!existing) {
      await ctx.db.insert("nationalMaterials", {
        nationalCode: args.nationalCode,
        standardDescription: args.standardDescription,
        standardUom: args.standardUom,
        standardClassification: args.standardClassification,
        status: "draft",
        createdAt: now,
      });

      await ctx.db.insert("auditLog", {
        entityType: "nationalMaterial",
        entityId: args.nationalCode,
        action: "created",
        actor: "system:matching-engine",
        afterState: {
          nationalCode: args.nationalCode,
          standardDescription: args.standardDescription,
          standardUom: args.standardUom,
          standardClassification: args.standardClassification,
        },
        timestamp: now,
      });
    }

    // Create mapping for each member
    let created = 0;
    for (const m of args.members) {
      // Skip if this material already has any mapping
      const alreadyMapped = await ctx.db
        .query("materialMappings")
        .withIndex("by_cpseId", (q) => q.eq("cpseId", m.cpseId))
        .collect();
      const hasExisting = alreadyMapped.some(
        (x) => x.sourceMaterialCode === m.sourceMaterialCode
      );
      if (hasExisting) continue;

      await ctx.db.insert("materialMappings", {
        nationalCode: args.nationalCode,
        cpseId: m.cpseId,
        sourceMaterialCode: m.sourceMaterialCode,
        matchType: m.matchType,
        confidenceScore: m.confidenceScore,
        reviewStatus: "pending",
      });
      created++;
    }

    return { created };
  },
});

// ══════════════════════════════════════════════════════════════════════
//  ACTION — the main matching engine
// ══════════════════════════════════════════════════════════════════════

export const generateMatchCandidates = action({
  args: {},
  handler: async (ctx): Promise<{ clustersFound: number; mappingsCreated: number }> => {
    // 1. Load all data via queries
    const allMaterials = await ctx.runQuery(api.matching.allCpseMaterials);
    const existingMappings = await ctx.runQuery(api.matching.allMappings);

    // 2. Build a set of already-mapped material keys
    const alreadyMapped = new Set(
      existingMappings.map((m) => `${m.cpseId}|${m.sourceMaterialCode}`)
    );

    // Only consider unmapped materials for new candidate discovery
    const unmapped = allMaterials.filter(
      (m) => !alreadyMapped.has(`${m.cpseId}|${m.sourceMaterialCode}`)
    );

    // 3. Compute pairwise scores for cross-CPSE, unmapped pairs
    const THRESHOLD = 0.55;
    type CpseMat = (typeof allMaterials)[number];
    type Pair = { a: CpseMat; b: CpseMat; score: number };

    const pairs: Pair[] = [];
    for (let i = 0; i < unmapped.length; i++) {
      for (let j = i + 1; j < unmapped.length; j++) {
        const a = unmapped[i];
        const b = unmapped[j];
        if (a.cpseId === b.cpseId) continue; // same CPSE — skip

        const score = scorePair(
          a.sourceDescription,
          b.sourceDescription,
          a.classificationCode,
          b.classificationCode,
          (a.technicalAttrs ?? {}) as Record<string, unknown>,
          (b.technicalAttrs ?? {}) as Record<string, unknown>
        );

        if (score >= THRESHOLD) {
          pairs.push({ a, b, score });
        }
      }
    }

    // 4. Cluster via union-find
    const uf = new UnionFind();
    for (const m of unmapped) {
      const key = `${m.cpseId}|${m.sourceMaterialCode}`;
      uf.parent.set(key, key);
    }
    for (const p of pairs) {
      uf.union(
        `${p.a.cpseId}|${p.a.sourceMaterialCode}`,
        `${p.b.cpseId}|${p.b.sourceMaterialCode}`
      );
    }

    const clusters = uf.clusters();

    // 5. For each cluster with ≥2 members, create a national code + mappings
    let clustersFound = 0;
    let mappingsCreated = 0;

    for (const memberKeys of clusters.values()) {
      if (memberKeys.length < 2) continue;

      clustersFound++;

      // Resolve the full material records for this cluster
      const clusterMaterials: CpseMat[] = memberKeys
        .map((key) => {
          const [cpseId, ...codeParts] = key.split("|");
          const sourceMaterialCode = codeParts.join("|");
          return unmapped.find(
            (m) =>
              m.cpseId === cpseId &&
              m.sourceMaterialCode === sourceMaterialCode
          );
        })
        .filter((m): m is CpseMat => m !== undefined);

      // Pick the best-scoring description as the canonical standardDescription
      const bestDesc = clusterMaterials.reduce<CpseMat>((best, m) =>
        m.sourceDescription.length > best.sourceDescription.length
          ? m
          : best,
        clusterMaterials[0]
      ).sourceDescription;

      // Pick the most common UoM
      const uomCounts = new Map<string, number>();
      for (const m of clusterMaterials) {
        uomCounts.set(m.uom, (uomCounts.get(m.uom) ?? 0) + 1);
      }
      const bestUom = [...uomCounts.entries()].sort(
        (a, b) => b[1] - a[1]
      )[0][0];

      // Pick the most common classification
      const classCounts = new Map<string, number>();
      for (const m of clusterMaterials) {
        classCounts.set(
          m.classificationCode,
          (classCounts.get(m.classificationCode) ?? 0) + 1
        );
      }
      const bestClass = [...classCounts.entries()].sort(
        (a, b) => b[1] - a[1]
      )[0][0];

      // Deterministic nationalCode
      const nationalCode = generateNationalCode(memberKeys);

      // Compute per-member scores and match types
      const members = clusterMaterials.map((m: CpseMat) => {
        // Score against the best description
        const s = scorePair(
          m.sourceDescription,
          bestDesc,
          m.classificationCode,
          bestClass,
          (m.technicalAttrs ?? {}) as Record<string, unknown>,
          {}
        );
        const matchType: "exact" | "near_duplicate" | "functional_equivalent" =
          s > 0.85 ? "exact" : s >= 0.7 ? "near_duplicate" : "functional_equivalent";
        return {
          cpseId: m.cpseId,
          sourceMaterialCode: m.sourceMaterialCode,
          matchType,
          confidenceScore: Math.round(s * 1000) / 10,
        };
      });

      const result = await ctx.runMutation(api.matching.createCluster, {
        nationalCode,
        standardDescription: bestDesc,
        standardUom: bestUom,
        standardClassification: bestClass,
        members,
      });

      mappingsCreated += result.created;
    }

    return { clustersFound, mappingsCreated };
  },
});
