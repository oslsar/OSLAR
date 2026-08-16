"use client";

import { useMemo, useState } from "react";
import LookupField from "@/components/compiler/lookup-field";
import type {
  CompilerForm,
  CompilerGuiField,
} from "@/lib/compiler/types";

type GeneratedFormMode = "create" | "edit" | "view";

type GeneratedFormProps = {
  entityCode: string;
  form: CompilerForm;
  mode?: GeneratedFormMode;
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

function stepForScale(
  scale: number | null
): string | undefined {
  if (scale === null) {
    return undefined;
  }

  if (scale <= 0) {
    return "1";
  }

  return `0.${"0".repeat(scale - 1)}1`;
}

function validateFieldValue(
  field: CompilerGuiField,
  value: unknown
): string | null {
  const text = stringValue(value);

  if (field.validation.required && text.trim() === "") {
    return `${field.label} is required.`;
  }

  if (
    field.validation.maxLength !== null &&
    text.length > field.validation.maxLength
  ) {
    return `${field.label} must not exceed ${field.validation.maxLength} characters.`;
  }

  if (
    field.validation.integerDigits !== null &&
    text !== "" &&
    !new RegExp(
      `^-?\\d{1,${field.validation.integerDigits}}$`
    ).test(text)
  ) {
    return `${field.label} must contain no more than ${field.validation.integerDigits} integer digits.`;
  }

  if (
    field.validation.precision !== null &&
    field.validation.scale !== null &&
    text !== ""
  ) {
    const integerDigits =
      field.validation.precision -
      field.validation.scale;

    const decimalPattern = new RegExp(
      `^-?\\d{1,${integerDigits}}(?:\\.\\d{1,${field.validation.scale}})?$`
    );

    if (!decimalPattern.test(text)) {
      return `${field.label} must have no more than ${integerDigits} integer digits and ${field.validation.scale} decimal places.`;
    }
  }

  return null;
}

export default function GeneratedForm({
  entityCode,
  form,
  mode = "view",
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

  const lookupCompanionColumns = useMemo(() => {
    const columns = new Set<string>();

    for (const section of form.sections) {
      for (const field of section.fields) {
        if (!field.lookup || !field.lookup.composite) {
          continue;
        }

        for (
          const columnName of
          field.lookup.foreignKeyColumns.slice(1)
        ) {
          columns.add(columnName);
        }
      }
    }

    return columns;
  }, [form.sections]);

  const [values, setValues] =
    useState<Record<string, unknown>>(initialValues);

  const [touched, setTouched] =
    useState<Record<string, boolean>>({});

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  function setFieldValue(
    columnName: string,
    value: unknown
  ) {
    setValues((current) => ({
      ...current,
      [columnName]: value,
    }));
  }

  function markTouched(columnName: string) {
    setTouched((current) => ({
      ...current,
      [columnName]: true,
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

  async function handleSubmit() {
    if (mode !== "create") {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await fetch(
        `/api/compiler/entities/${encodeURIComponent(entityCode)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (Array.isArray(result.errors) && result.errors.length > 0) {
          setSubmitError(
            result.errors
              .map((error: { message?: string }) =>
                error.message ?? "Validation error"
              )
              .join(" ")
          );
        } else {
          setSubmitError(
            result.error ?? "Unable to create record."
          );
        }

        return;
      }

      setSubmitSuccess(
        `${entityCode} record created successfully.`
      );
    } catch (error) {
      console.error("Create request failed:", error);
      setSubmitError("Unable to create record.");
    } finally {
      setSubmitting(false);
    }
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
              {section.fields.map((field) => {
                const validationError = validateFieldValue(
                  field,
                  values[field.columnName]
                );

                const effectiveReadOnly =
                  mode === "view"
                    ? true
                    : mode === "create"
                      ? lookupCompanionColumns.has(field.columnName)
                        ? true
                        : field.readOnly && !field.validation.required
                      : field.readOnly;

                return (
                  <div
                  key={field.columnName}
                  className={`rounded-md border border-gray-200 bg-gray-50/40 p-3 ${gridClassForSpan(
                    field.columnSpan
                  )}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <label className="text-sm font-medium text-gray-900">
                      {field.label}
                      {field.validation.required && (
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
	              disabled={mode === "view"}
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
                      required={field.validation.required}
                      placeholder={
                        field.placeholder ??
                        `Select ${field.label.toLowerCase()}`
                      }
                      onChange={(selectedKey) => {
                        applyLookupSelection(field, selectedKey);
                        markTouched(field.columnName);
                      }}
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
                      disabled={effectiveReadOnly}
                      required={field.validation.required}
                      value={stringValue(
                        values[field.columnName]
                      )}
                      onChange={(event) =>
                        setFieldValue(
                          field.columnName,
                          event.target.value
                        )
                      }
                      onBlur={() => markTouched(field.columnName)}
                      placeholder={
                        field.placeholder ??
                        (effectiveReadOnly
                          ? "Read-only"
                          : `Enter ${field.label.toLowerCase()}`)
                      }
                      maxLength={
                        field.validation.maxLength ?? undefined
                      }
                      step={stepForScale(field.validation.scale)}
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
                 {touched[field.columnName] && validationError && (
                   <p className="mt-2 text-xs text-red-600">
                     {validationError}
                   </p>
                 )}
               </div>
             );
           })}
            </div>
          </section>
        ))}

      {mode === "create" && (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create record"}
            </button>
          </div>

          {submitError && (
            <p className="text-sm text-red-600">
              {submitError}
            </p>
          )}

          {submitSuccess && (
            <p className="text-sm text-green-700">
              {submitSuccess}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
