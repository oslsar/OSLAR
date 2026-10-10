type ServerOverviewProps = {
  disk: {
    used: string;
    size: string;
    percent: string;
  };
  memory: {
    used: string;
    total: string;
    available: string;
  };
  dockerDisk: string;
};

function percentNumber(value?: string) {
  if (!value) return 0;
  return Number(value.replace("%", "")) || 0;
}

function Bar({ label, value, detail }: { label: string; value: string; detail: string }) {
  const percent = percentNumber(value);

  const colour =
    percent >= 90
      ? "bg-red-500"
      : percent >= 70
        ? "bg-orange-500"
        : percent >= 50
          ? "bg-yellow-500"
          : "bg-green-500";

  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">{value}</span>
      </div>
      <div className="h-2 rounded bg-gray-200">
        <div className={`h-2 rounded ${colour}`} style={{ width: `${Math.min(percent, 100)}%` }} />
      </div>
      <div className="mt-1 text-xs text-gray-500">{detail}</div>
    </div>
  );
}

export default function ServerOverview({ disk, memory, dockerDisk }: ServerOverviewProps) {
  const memoryPercent = `${Math.round(
    (parseFloat(memory.used) / parseFloat(memory.total)) * 100
  )}%`;

  return (
    <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">🖥 Server Overview</h2>

      <div className="grid gap-5 lg:grid-cols-3">
        <Bar label="Disk" value={disk.percent} detail={`${disk.used} used of ${disk.size}`} />

        <Bar
          label="Memory"
          value={memoryPercent}
          detail={`${memory.used} used of ${memory.total}, ${memory.available} available`}
        />

        <div>
          <div className="mb-1 text-sm font-medium">Docker Storage</div>
          <pre className="max-h-28 overflow-auto rounded bg-gray-950 p-3 text-xs text-green-300">
            {dockerDisk}
          </pre>
        </div>
      </div>
    </div>
  );
}
