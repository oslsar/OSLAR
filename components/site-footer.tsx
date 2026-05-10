export default function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200">
      <div className="container py-8 text-sm text-zinc-600">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>© 2026 OSLAR Contributors</div>
          <div className="flex gap-4">
            <a href="/standards">Standards</a>
            <a href="/docs">Docs</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
        <div className="mt-3 text-xs text-zinc-500">
          OSLAR does not redistribute proprietary standards. Users must obtain licensed copies of applicable standards.
        </div>
      </div>
    </footer>
  );
}
