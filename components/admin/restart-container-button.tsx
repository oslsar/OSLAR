"use client";

import { useState } from "react";

export default function RestartContainerButton({ name }: { name: string }) {
  const [loading, setLoading] = useState(false);

  async function restart() {
    if (!confirm(`Restart ${name}?`)) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/containers/${name}/restart`, {
        method: "POST",
      });

      if (!res.ok) {
        alert("Restart failed");
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={restart}
      disabled={loading}
      className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
    >
      {loading ? "Restarting..." : "Restart"}
    </button>
  );
}
