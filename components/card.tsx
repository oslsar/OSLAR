export function Card({ title, body, href }: { title: string; body: string; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-zinc-200 p-5 shadow-sm hover:border-zinc-300">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-2 text-sm text-zinc-600">{body}</div>
    </div>
  );
  return href ? (
    <a className="no-underline" href={href}>
      {content}
    </a>
  ) : (
    content
  );
}
