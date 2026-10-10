import type {
  CompilerGuiField,
  CompilerPreview,
  CompilerValidationError,
  CompilerValidationResult,
} from "@/lib/compiler/types";

function stringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function validateField(
  field: CompilerGuiField,
  value: unknown
): CompilerValidationError | null {
  const text = stringValue(value);

  if (
    field.validation.required &&
    text.trim() === ""
  ) {
    return {
      columnName: field.columnName,
      label: field.label,
      code: "required",
      message: `${field.label} is required.`,
    };
  }

  if (
    field.validation.maxLength !== null &&
    text.length > field.validation.maxLength
  ) {
    return {
      columnName: field.columnName,
      label: field.label,
      code: "max_length",
      message:
        `${field.label} must not exceed ` +
        `${field.validation.maxLength} characters.`,
    };
  }

  if (
    field.validation.integerDigits !== null &&
    text !== "" &&
    !new RegExp(
      `^-?\\d{1,${field.validation.integerDigits}}$`
    ).test(text)
  ) {
    return {
      columnName: field.columnName,
      label: field.label,
      code: "integer_digits",
      message:
        `${field.label} must contain no more than ` +
        `${field.validation.integerDigits} integer digits.`,
    };
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
      `^-?\\d{1,${integerDigits}}` +
      `(?:\\.\\d{1,${field.validation.scale}})?$`
    );

    if (!decimalPattern.test(text)) {
      return {
        columnName: field.columnName,
        label: field.label,
        code: "decimal_format",
        message:
          `${field.label} must have no more than ` +
          `${integerDigits} integer digits and ` +
          `${field.validation.scale} decimal places.`,
      };
    }
  }

  return null;
}

export function validateEntityPayload(
  preview: CompilerPreview,
  payload: Record<string, unknown>
): CompilerValidationResult {
  const fields = preview.gui.generatedFields;

  const approvedFields = new Map(
    fields.map((field) => [
      field.columnName,
      field,
    ])
  );

  const errors: CompilerValidationError[] = [];

  /*
   * Reject fields that are not part of the compiler-approved
   * generated entity definition.
   */
  for (const columnName of Object.keys(payload)) {
    if (!approvedFields.has(columnName)) {
      errors.push({
        columnName,
        label: columnName,
        code: "unknown_field",
        message:
          `${columnName} is not an approved field for ` +
          `${preview.entity.entityCode}.`,
      });
    }
  }

  /*
   * Validate every approved field. This deliberately includes
   * missing required fields, which therefore fail validation.
   */
  for (const field of fields) {
    const error = validateField(
      field,
      payload[field.columnName]
    );

    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
