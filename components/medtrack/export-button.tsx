"use client";

import Button from "./button";

export default function ExportButton({
  rows,
  filename = "export.csv",
}: {
  rows: any[];
  filename?: string;
}) {
  function exportCsv() {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => JSON.stringify(row[h] ?? ""))
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={exportCsv}
    >
      Export CSV
    </Button>
  );
}