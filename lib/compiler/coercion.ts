import type {
  CompilerGuiField,
  CompilerPreview,
  CompilerCoercionResult,
  CompilerValidationError,
} from "@/lib/compiler/types";

function isEmptyValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) {
      return true;
    }

    if (value === 0) {
      return false;
    }

    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (
      normalized === "true" ||
      normalized === "yes" ||
      normalized === "1"
    ) {
      return true;
    }

    if (
      normalized === "false" ||
      normalized === "no" ||
      normalized === "0"
    ) {
      return false;
    }
  }

  return null;
}

function coerceFieldValue(
  field: CompilerGuiField,
  value: unknown
): {
  value: unknown;
  error: CompilerValidationError | null;
} {
  /*
   * Optional empty non-text values become NULL.
   * Text fields remain empty strings when explicitly supplied.
   */
  if (isEmptyValue(value)) {
    if (
      field.controlType === "text" ||
      field.controlType === "textarea"
    ) {
      return {
        value: value === null || value === undefined ? "" : String(value),
        error: null,
      };
    }

    return {
      value: null,
      error: null,
    };
  }

  const formatSpec =
    field.formatSpec?.trim().toLowerCase() ?? "";

  /*
   * Use the underlying format specification rather than
   * controlType alone because FK fields may use controlType=lookup.
   */
  if (
    formatSpec.startsWith("integer") ||
    formatSpec.startsWith("int") ||
    formatSpec.startsWith("number")
  ) {
    const text = String(value).trim();

    if (!/^-?\d+$/.test(text)) {
      return {
        value,
        error: {
          columnName: field.columnName,
          label: field.label,
          code: "invalid_type",
          message: `${field.label} must be an integer.`,
        },
      };
    }

    const numericValue = Number(text);

    if (!Number.isSafeInteger(numericValue)) {
      return {
        value,
        error: {
          columnName: field.columnName,
          label: field.label,
          code: "invalid_type",
          message: `${field.label} is outside the supported integer range.`,
        },
      };
    }

    return {
      value: numericValue,
      error: null,
    };
  }

  if (
    formatSpec.startsWith("decimal") ||
    formatSpec.startsWith("numeric")
  ) {
    const text = String(value).trim();

    if (!/^-?\d+(?:\.\d+)?$/.test(text)) {
      return {
        value,
        error: {
          columnName: field.columnName,
          label: field.label,
          code: "invalid_type",
          message: `${field.label} must be numeric.`,
        },
      };
    }

    /*
     * Preserve decimal values as strings.
     * PostgreSQL NUMERIC can consume them directly without
     * introducing JavaScript floating-point rounding.
     */
    return {
      value: text,
      error: null,
    };
  }

  if (
    formatSpec.startsWith("boolean") ||
    formatSpec.startsWith("bool") ||
    field.controlType === "boolean"
  ) {
    const booleanValue = coerceBoolean(value);

    if (booleanValue === null) {
      return {
        value,
        error: {
          columnName: field.columnName,
          label: field.label,
          code: "invalid_type",
          message: `${field.label} must be a boolean value.`,
        },
      };
    }

    return {
      value: booleanValue,
      error: null,
    };
  }

  if (field.controlType === "date") {
    const text = String(value).trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return {
        value,
        error: {
          columnName: field.columnName,
          label: field.label,
          code: "invalid_type",
          message: `${field.label} must be a valid date.`,
        },
      };
    }

    return {
      value: text,
      error: null,
    };
  }

  if (field.controlType === "datetime") {
    const text = String(value).trim();

    if (Number.isNaN(Date.parse(text))) {
      return {
        value,
        error: {
          columnName: field.columnName,
          label: field.label,
          code: "invalid_type",
          message: `${field.label} must be a valid date and time.`,
        },
      };
    }

    return {
      value: text,
      error: null,
    };
  }

  return {
    value: String(value),
    error: null,
  };
}

export function coerceEntityPayload(
  preview: CompilerPreview,
  payload: Record<string, unknown>
): CompilerCoercionResult {
  const approvedFields = new Map(
    preview.gui.generatedFields.map((field) => [
      field.columnName,
      field,
    ])
  );

  const values: Record<string, unknown> = {};
  const errors: CompilerValidationError[] = [];

  for (const [columnName, rawValue] of Object.entries(payload)) {
    const field = approvedFields.get(columnName);

    if (!field) {
      continue;
    }

    const result = coerceFieldValue(
      field,
      rawValue
    );

    if (result.error) {
      errors.push(result.error);
      continue;
    }

    values[columnName] = result.value;
  }

  return {
    valid: errors.length === 0,
    values,
    errors,
  };
}
