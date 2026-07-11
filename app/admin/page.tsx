import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import type { ContainerStatus } from "@/components/admin/container-table";
import OperationsDashboardClient from "@/components/admin/operations-dashboard-client";
import StatusBadge from "@/components/admin/status-badge";
import SummaryCard from "@/components/admin/summary-card";
import BackupCard from "@/components/admin/backup-card";
import SystemBanner from "@/components/admin/system-banner";
import ServerOverview from "@/components/admin/server-overview";
import DatabaseOverview from "@/components/admin/database-overview";
import { getAdminAgentUrl } from "@/lib/admin-agent";

export const dynamic = "force-dynamic";

type AdminStatus = {
  ok: boolean;
  generatedAt: string;
  containers: ContainerStatus[];
  dockerDisk: string;
  postgres: {
    development: boolean;
    production: boolean;
  };
  latestBackup: {
    file: string;
    modified: string;
    sizeBytes: number;
  } | null;
  disk: {
    size: string;
    used: string;
    available: string;
    percent: string;
  };
  memory: {
    total: string;
    used: string;
    available: string;
  };
  postgresStats: {
    development: {
      container: string;
      version: string;
      size: string;
      connections: string;
      schemas: string;
      tables: string;
      indexes: string;
    };
    production: {
      container: string;
      version: string;
      size: string;
      connections: string;
      schemas: string;
      tables: string;
      indexes: string;
    };
  };

  metrics: {
    name: string;
    cpu: string;
    memory: string;
    memoryPercent: string;
  }[];
};

async function getStatus(): Promise<AdminStatus | null> {
  try {
    const res = await fetch(getAdminAgentUrl("/health"), {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminPage() {
  const status = await getStatus();

  if (!status) {
    return (
      <AppShell>
        <PageHeader title="Administration" description="OSLAR Operations Center." />
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
          OSLAR Agent is unavailable.
        </div>
      </AppShell>
    );
  }

  const metrics = new Map(status.metrics.map((m) => [m.name, m]));

  const containers = status.containers.map((container) => ({
    ...container,
    ...metrics.get(container.name),
  }));

  const devContainers = containers.filter((c) =>
    c.name.startsWith("oslar-dev-")
  );

  const prodContainers = containers.filter(
    (c) => c.name.startsWith("oslar-") && !c.name.startsWith("oslar-dev-")
  );

  const infraContainers = containers.filter(
    (c) => !c.name.startsWith("oslar-dev-") && !c.name.startsWith("oslar-")
  );

  const devHealthy = devContainers.every((c) => c.running);
  const prodHealthy = prodContainers.every((c) => c.running);

  return (
    <AppShell>
      <PageHeader
        title="Administration"
        description="Live OSLAR Operations Center for Docker, PostgreSQL, backups and server health."
      />

      <SystemBanner updatedAt={status.generatedAt} />

      <div className="grid gap-4 lg:grid-cols-4">
        <SummaryCard title="Development" icon="DEV" tone="blue">
          <StatusBadge
            label={devHealthy ? `${devContainers.length}/${devContainers.length} Running` : "Issue"}
            colour={devHealthy ? "green" : "red"}
          />
        </SummaryCard>

        <SummaryCard title="Production" icon="PROD" tone="green">
          <StatusBadge
            label={prodHealthy ? `${prodContainers.length}/${prodContainers.length} Running` : "Issue"}
            colour={prodHealthy ? "green" : "red"}
          />
        </SummaryCard>

        <SummaryCard
          title="Disk"
          icon="DISK"
          tone="purple"
          value={status.disk.percent}
          subtitle={`${status.disk.used} used of ${status.disk.size}`}
        />

        <SummaryCard
          title="Memory"
          icon="RAM"
          tone="orange"
          value={status.memory.available}
          subtitle={`${status.memory.used} used of ${status.memory.total}`}
        />
      </div>

      <ServerOverview
        disk={status.disk}
        memory={status.memory}
        dockerDisk={status.dockerDisk}
      />

      <DatabaseOverview
        development={status.postgresStats.development}
        production={status.postgresStats.production}
      />

      <BackupCard backup={status.latestBackup} />

      <OperationsDashboardClient
        devContainers={devContainers}
        prodContainers={prodContainers}
        infraContainers={infraContainers}
      />
    </AppShell>
  );
}