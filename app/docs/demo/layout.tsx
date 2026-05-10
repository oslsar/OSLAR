import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/demo/tour", label: "Tour" },
  { href: "/demo/browse", label: "Browse" },
  { href: "/demo/tailoring", label: "Tailoring" },
  { href: "/demo/standards", label: "Standards" },
  { href: "/demo/query", label: "Query" },
  { href: "/demo/exports", label: "Exports" },
  { href: "/demo/supdb/item-master", label: "Supdb" },
  { href: "/demo/help", label: "Help" },
];

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white text-gray-900">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-gray-50">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            OSLAR
          </div>
          <div className="mt-1 text-sm font-semibold">
            Live Demo Environment
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-white hover:shadow-sm"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-gray-200 px-6 py-4 text-xs text-gray-500">
          <div>Schema v0.1</div>
          <div>Demo dataset</div>
        </div>
      </aside>

      {/* Main + AI Column */}
      <div className="flex flex-1">
        {/* Main Content */}
        <div className="flex-1">
          <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">Demo</div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  Read-only
                </span>
              </div>

              <Link
                href="/contact"
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-black"
              >
                Book walkthrough
              </Link>
            </div>
          </header>

          <main className="px-8 py-8">{children}</main>
        </div>

        {/* AI Drawer (UI only for now) */}
        <aside className="hidden w-80 border-l border-gray-200 bg-white xl:flex xl:flex-col">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="text-sm font-semibold">Ask OSLAR</div>
            <div className="text-xs text-gray-500">
              Demo-scoped assistant
            </div>
          </div>

          <div className="flex-1 p-5 text-sm text-gray-500">
            AI assistant UI placeholder.
          </div>
        </aside>
      </div>
    </div>
  );
}
