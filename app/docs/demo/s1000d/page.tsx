export default function Page() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">S1000D Viewer</h1>
      <p className="mt-4">Test DM:</p>
      <a
        className="text-blue-600 underline"
        href="/demo/s1000d/dm/DMC-OSLAR-A-12-34-56-00-00A-720A-D"
      >
        Open Demo DM
      </a>
      <p className="mt-6">Test PM:</p>
      <a
        className="text-blue-600 underline"
        href="/demo/s1000d/pm/PMC-OSLAR-DEMO-0001"
      >
        Open Demo PM
      </a>
    </div>
  );
}
