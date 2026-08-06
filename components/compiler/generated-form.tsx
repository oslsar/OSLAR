"use client";

import { useMemo, useState } from "react";
import LookupField from "@/components/compiler/lookup-field";
import type {
  CompilerForm,
  CompilerGuiField,
} from "@/lib/compiler/types";

type GeneratedFormProps = {
  form: CompilerForm;
};

function gridClassForColumns(columnCount: number): string {
  switch (columnCount) {
    case 1:
      return "grid-cols-1";
    case 3:
      return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";
    case 4:
      return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";
    case 2:
    default:
      return "grid-cols-1 md:grid-cols-2";
  }
}

function gridClassForSpan(columnSpan: number): string {
  switch (columnSpan) {
    case 2:
      return "md:col-span-2";
    case 3:
      return "md:col-span-2 xl:col-span-3";
    case 4:
      return "md:col-span-2 xl:col-span-4";
    case 1:
    default:
      return "";
  }
}

function stringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export default function GeneratedForm({
  form,
}: GeneratedFormProps) {
  const initialValues = useMemo(() => {
    const values: Record<string, unknown> = {};

    for (const section of form.sections) {
      for (const field of section.fields) {
        values[field.columnName] = "";
      }
    }

    return values;
  }, [form.sections]);

  const [values, setValues] =
    useState<Record<string, unknown>>(initialValues);

  function setFieldValue(
    columnName: string,
    value: unknown
  ) {
    setValues((current) => ({
      ...current,
      [columnName]: value,
    }));
  }

  function applyLookupSelection(
    field: CompilerGuiField,
    selectedKey: Record<string, unknown>
  ) {
    if (!field.lookup) {
      return;
    }

    setValues((current) => {
      const next = { ...current };

      field.lookup?.foreignKeyColumns.forEach(
        (foreignColumn, index) => {
          const primaryColumn =
            field.lookup?.primaryKeyColumns[index];

          if (!primaryColumn) {
            return;
          }

          next[foreignColumn] =
            selectedKey[primaryColumn] ?? null;
        }
      );

      return next;
    });
  }

  return (
    <div className="mt-6 space-y-8">
      {form.sections
        .filter((section) => section.fields.length > 0)
        .map((section) => (
          <section
            key={section.sectionCode}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-950">
                {section.sectionName}
              </h3>

              {section.description && (
                <p className="mt-1 text-sm text-gray-600">
                  {section.description}
                </p>
              )}
            </div>

            <div
              className={`mt-5 grid gap-4 ${gridClassForColumns(
                section.columnCount
              )}`}
            >
              {section.fields.map((field) => (
                <div
                  key={field.columnName}
                  className={`rounded-md border border-gray-200 bg-gray-50/40 p-3 ${gridClassForSpan(
                    field.columnSpan
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-600">*</span>
                      )}
                    </label>

                    <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {field.controlType}
                    </span>
                  </div>

                  <div className="mt-0.5 text-[11px] text-gray-500">
                    {field.columnName}
                    {field.formatSpec
                      ? ` · ${field.formatSpec}`
                      : ""}
                  </div>

                  {field.controlType === "lookup" &&
                  field.lookup ? (
                    <LookupField
                      lookup={field.lookup}
                      value={Object.fromEntries(
                        field.lookup.primaryKeyColumns.map(
                          (primaryColumn, index) => {
                            const foreignColumn =
                              field.lookup!.foreignKeyColumns[index];

                            return [
                              primaryColumn,
                              foreignColumn
                                ? values[foreignColumn]
                                : null,
                            ];
                          }
                        )
                      )}
                      required={field.required}
                      placeholder={
                        field.placeholder ??
                        `Select ${field.label.toLowerCase()}`
                      }
                      onChange={(selectedKey) =>
                        applyLookupSelection(
                          field,
                          selectedKey
                        )
                      }
                    />
                  ) : (
                    <input
                      type={
                        field.controlType === "number" ||
                        field.controlType === "decimal"
                          ? "number"
                          : field.controlType === "date"
                            ? "date"
                            : field.controlType === "datetime"
                              ? "datetime-local"
                              : "text"
                      }
                      disabled={field.readOnly}
                      required={field.required}
                      value={stringValue(
                        values[field.columnName]
                      )}
                      onChange={(event) =>
                        setFieldValue(
                          field.columnName,
                          event.target.value
                        )
                      }
                      placeholder={
                        field.placeholder ??
                        (field.readOnly
                          ? "Read-only"
                          : `Enter ${field.label.toLowerCase()}`)
                      }
                      className="mt-3 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  )}

                  {field.helpText && (
                    <p className="mt-2 text-xs text-gray-500">
                      {field.helpText}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                    {field.readOnly && (
                      <span>Read-only after creation</span>
                    )}
                    {field.searchable && <span>Searchable</span>}
                    {field.sortable && <span>Sortable</span>}
                    {field.filterable && <span>Filterable</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
