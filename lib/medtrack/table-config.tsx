import Link from "next/link";
import type { DataTableColumn } from "@/components/medtrack/data-table";

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
  { key: "item_name", label: "Item" },
  { key: "status", label: "Status" },
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
];
