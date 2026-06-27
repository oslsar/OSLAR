import Link from "next/link";
import type { DataTableColumn } from "@/components/medtrack/data-table";
import DeleteButton from "@/components/medtrack/delete-button";

export type DoseLogAdminRow = {
  id: string;
  item_name: string;
  status: string;
  taken_at: string | null;
  dose_amount: string | null;
  notes: string | null;
  created_at: string | null;
};

export const doseLogsAdminColumns: DataTableColumn<DoseLogAdminRow>[] = [
  { key: "item_name", label: "Item", sortable: true  },
  { key: "status", label: "Status", sortable: true  },
  {
    key: "taken_at",
    label: "Taken At",
    render: (r) =>
      r.taken_at ? new Date(r.taken_at).toLocaleString() : "",
  },
  { key: "dose_amount", label: "Dose" },
  { key: "notes", label: "Notes" },
  {
    key: "created_at",
    label: "Created",
    render: (r) =>
      r.created_at ? new Date(r.created_at).toLocaleString() : "",
  },
  {
    key: "edit",
    label: "Edit",
    render: (r) => (
      <Link href={`/demo/med-track/history/${r.id}/edit`}>
        Edit
      </Link>
    ),
  },
  {
    key: "delete",
    label: "Delete",
    render: (r) => (
      <form method="POST" action={`/demo/med-track/api/logs/${r.id}/delete`}>
        <DeleteButton message="Delete this dose log?" />
      </form>
    ),
  },
];

export type ScheduleAdminRow = {
  id: string;
  item_name: string;
  frequency_type: string;
  times_json: string[] | null;
  interval_hours: number | null;
  instructions: string | null;
  active: boolean;
  created_at: string | null;
};

export const schedulesAdminColumns: DataTableColumn<ScheduleAdminRow>[] = [
  { key: "item_name", label: "Item" },
  { key: "frequency_type", label: "Frequency" },
  {
    key: "times_json",
    label: "Times",
    render: (r) => r.times_json ? JSON.stringify(r.times_json) : "",
  },
  { key: "interval_hours", label: "Interval Hours" },
  { key: "instructions", label: "Instructions" },
  {
    key: "active",
    label: "Active",
    render: (r) => (r.active ? "Yes" : "No"),
  },
  {
    key: "edit",
    label: "Edit",
    render: (r) => (
      <Link href={`/demo/med-track/schedules/${r.id}/edit`}>
        Edit
      </Link>
    ),
  },
  {
    key: "delete",
    label: "Delete",
    render: (r) => (
      <form
        method="POST"
        action={`/demo/med-track/api/schedules/${r.id}/delete`}
      >
        <DeleteButton message="Delete this schedule?" />
      </form>
    ),
  },
];

export type ItemAdminRow = {
  id: string;
  name: string;
  kind: string;
  strength: string | null;
  form: string | null;
  notes: string | null;
  active: boolean;
  created_at: string | null;
};

export const itemsAdminColumns: DataTableColumn<ItemAdminRow>[] = [
  { key: "name", label: "Name", sortable: true  },
  { key: "kind", label: "Kind", sortable: true  },
  { key: "strength", label: "Strength", sortable: true  },
  { key: "form", label: "Form", sortable: true  },
  { key: "notes", label: "Notes", sortable: true  },
  {
    key: "active",
    label: "Active",
    render: (r) => (r.active ? "Yes" : "No"),
  },
  {
    key: "edit",
    label: "Edit",
    render: (r) => (
      <Link href={`/demo/med-track/items/${r.id}/edit`}>
        Edit
      </Link>
    ),
  },
  {
    key: "delete",
    label: "Delete",
    render: (r) => (
      <form
        method="POST"
        action={`/demo/med-track/api/items/${r.id}/delete`}
      >
        <DeleteButton message="Delete this item?" />
      </form>
    ),
  },
];
