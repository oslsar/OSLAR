export default function SystemBanner({ updatedAt }: { updatedAt: string }) {
  return (
    <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
      <div className="text-lg font-semibold text-green-800">
        🟢 All Systems Operational
      </div>
      <div className="mt-1 text-sm text-green-700">
        Updated {new Date(updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
