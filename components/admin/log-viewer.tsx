"use client";

import { useState } from "react";

export default function LogViewer() {
  const [container, setContainer] = useState<string | null>(null);
  const [logs, setLogs] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadLogs(name: string) {
    setContainer(name);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/containers/${name}/logs`);
      const data = await res.json();

      if (!res.ok) {
        setLogs(data.error || "Could not load logs");
        return;
      }

      setLogs(data.logs || "No logs returned.");
    } finally {
      setLoading(false);
    }
  }

  return { container, logs, loading, loadLogs };
}
