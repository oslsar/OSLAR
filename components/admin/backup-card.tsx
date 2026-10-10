import BackupNowButton from "./backup-now-button";
import { formatLocalDateTime } from "@/lib/date-format";

type Backup = {
  file: string;
  modified: string;
  sizeBytes: number;
} | null;

export default function BackupCard({ backup }: { backup: Backup }) {
  return (
    <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Latest Backup</h2>
          <BackupNowButton />
      </div>

      {backup ? (
        <div className="space-y-1 text-sm">
          <div className="font-medium text-gray-900">{backup.file}</div>
          <div className="text-gray-500">
            Modified {formatLocalDateTime(backup.modified)}
          </div>
          <div className="text-gray-500">
            Size {(backup.sizeBytes / 1024).toFixed(1)} KB
          </div>
        </div>
      ) : (
        <div className="text-sm text-red-700">No backup found.</div>
      )}
    </div>
  );
}
