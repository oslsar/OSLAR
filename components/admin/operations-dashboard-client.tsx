"use client";

import { useEffect, useMemo, useState } from "react";
import ContainerTable, { ContainerStatus } from "./container-table";

type InspectDetails = {
  id: string;
  image: string;
  created: string;
  restartPolicy: string;
  ipAddress: string;
  env: string[];
  mounts: {
    Source?: string;
    Destination?: string;
    Type?: string;
  }[];
};

export default function OperationsDashboardClient({
  devContainers,
  prodContainers,
  infraContainers,
}: {
  devContainers: ContainerStatus[];
  prodContainers: ContainerStatus[];
  infraContainers: ContainerStatus[];
}) {
  const [selectedContainer, setSelectedContainer] = useState("");
  const [logs, setLogs] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [copied, setCopied] = useState(false);
  const [inspectContainer, setInspectContainer] = useState("");
  const [inspectDetails, setInspectDetails] = useState<InspectDetails | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  async function inspect(name: string) {
    setInspectContainer(name);
    setInspectLoading(true);

    try {
      const res = await fetch(`/api/admin/containers/${name}/inspect`);
      const data = await res.json();

      if (res.ok) {
        setInspectDetails(data.details);
      } else {
        setInspectDetails(null);
        alert(data.error || "Unable to inspect container.");
      }
    } finally {
      setInspectLoading(false);
    }
  }

  async function loadLogs(name: string) {
    setSelectedContainer(name);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/containers/${name}/logs`);
      const data = await res.json();
      setLogs(res.ok ? data.logs ?? "" : data.error ?? "Unable to load logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedContainer || !autoRefresh) return;

    const timer = setInterval(() => {
      loadLogs(selectedContainer);
    }, 3000);

    return () => clearInterval(timer);
  }, [selectedContainer, autoRefresh]);

  const filteredLogs = useMemo(() => {
    if (!filter.trim()) return logs;

    return logs
      .split("\n")
      .filter((line) => line.toLowerCase().includes(filter.toLowerCase()))
      .join("\n");
  }, [logs, filter]);

  async function copyLogs() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(filteredLogs);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = filteredLogs;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Unable to copy logs.");
    }
  }

  function downloadLogs() {
    const blob = new Blob([filteredLogs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${selectedContainer || "container"}-logs.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div>
        <ContainerTable
          title="Development Containers"
          containers={devContainers}
          onViewLogs={loadLogs}
          onInspect={inspect}
        />

        <ContainerTable
          title="Production Containers"
          containers={prodContainers}
          onViewLogs={loadLogs}
          onInspect={inspect}
        />

        <ContainerTable
          title="Infrastructure Containers"
          containers={infraContainers}
          onViewLogs={loadLogs}
          onInspect={inspect}
        />
      </div>

      <div className="xl:sticky xl:top-4 xl:self-start">
        <div className="overflow-hidden rounded-xl border shadow-sm">
          <div className="border-b bg-gray-100 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Live Log Viewer</h2>
                <p className="text-sm text-gray-500">
                  {selectedContainer || "Select a container"}
                </p>
              </div>

              {selectedContainer && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    onClick={() => loadLogs(selectedContainer)}
                    className="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Refresh
                  </button>

                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    {autoRefresh ? "Pause" : "Resume"}
                  </button>

                  <button
                    onClick={copyLogs}
                    className="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>

                  <button
                    onClick={downloadLogs}
                    className="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Download
                  </button>

                  <button
                    onClick={() => {
                      setSelectedContainer("");
                      setLogs("");
                      setFilter("");
                    }}
                    className="rounded border bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>


            {selectedContainer && (
              <div className="mt-3">
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter logs..."
                  className="w-full rounded border px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>

          <pre className="min-h-[520px] max-h-[760px] overflow-auto bg-black p-5 font-mono text-xs whitespace-pre-wrap text-green-300">
            {selectedContainer
              ? loading
                ? "Loading..."
                : filteredLogs || "No matching log lines."
              : "Click Logs beside a container to view live logs here."}
          </pre>
        </div>

  {inspectContainer && (
    <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Inspect: {inspectContainer}</h2>
          <p className="text-sm text-gray-500">Container details</p>
        </div>

        <button
          onClick={() => {
            setInspectContainer("");
            setInspectDetails(null);
          }}
          className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Close
        </button>
      </div>

      {inspectLoading ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : inspectDetails ? (
        <div className="space-y-3 text-sm">
          <div>
            <div className="font-semibold">Image</div>
            <div className="text-gray-600">{inspectDetails.image}</div>
          </div>

          <div>
            <div className="font-semibold">Container ID</div>
            <div className="break-all text-gray-600">{inspectDetails.id}</div>
          </div>

          <div>
            <div className="font-semibold">Created</div>
            <div className="text-gray-600">
              {new Date(inspectDetails.created).toLocaleString()}
            </div>
          </div>

          <div>
            <div className="font-semibold">Restart Policy</div>
            <div className="text-gray-600">{inspectDetails.restartPolicy || "—"}</div>
          </div>

          <div>
            <div className="font-semibold">IP Address</div>
            <div className="text-gray-600">{inspectDetails.ipAddress || "—"}</div>
          </div>

          <div>
            <div className="font-semibold">Environment</div>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-950 p-3 text-xs text-green-300">
              {inspectDetails.env.join("\n")}
            </pre>
          </div>

          <div>
            <div className="font-semibold">Mounts</div>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-gray-950 p-3 text-xs text-green-300">
              {inspectDetails.mounts
                .map((m) => `${m.Type || ""}: ${m.Source || ""} -> ${m.Destination || ""}`)
                .join("\n")}
            </pre>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No details loaded.</div>
      )}
    </div>
  )}
      </div>
    </div>
  );
}