import type { CompilerGuiField, CompilerPreview } from "@/lib/compiler/types";

export type ListFilter = { column: string; value: string };
export type ListCriteria = { search: string; filters: ListFilter[]; page: number };
export type ListSearchParams = Record<string, string | string[] | undefined>;
export type ListField = { column: string; label: string; kind: "text" | "numeric" | "integer" | "boolean" };

export function quoteListIdentifier(value: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) throw new Error("Unsafe database identifier");
  return `"${value}"`;
}

function fieldKind(field: CompilerGuiField): ListField["kind"] | null {
  const spec = field.formatSpec?.trim().toLowerCase() ?? "";
  if (/^(string|char|varchar|text)/.test(spec)) return "text";
  if (/^(integer|int|number|smallint|bigint)/.test(spec)) return "integer";
  if (/^(numeric|decimal)/.test(spec)) return "numeric";
  if (/^(boolean|bool)/.test(spec)) return "boolean";
  return null;
}

export function listCapabilities(preview: CompilerPreview) {
  const approved = new Set(preview.fields.filter(f => f.included && !f.deprecated && !f.behavior.hidden).map(f => f.columnName));
  const fields = preview.gui.generatedFields.filter(f => approved.has(f.columnName) && /^[A-Za-z_][A-Za-z0-9_]*$/.test(f.columnName));
  const configured = new Set(preview.behavior?.defaultSearchColumns ?? []);
  return {
    searchColumns: fields.filter(f => configured.has(f.columnName) && f.searchable && fieldKind(f) === "text").map(f => f.columnName),
    filterFields: fields.flatMap(f => {
      const kind = fieldKind(f);
      return f.filterable && kind ? [{ column: f.columnName, label: f.label, kind }] : [];
    }),
  };
}

export function normalizeListCriteria(preview: CompilerPreview, params: ListSearchParams): ListCriteria {
  const capabilities = listCapabilities(preview);
  const single = (value: string | string[] | undefined) => typeof value === "string" ? value.trim() : "";
  const filters: ListFilter[] = [];
  for (const field of capabilities.filterFields) {
    const value = single(params[`filter.${field.column}`]);
    if (!value || value.length > 1000) continue;
    if (field.kind === "integer" && (!/^[+-]?\d+$/.test(value) || value.length > 200)) continue;
    if (field.kind === "numeric" && (!/^[+-]?\d+(?:\.\d+)?$/.test(value) || value.length > 200)) continue;
    if (field.kind === "boolean" && !["true", "false"].includes(value)) continue;
    filters.push({ column: field.column, value });
  }
  const rawPage = single(params.page);
  const page = /^\d+$/.test(rawPage) && Number.isSafeInteger(Number(rawPage)) && Number(rawPage) > 0 ? Number(rawPage) : 1;
  return { search: capabilities.searchColumns.length ? single(params.q).slice(0, 1000) : "", filters, page };
}

export function listQueryString(criteria: ListCriteria, page = criteria.page): string {
  const params = new URLSearchParams();
  if (criteria.search) params.set("q", criteria.search);
  for (const filter of criteria.filters) if (filter.value) params.set(`filter.${filter.column}`, filter.value);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `?${query}` : "";
}

/** Values are bound; identifiers are resolved exclusively from approved metadata. */
export function listPredicate(preview: CompilerPreview, requested: ListCriteria) {
  const params: ListSearchParams = { q: requested.search };
  for (const filter of requested.filters) params[`filter.${filter.column}`] = filter.value;
  const criteria = normalizeListCriteria(preview, params);
  const { searchColumns, filterFields } = listCapabilities(preview);
  const values: Array<string | boolean> = [];
  const clauses: string[] = [];
  const contains = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
  if (criteria.search) {
    values.push(contains(criteria.search));
    clauses.push(`(${searchColumns.map(column => `${quoteListIdentifier(column)} ILIKE $${values.length}`).join(" OR ")})`);
  }
  for (const filter of criteria.filters) {
    const field = filterFields.find(f => f.column === filter.column)!;
    const column = quoteListIdentifier(field.column);
    values.push(field.kind === "text" ? contains(filter.value) : field.kind === "boolean" ? filter.value === "true" : filter.value);
    clauses.push(field.kind === "text" ? `${column} ILIKE $${values.length}` : `${column} = $${values.length}::${field.kind === "boolean" ? "boolean" : "numeric"}`);
  }
  return { sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "", values };
}
