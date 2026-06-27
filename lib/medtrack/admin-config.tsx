import type { DataTableColumn } from "@/components/medtrack/data-table";
import {
  doseLogsAdminColumns,
  schedulesAdminColumns,
  itemsAdminColumns,
} from "@/lib/medtrack/table-config";

export type AdminTableConfig = {
  title: string;
  query: string;
  columns: DataTableColumn<any>[];
};

export const adminTables: Record<string, AdminTableConfig> = {
  "dose-logs": {
    title: "Admin - Dose Logs",
    query: `
      select
        dl.id,
        i.name as item_name,
        dl.status,
        dl.scheduled_at,
        dl.taken_at,
        dl.dose_amount,
        dl.notes,
        dl.created_at
      from medtrack.dose_logs dl
      join medtrack.items i
        on i.id = dl.item_id
      order by dl.created_at desc
      limit 200
    `,
    columns: doseLogsAdminColumns,
  },

  schedules: {
    title: "Admin - Schedules",
    query: `
      select
        s.id,
        i.name as item_name,
        s.frequency_type,
        s.times_json,
        s.interval_hours,
        s.instructions,
        s.active,
        s.created_at
      from medtrack.schedules s
      join medtrack.items i
        on i.id = s.item_id
      order by s.created_at desc
      limit 200
    `,
    columns: schedulesAdminColumns,
  },

  items: {
    title: "Admin - Items",
    query: `
      select
        id,
        name,
        kind,
        strength,
        form,
        notes,
        active,
        created_at
      from medtrack.items
      order by name
      limit 200
    `,
    columns: itemsAdminColumns,
  },

};
