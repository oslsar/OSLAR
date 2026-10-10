"use client";

import { useState } from "react";

export default function ContainerLogsButton({ name }: { name: string }) {
  const [loading, setLoading] = useState(false);

  async function viewLogs() {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/containers/${name}/logs`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Could not load logs");
        return;
      }

      const win = window.open("", "_blank", "width=1000,height=700");
      if (!win) return;

      win.document.write(`
        <html>
          <head>
            <title>Logs - ${name}</title>
            <style>
              body { background: #111827; color: #e5e7eb; font-family: monospace; padding: 20px; }
              pre { white-space: pre-wrap; word-break: break-word; }
            </style>
          </head>
          <body>
            <h2>Logs - ${name}</h2>
            <pre>${String(data.logs || "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] || c))}</pre>
          </body>
        </html>
      `);
      win.document.close();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={viewLogs}
      disabled={loading}
      className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
    >
      {loading ? "Loading..." : "Logs"}
    </button>
  );
}
