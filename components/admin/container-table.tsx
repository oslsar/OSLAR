import RestartContainerButton from "./restart-container-button";
import StatusBadge from "./status-badge";

export type ContainerStatus = {
  name: string;
  status: string;
  ports: string;
  healthy: boolean;
  running: boolean;
  cpu?: string;
  memory?: string;
  memoryPercent?: string;
};

function HealthBadge(container: ContainerStatus) {
  if (!container.running) return <StatusBadge label="Stopped" colour="red" />;
  if (container.healthy) return <StatusBadge label="Healthy" colour="green" />;
  return <StatusBadge label="Running" colour="blue" />;
}

function percentNumber(value?: string) {
  if (!value) return 0;
  return Number(value.replace("%", "")) || 0;
}

function usageColour(percent: number) {
  if (percent >= 90) return "bg-red-500";
  if (percent >= 70) return "bg-orange-500";
  if (percent >= 50) return "bg-yellow-500";
  return "bg-green-500";
}

function UsageBar({
  label,
  percent,
}: {
  label: string;
  percent?: string;
}) {
  const value = percentNumber(percent);

  return (
    <div className="min-w-[120px]">
      <div className="mb-1 text-xs text-gray-600">{label}</div>
      <div className="h-2 rounded bg-gray-200">
        <div
          className={`h-2 rounded ${usageColour(value)}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-gray-500">{percent ?? "—"}</div>
    </div>
  );
}

export default function ContainerTable({
  title,
  containers,
  onViewLogs,
  onInspect,
}: {
  title: string;
  containers: ContainerStatus[];
  onViewLogs?: (name: string) => void;
  onInspect?: (name: string) => void;
}) {
  return (
    <div className="mt-6 rounded-lg border bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left">Container</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Health</th>
            <th className="px-4 py-3 text-left">CPU</th>
            <th className="px-4 py-3 text-left">Memory</th>
            <th className="px-4 py-3 text-left">Ports</th>
            <th className="px-4 py-3 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {containers.map((c) => (
            <tr key={c.name} className="border-t hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3">{c.status}</td>
              <td className="px-4 py-3">
                <HealthBadge {...c} />
              </td>

              <td className="px-4 py-3">
                <UsageBar label={c.cpu ?? "—"} percent={c.cpu} />
              </td>

              <td className="px-4 py-3">
                <UsageBar label={c.memory ?? "—"} percent={c.memoryPercent} />
              </td>

              <td className="px-4 py-3 text-gray-500">{c.ports || "—"}</td>

              <td className="px-4 py-3 text-center">
                <div className="flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewLogs?.(c.name)}
                    className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    Logs
                  </button>

                  <button
                    type="button"
                    onClick={() => onInspect?.(c.name)}
                    className="rounded border px-2 py-1 text-xs text-gray-700 hover:bg-gray-100"
                  >
                    Inspect
                  </button>

                  <RestartContainerButton name={c.name} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}