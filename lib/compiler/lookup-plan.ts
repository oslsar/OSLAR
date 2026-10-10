import type {
  CompilerLookupPlanEntry,
  CompilerRelationship,
} from "@/lib/compiler/types";

/** Resolve outgoing lookup anchors without mutating relationship metadata. */
export function planLookupAnchors(
  relationships: readonly CompilerRelationship[],
  availableColumns: ReadonlySet<string>
): CompilerLookupPlanEntry[] {
  // Match metadata's stable ordering, independent of caller array order.
  const compare = (left: string, right: string) =>
    left < right ? -1 : left > right ? 1 : 0;
  const ordered = [...relationships].sort((left, right) =>
    compare(left.childEntityCode, right.childEntityCode) ||
    compare(left.parentEntityCode, right.parentEntityCode) ||
    compare(left.relationshipId, right.relationshipId)
  );
  const entries = ordered.map((relationship): CompilerLookupPlanEntry => ({
    relationship,
    anchorColumn: null,
    anchorSource: "unresolved",
    diagnostic: null,
  }));
  const claimed = new Set<string>();
  const suitable = (relationship: CompilerRelationship, column: string) =>
    availableColumns.has(column) &&
    relationship.foreignKeyColumns.includes(column);

  // Reserve every explicit anchor before allocating any implicit anchor.
  // Conflicting explicit metadata is reported, never silently relocated.
  for (const entry of entries) {
    const anchor = entry.relationship.lookupAnchorColumn;
    if (anchor === null) continue;
    if (!suitable(entry.relationship, anchor)) {
      entry.diagnostic = `Explicit lookup anchor ${anchor} is not an available FK field.`;
      continue;
    }
    entry.anchorColumn = anchor;
    entry.anchorSource = "explicit";
    claimed.add(anchor);
  }
  for (const entry of entries) {
    if (entry.anchorSource !== "explicit") continue;
    if (entries.some((other) => other !== entry &&
      other.anchorSource === "explicit" &&
      other.anchorColumn === entry.anchorColumn)) {
      entry.diagnostic = `Multiple explicit lookups claim ${entry.anchorColumn}.`;
    }
  }

  // Reserve non-conflicting defaults before searching for alternatives, so
  // an inferred anchor cannot steal another relationship's default field.
  for (const entry of entries) {
    if (entry.relationship.lookupAnchorColumn !== null) continue;
    const anchor = entry.relationship.foreignKeyColumns[0];
    if (anchor && suitable(entry.relationship, anchor) && !claimed.has(anchor)) {
      entry.anchorColumn = anchor;
      entry.anchorSource = "default";
      claimed.add(anchor);
    }
  }

  for (const entry of entries) {
    if (entry.relationship.lookupAnchorColumn !== null || entry.anchorColumn) continue;
    // A relationship-specific field occurs in no other outgoing lookup.
    // FK metadata order breaks ties; shared fields are never inferred anchors.
    const anchor = entry.relationship.foreignKeyColumns.find((column) =>
      suitable(entry.relationship, column) && !claimed.has(column) &&
      !ordered.some((other) => other !== entry.relationship &&
        other.foreignKeyColumns.includes(column))
    );
    if (anchor) {
      entry.anchorColumn = anchor;
      entry.anchorSource = "inferred";
      claimed.add(anchor);
    } else {
      entry.diagnostic = "No available relationship-specific FK field can resolve the lookup anchor.";
    }
  }
  return entries;
}
