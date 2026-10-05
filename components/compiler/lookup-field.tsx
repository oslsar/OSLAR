"use client";

import { useEffect, useMemo, useState } from "react";
import type { CompilerLookup } from "@/lib/compiler/types";

type LookupItem = {
  key: Record<string, unknown>;
  label: string;
  display: Record<string, unknown>;
};

type LookupResponse = {
  entityCode: string;
  keyColumns: string[];
  displayColumns: string[];
  searchColumns: string[];
  items: LookupItem[];
  limit: number;
  query: string | null;
};

type LookupFieldProps = {
  lookup: CompilerLookup;
  value?: Record<string, unknown> | null;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  onChange?: (value: Record<string, unknown>) => void;
  contextValue?: string | null;
};

function serializeKey(key: Record<string, unknown>): string {
  return JSON.stringify(key);
}

function keysMatch(
  left: Record<string, unknown> | null | undefined,
  right: Record<string, unknown>
): boolean {
  if (!left) {
    return false;
  }

  return serializeKey(left) === serializeKey(right);
}

export default function LookupField({
  lookup,
  value = null,
  disabled = false,
  readOnly = false,
  required = false,
  placeholder = "Search or select a value",
  onChange,
  contextValue = null,
}: LookupFieldProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<LookupItem[]>([]);
  const [selectedKey, setSelectedKey] =
    useState<Record<string, unknown> | null>(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedKey(value);
  }, [value]);

  useEffect(() => {
    setItems([]);

    const effectiveContext = contextValue?.trim() ?? "";

    if (
      disabled ||
      readOnly ||
      (lookup.contextSourceColumn && !effectiveContext)
    ) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: "25",
          relationshipId: lookup.relationshipId,
        });

        const trimmedQuery = query.trim();

        if (trimmedQuery) {
          params.set("q", trimmedQuery);
        }

        if (lookup.contextSourceColumn) {
          params.set("context", effectiveContext);
        }

        const response = await fetch(
          `/api/compiler/lookups/${encodeURIComponent(
            lookup.parentEntityCode
          )}?${params.toString()}`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Lookup request failed with status ${response.status}`
          );
        }

        const result = (await response.json()) as LookupResponse;
        setItems(result.items);
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === "AbortError"
        ) {
          return;
        }

        console.error("Lookup request failed:", caughtError);
        setItems([]);
        setError("Unable to load lookup values.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    disabled,
    readOnly,
    lookup.parentEntityCode,
    lookup.relationshipId,
    lookup.contextSourceColumn,
    contextValue,
    query,
  ]);

  const selectedLabel = useMemo(() => {
    const selectedItem = items.find((item) =>
      keysMatch(selectedKey, item.key)
    );

    if (selectedItem) {
      return selectedItem.label;
    }

    if (!selectedKey) {
      return "";
    }

    return Object.values(selectedKey)
      .filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          String(item).length > 0
      )
      .map(String)
      .join(" · ");
  }, [items, selectedKey]);

  function handleSelection(serializedKey: string) {
    const selectedItem = items.find(
      (item) => serializeKey(item.key) === serializedKey
    );

    if (!selectedItem) {
      return;
    }

    // Reject a stale selection from a different End Item.
    if (lookup.contextSourceColumn) {
      const index = lookup.foreignKeyColumns.indexOf(
        lookup.contextSourceColumn
      );

      const parentColumn =
        lookup.primaryKeyColumns[index];

      if (
        !parentColumn ||
        !contextValue ||
        String(selectedItem.key[parentColumn] ?? "") !==
          contextValue.trim()
      ) {
        setError(
          "This selection does not match the current End Item."
        );
        return;
      }
    }

    setError(null);
    setSelectedKey(selectedItem.key);
    onChange?.(selectedItem.key);
  }

  if (readOnly) {
    const summary = lookup.primaryKeyColumns
      .map((column) => {
        const item = value?.[column];

        return `${column}: ${
          item === null ||
          item === undefined ||
          item === ""
            ? "—"
            : String(item)
        }`;
      })
      .join(" · ");

    return (
      <div className="mt-3 rounded-md border border-gray-300 bg-gray-100 px-3 py-3">
        <p className="text-sm text-gray-800">
          {summary || "No value selected"}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          Read-only relationship. Primary-key values
          cannot be changed after creation.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        type="search"
        value={query}
        disabled={disabled || readOnly}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      />

      <select
        required={required}
        disabled={disabled || readOnly}
        value={selectedKey ? serializeKey(selectedKey) : ""}
        onChange={(event) => handleSelection(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      >
        <option value="">
          {loading ? "Loading…" : "Select a value"}
        </option>

        {items.map((item) => {
          const serializedKey = serializeKey(item.key);

          return (
            <option key={serializedKey} value={serializedKey}>
              {item.label}
            </option>
          );
        })}
      </select>

      {lookup.composite && (
        <p className="text-xs text-gray-500">
          Selecting this value supplies{" "}
          {lookup.foreignKeyColumns.length} key fields.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
