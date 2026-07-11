"use client";

import { useState } from "react";

export default function BackupNowButton() {
  const [loading, setLoading] = useState(false);

  async function runBackup() {
    if (!confirm("Run PostgreSQL backup now?")) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/backups/postgres", {
        method: "POST",
      });

      if (!res.ok) {
        alert("Backup failed");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={runBackup}
      disabled={loading}
      className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
    >
      {loading ? "Backing up..." : "Backup Now"}
    </button>
  );
}
