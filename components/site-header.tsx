import Link from "next/link";

const nav = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Product" },
  { href: "/standards", label: "Standards" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="border-b border-zinc-200">
      <div className="container flex items-center justify-between py-4">
        <Link href="/" className="no-underline">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-zinc-900" aria-hidden />
            <div className="leading-tight">
              <div className="text-sm font-semibold">OSLAR</div>
              <div className="text-xs text-zinc-500">PostgreSQL-first LSAR modernization</div>
            </div>
          </div>
        </Link>

        <nav className="hidden gap-5 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="no-underline text-zinc-700 hover:text-zinc-900">
              {n.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/contact"
          className="no-underline rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Request a pilot
        </Link>
      </div>

      <div className="container pb-4 md:hidden">
        <div className="flex flex-wrap gap-3 text-sm">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="no-underline text-zinc-700 hover:text-zinc-900">
              {n.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
