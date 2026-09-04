"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DeleteRecordButtonProps = {
  entityCode: string;
  keyColumns: string[];
  row: Record<string, unknown>;
};

export default function DeleteRecordButton({
  entityCode,
  keyColumns,
  row,
}: DeleteRecordButtonProps) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete this ${entityCode} record? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const keys = Object.fromEntries(
      keyColumns.map((column) => [
        column,
        row[column],
      ])
    );

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/compiler/entities/${encodeURIComponent(entityCode)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            keys,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.error ??
            "Unable to delete record."
        );

        return;
      }

      router.refresh();
    } catch (deleteError) {
      console.error(
        "Delete request failed:",
        deleteError
      );

      setError("Unable to delete record.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm font-medium text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>

      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}
