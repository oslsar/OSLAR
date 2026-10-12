import type { CompilerLookup } from "@/lib/compiler/types";

/** Apply a parent selection and invalidate lookups whose context it supplies. */
export function applyLookupValues(
  current: Record<string, unknown>,
  selectedLookup: CompilerLookup,
  selectedKey: Record<string, unknown>,
  lookups: readonly CompilerLookup[]
): Record<string, unknown> {
  const next = { ...current };
  const selectionChanged = selectedLookup.foreignKeyColumns.some(
    (column, index) =>
      String(current[column] ?? "") !==
      String(selectedKey[selectedLookup.primaryKeyColumns[index]] ?? "")
  );
  // Populate fields from the selected parent.
  selectedLookup.foreignKeyColumns.forEach(
    (foreignColumn, index) => {
      const primaryColumn =
        selectedLookup.primaryKeyColumns[index];

      if (primaryColumn) {
        next[foreignColumn] =
          selectedKey[primaryColumn] ?? null;
      }
    }
  );

  if (!selectionChanged) return next;

  // Clear dependent selections when the supplying parent selection changes.
  for (const dependentLookup of lookups) {
    if (dependentLookup.relationshipId === selectedLookup.relationshipId) {
      continue;
    }

    const contextSourceColumns = [
      ...dependentLookup.contextFilters.map((filter) => filter.sourceColumn),
      ...(dependentLookup.contextSourceColumn
        ? [dependentLookup.contextSourceColumn]
        : []),
    ];
    if (!contextSourceColumns.some((column) =>
      selectedLookup.foreignKeyColumns.includes(column)
    )) {
      continue;
    }

    // Preserve fields supplied by the selected parent.
    for (const column of dependentLookup.foreignKeyColumns) {
      if (!selectedLookup.foreignKeyColumns.includes(column)) {
        next[column] = "";
      }
    }
  }

  return next;
}
