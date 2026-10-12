"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { listQueryString, type ListCriteria, type ListField } from "@/lib/compiler/list-query";

export default function ListControls({ path, criteria, searchable, fields }: {
  path: string; criteria: ListCriteria; searchable: boolean; fields: ListField[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState(criteria.search);
  const [filters, setFilters] = useState(criteria.filters);
  const [adding, setAdding] = useState("");
  const active = Boolean(criteria.search || criteria.filters.length);
  function apply(event: FormEvent) {
    event.preventDefault();
    router.push(path + listQueryString({ search: search.trim(), filters: filters.map(f => ({ ...f, value: f.value.trim() })).filter(f => f.value), page: 1 }));
  }
  if (!searchable && !fields.length && !active) return null;
  return (
    <form onSubmit={apply} aria-label="List search and filters" className="mt-4 space-y-3 rounded-md border border-gray-200 bg-gray-50 p-4">
      {searchable && <label className="block text-sm font-medium text-gray-700">
        Search
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} className="ml-3 rounded-md border border-gray-300 bg-white px-3 py-2" />
      </label>}
      {fields.length > 0 && <details open={filters.length > 0 || undefined}>
        <summary className="cursor-pointer text-sm font-medium text-gray-700">Filters{filters.length ? ` (${filters.length})` : ""}</summary>
        <div className="mt-3 space-y-3">
          {filters.map(filter => {
            const field = fields.find(f => f.column === filter.column)!;
            const change = (value: string) => setFilters(current => current.map(f => f.column === field.column ? { ...f, value } : f));
            return <div key={field.column} className="flex flex-wrap items-center gap-3">
              <label className="text-sm text-gray-700">{field.label}
                {field.kind === "boolean" ? <select aria-label={field.label} value={filter.value} onChange={e => change(e.target.value)} className="ml-3 rounded border p-2">
                  <option value="">Any</option><option value="true">True</option><option value="false">False</option>
                </select> : <input aria-label={field.label} type="text" inputMode={field.kind === "integer" ? "numeric" : field.kind === "numeric" ? "decimal" : "text"} value={filter.value} onChange={e => change(e.target.value)} className="ml-3 rounded border p-2" />}
              </label>
              <span className="text-xs text-gray-500">{field.kind === "text" ? "contains" : "equals"}</span>
              <button type="button" onClick={() => setFilters(current => current.filter(f => f.column !== field.column))} className="text-sm text-blue-700">Remove {field.label}</button>
            </div>;
          })}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm text-gray-700">Filter field
              <select aria-label="Filter field" value={adding} onChange={e => setAdding(e.target.value)} className="ml-3 max-w-xs rounded border p-2">
                <option value="">Choose a field</option>
                {fields.filter(f => !filters.some(filter => filter.column === f.column)).map(f => <option key={f.column} value={f.column}>{f.label}</option>)}
              </select>
            </label>
            <button type="button" disabled={!adding} onClick={() => { setFilters(current => [...current, { column: adding, value: "" }]); setAdding(""); }} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Add filter</button>
          </div>
        </div>
      </details>}
      <div className="flex gap-3">
        <button type="submit" className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white">Apply search and filters</button>
        {active && <a href={path} className="px-3 py-2 text-sm text-blue-700">Clear search and filters</a>}
      </div>
    </form>
  );
}
