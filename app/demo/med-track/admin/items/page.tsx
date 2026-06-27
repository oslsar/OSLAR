import Link from "next/link";
import AppShell from "@/components/medtrack/app-shell";
import PageHeader from "@/components/medtrack/page-header";
import Button from "@/components/medtrack/button";
import Alert from "@/components/medtrack/alert";
import { pool } from "@/lib/medtrack/db";
import SelectAllCheckbox from "@/components/medtrack/select-all-checkbox";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
    name?: string;
    kind?: string;
    active?: string;
    sort?: string;
    dir?: string;
    page?: string;
    pageSize?: string;
  }>;
}) {
  const params = await searchParams;

  const result = await pool.query(`
    select
      id,
      name,
      kind,
      strength,
      form,
      notes,
      active
    from medtrack.items
    order by name
  `);

  let items = result.rows;

  const nameFilter = (params.name || "").toLowerCase();
  const kindFilter = (params.kind || "").toLowerCase();
  const activeFilter = params.active || "";
  const allowedSorts = ["name", "kind", "strength", "form", "notes", "active"];
  const sort = allowedSorts.includes(params.sort || "")
    ? params.sort || "name"
    : "name";
  const dir = params.dir === "desc" ? "desc" : "asc";
  const page = Number(params.page || 1);
  const pageSize = Number(params.pageSize || 10);
  

  items = items.filter((item: any) => {
    const matchesName =
      !nameFilter ||
      String(item.name || "")
        .toLowerCase()
        .includes(nameFilter);

    const matchesKind =
      !kindFilter ||
      String(item.kind || "")
        .toLowerCase()
        .includes(kindFilter);

    const matchesActive =
      !activeFilter ||
      (activeFilter === "yes" && item.active === true) ||
      (activeFilter === "no" && item.active === false);

    return matchesName && matchesKind && matchesActive;
  });

  items = [...items].sort((a: any, b: any) => {
    const av = a[sort] ?? "";
    const bv = b[sort] ?? "";

    const result = String(av).localeCompare(String(bv), undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return dir === "desc" ? -result : result;
  });

  const totalRows = items.length;

  const pagedItems = items.slice((page - 1) * pageSize, page * pageSize);

  const startRow = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;

  const endRow = Math.min(page * pageSize, totalRows);

  const tableInputStyle = {
    width: "95%",
    padding: "8px 10px",
    border: "1px solid #cfd4da",
    borderRadius: 6,
    backgroundColor: "#fff",
  };

  return (
    <AppShell current="admin">
      <PageHeader
        title="Admin - Items Inline Edit"
        backHref="/demo/med-track/admin"
        backLabel="Admin Home"
      />

      {params.success === "updated" && (
        <Alert variant="success">&#10003; Item updated successfully</Alert>
      )}

      {params.success === "bulk-updated" && (
        <Alert variant="success">
          &#10003; Selected items updated successfully
        </Alert>
      )}

      {params.error === "no-selection" && (
        <Alert variant="danger">Please select at least one item.</Alert>
      )}

      <form
        method="GET"
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <select
          name="pageSize"
          defaultValue={String(pageSize)}
          style={{
            padding: "8px 10px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>

        <Button type="submit" variant="primary">
          Apply
        </Button>

        <input type="hidden" name="name" value={params.name || ""} />
        <input type="hidden" name="kind" value={params.kind || ""} />
        <input type="hidden" name="active" value={params.active || ""} />
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <input type="hidden" name="page" value="1" />

        {(params.name || params.kind || params.active) && (
          <Link href={`/demo/med-track/admin/items?pageSize=${pageSize}`}>
            Clear
          </Link>
        )}
      </form>

      <form
        id="bulk-items-form"
        method="POST"
        action="/demo/med-track/api/admin/items/bulk"
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 12,
          alignItems: "center",
        }}
      >
        <Button
          type="submit"
          variant="success"
          form="bulk-items-form"
          name="action"
          value="activate"
        >
          Activate Selected
        </Button>

        <Button
          type="submit"
          variant="secondary"
          form="bulk-items-form"
          name="action"
          value="deactivate"
        >
          Deactivate Selected
        </Button>

        <Button
          type="submit"
          variant="danger"
          form="bulk-items-form"
          name="action"
          value="delete"
        >
          Delete Selected
        </Button>
      </form>

      <div
        style={{
          marginBottom: 10,
          color: "#666",
          fontSize: 14,
        }}
      >
        Showing {startRow}-{endRow} of {totalRows} items | Page {page} of{" "}
        {Math.max(1, Math.ceil(totalRows / pageSize))}
      </div>

      <table
        style={{
          borderCollapse: "collapse",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <thead>
          <tr>
            {[
              { label: <SelectAllCheckbox />, key: "select", sortable: false },
              { label: "Name", key: "name", sortable: true },
              { label: "Kind", key: "kind", sortable: true },
              { label: "Strength", key: "strength", sortable: true },
              { label: "Form", key: "form", sortable: true },
              { label: "Notes", key: "notes", sortable: true },
              { label: "Active", key: "active", sortable: true },
              { label: "Actions", key: "save", sortable: false },
              { label: "Full Edit", key: "edit", sortable: false },
            ].map((h) => {
              const isActive = sort === h.key;
              const nextDir = isActive && dir === "asc" ? "desc" : "asc";

              const paramsForSort = new URLSearchParams();

              if (params.name) paramsForSort.set("name", params.name);
              if (params.kind) paramsForSort.set("kind", params.kind);
              if (params.active) paramsForSort.set("active", params.active);
              paramsForSort.set("pageSize", String(pageSize));

              paramsForSort.set("sort", h.key);
              paramsForSort.set("dir", nextDir);

              return (
                <th
                  key={h.key}
                  style={{
                    textAlign: h.key === "select" ? "center" : "left",
                    width: h.key === "select" ? 40 : undefined,
                    padding: "10px 8px",
                    backgroundColor: isActive ? "#eef5ff" : "#f1f3f5",
                    borderBottom: "2px solid #d0d7de",
                  }}
                >
                  {h.sortable ? (
                    <Link
                      href={`/demo/med-track/admin/items?${paramsForSort.toString()}`}
                      style={{
                        color: "#0d6efd",
                        textDecoration: "none",
                        fontWeight: isActive ? 700 : 600,
                      }}
                    >
                      {h.label}
                      {isActive && (
                        <span style={{ marginLeft: 4 }}>
                          {dir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </Link>
                  ) : (
                    h.label
                  )}
                </th>
              );
            })}
          </tr>
          <tr>
            <th
              style={{
                padding: 8,
                backgroundColor: "#fff3cd",
                fontWeight: 600,
                textAlign: "center",
                verticalAlign: "middle",
                minWidth: 80,
                color: "#856404",
              }}
            >
              Filter
            </th>

            <th style={{ padding: 8, backgroundColor: "#fff3cd" }}>
              <form id="admin-items-filter-form" method="GET" />
              <input
                type="hidden"
                form="admin-items-filter-form"
                name="sort"
                value={sort}
              />
              <input
                type="hidden"
                form="admin-items-filter-form"
                name="dir"
                value={dir}
              />
              <input
                type="hidden"
                form="admin-items-filter-form"
                name="page"
                value="1"
              />
              <input
                type="hidden"
                form="admin-items-filter-form"
                name="pageSize"
                value={String(pageSize)}
              />

              <input
                form="admin-items-filter-form"
                name="name"
                defaultValue={params.name || ""}
                placeholder="Filter name..."
                style={tableInputStyle}
              />
            </th>

            <th style={{ padding: 8, backgroundColor: "#fff3cd" }}>
              <input
                form="admin-items-filter-form"
                name="kind"
                defaultValue={params.kind || ""}
                placeholder="Filter kind..."
                style={tableInputStyle}
              />
            </th>

            <th style={{ padding: 8, backgroundColor: "#fff3cd" }} />
            <th style={{ padding: 8, backgroundColor: "#fff3cd" }} />
            <th style={{ padding: 8, backgroundColor: "#fff3cd" }} />

            <th
              style={{
                padding: 8,
                backgroundColor: "#fff3cd",
                width: 120,
              }}
            >

              <select
                form="admin-items-filter-form"
                name="active"
                defaultValue={params.active || ""}
                style={{
                  ...tableInputStyle,
                  width: "110px",
                }}
              >
                <option value="">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </th>

            <th style={{ padding: 8, backgroundColor: "#fff3cd" }}>
              <Button
                type="submit"
                variant="primary"
                form="admin-items-filter-form"
              >
                Filter
              </Button>
            </th>

            <th style={{ padding: 8, backgroundColor: "#fff3cd" }}>
              {(params.name || params.kind || params.active) && (
                <Link href={`/demo/med-track/admin/items?pageSize=${pageSize}`}>
                  Clear
                </Link>
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr style={{ backgroundColor: "#e8f8e8" }}>
            <td
              style={{
                padding: 8,
                backgroundColor: "#e8f8e8",
                fontWeight: 600,
                textAlign: "center",
                color: "#2e7d32",
              }}
            >
              New
            </td>
            <td style={{ padding: 8 }}>
              <form
                id="new-item-form"
                method="POST"
                action="/demo/med-track/api/admin/items"
              />
              <input
                form="new-item-form"
                name="name"
                style={tableInputStyle}
                placeholder="New item name..."
              />
            </td>

            <td style={{ padding: 8 }}>
              <select
                form="new-item-form"
                name="kind"
                style={tableInputStyle}
                defaultValue="supplement"
              >
                <option value="supplement">supplement</option>
                <option value="medicine">medicine</option>
              </select>
            </td>

            <td style={{ padding: 8 }}>
              <input
                form="new-item-form"
                name="strength"
                placeholder="e.g. 500mg"
                style={tableInputStyle}
              />
            </td>

            <td style={{ padding: 8 }}>
              <input
                form="new-item-form"
                name="form"
                placeholder="capsule/tablet"
                style={tableInputStyle}
              />
            </td>

            <td style={{ padding: 8, minWidth: 250 }}>
              <input
                form="new-item-form"
                name="notes"
                style={tableInputStyle}
              />
            </td>

            <td style={{ padding: 8 }}>
              <input
                form="new-item-form"
                type="checkbox"
                name="active"
                defaultChecked
              />
            </td>

            <td style={{ padding: 8 }}>
              <Button type="submit" variant="success" form="new-item-form">
                Add
              </Button>
            </td>

            <td style={{ padding: 8 }} />
          </tr>
          {pagedItems.map((item: any, index: number) => (
            <tr
              key={item.id}
              style={{
                backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
              }}
            >
              <td
                style={{
                  padding: 8,
                  textAlign: "center",
                  width: 40,
                }}
              >
                <input
                  type="checkbox"
                  name="item_ids"
                  value={item.id}
                  form="bulk-items-form"
                />
              </td>

              <td style={{ padding: 8 }}>
                <form
                  id={`item-form-${item.id}`}
                  method="POST"
                  action={`/demo/med-track/api/admin/items/${item.id}`}
                />
                <input
                  form={`item-form-${item.id}`}
                  name="name"
                  defaultValue={item.name || ""}
                />
              </td>

              <td style={{ padding: 8 }}>
                <select
                  form={`item-form-${item.id}`}
                  name="kind"
                  defaultValue={item.kind || "supplement"}
                >
                  <option value="supplement">supplement</option>
                  <option value="medicine">medicine</option>
                </select>
              </td>

              <td style={{ padding: 8 }}>
                <input
                  form={`item-form-${item.id}`}
                  name="strength"
                  defaultValue={item.strength || ""}
                />
              </td>

              <td style={{ padding: 8 }}>
                <input
                  form={`item-form-${item.id}`}
                  name="form"
                  defaultValue={item.form || ""}
                />
              </td>

              <td style={{ padding: 8 }}>
                <input
                  form={`item-form-${item.id}`}
                  name="notes"
                  defaultValue={item.notes || ""}
                />
              </td>

              <td style={{ padding: 8 }}>
                <input
                  form={`item-form-${item.id}`}
                  type="checkbox"
                  name="active"
                  defaultChecked={item.active}
                />
              </td>

              <td style={{ padding: 8 }}>
                <Button
                  type="submit"
                  variant="primary"
                  form={`item-form-${item.id}`}
                >
                  Save
                </Button>
              </td>

              <td style={{ padding: 8 }}>
                <Link href={`/demo/med-track/items/${item.id}/edit`}>Edit</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalRows > pageSize && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          {page > 1 ? (
            <Link
              href={`/demo/med-track/admin/items?${new URLSearchParams({
                ...(params.name ? { name: params.name } : {}),
                ...(params.kind ? { kind: params.kind } : {}),
                ...(params.active ? { active: params.active } : {}),
                sort,
                dir,
                page: String(page - 1),
                pageSize: String(pageSize),
              }).toString()}`}
            >
              &larr; Previous
            </Link>
          ) : (
            <span style={{ color: "#999" }}>&larr; Previous</span>
          )}

          <strong>
            Page {page} of {Math.ceil(totalRows / pageSize)}
          </strong>

          {page < Math.ceil(totalRows / pageSize) ? (
            <Link
              href={`/demo/med-track/admin/items?${new URLSearchParams({
                ...(params.name ? { name: params.name } : {}),
                ...(params.kind ? { kind: params.kind } : {}),
                ...(params.active ? { active: params.active } : {}),
                sort,
                dir,
                page: String(page + 1),
                pageSize: String(pageSize),
              }).toString()}`}
            >
              Next &rarr;
            </Link>
          ) : (
            <span style={{ color: "#999" }}>Next &rarr;</span>
          )}
        </div>
      )}
    </AppShell>
  );
}
