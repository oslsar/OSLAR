import { getEntityMetadata } from "@/lib/compiler/metadata";
import type {
  CompilerControlType,
  CompilerPreview,
} from "@/lib/compiler/types";

const MAX_DEFAULT_LIST_COLUMNS = 10;

function inferControlType(
  formatSpec: string | null
): CompilerControlType {
  const spec = formatSpec?.trim().toLowerCase() ?? "";

  if (spec.startsWith("decimal") || spec.startsWith("numeric")) {
    return "decimal";
  }

  if (
    spec.startsWith("integer") ||
    spec.startsWith("int") ||
    spec.startsWith("number")
  ) {
    return "number";
  }

  if (spec.startsWith("boolean") || spec.startsWith("bool")) {
    return "boolean";
  }

  if (spec.startsWith("datetime") || spec.includes("timestamp")) {
    return "datetime";
  }

  if (spec.startsWith("date")) {
    return "date";
  }

  if (
    spec.startsWith("text") ||
    spec.includes("memo") ||
    spec.includes("long")
  ) {
    return "textarea";
  }

  return "text";
}

export async function buildEntityPreview(
  entityCode: string
): Promise<CompilerPreview | null> {
  const metadata = await getEntityMetadata(entityCode);

  if (!metadata) {
    return null;
  }

  const { entity, fields, relationships, physicalTable } = metadata;

  const activeFields = fields.filter(
    (field) => field.included && !field.deprecated
  );

  const keyFields = activeFields.filter((field) => field.isKey);
  const mandatoryFields = activeFields.filter(
    (field) => field.isMandatory
  );
  const foreignFields = activeFields.filter(
    (field) => field.isForeign
  );

  const listColumns = [
    ...keyFields,
    ...activeFields.filter((field) => !field.isKey),
  ]
    .slice(0, MAX_DEFAULT_LIST_COLUMNS)
    .map((field) => field.columnName);

  const searchFields = activeFields
    .filter((field) => {
      const spec = field.formatSpec?.trim().toLowerCase() ?? "";

      return (
        field.isKey ||
        spec.startsWith("string") ||
        spec.startsWith("char") ||
        spec.startsWith("varchar") ||
        spec.startsWith("text")
      );
    })
    .slice(0, 8)
    .map((field) => field.columnName);

  const formFields = activeFields.map((field) => field.columnName);

  const readOnlyFields = activeFields
    .filter((field) => field.isKey)
    .map((field) => field.columnName);

  const generatedFields = activeFields.map((field) => ({
    columnName: field.columnName,
    label: field.displayName,
    controlType: inferControlType(field.formatSpec),
    required: field.isMandatory || field.isKey,
    readOnly: field.isKey,
    searchable: searchFields.includes(field.columnName),
    formatSpec: field.formatSpec,
  }))

  const normalizedMappingCount = fields.reduce(
    (total, field) => total + field.standards.normalizedMappings,
    0
  );

  const warnings: string[] = [];

  if (!physicalTable) {
    warnings.push(
      `Physical table lsar_core.${entity.entity_code} was not found.`
    );
  }

  if (keyFields.length === 0) {
    warnings.push(
      "No primary-key fields are identified in field metadata."
    );
  }

  if (normalizedMappingCount === 0) {
    warnings.push(
      "No normalized standards mappings have been populated yet."
    );
  }

  if (relationships.length === 0) {
    warnings.push(
      "No entity relationships are currently registered."
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: "preview",
    entity: {
      entityCode: entity.entity_code,
      entityUid: entity.entity_uid,
      entityName: entity.entity_name,
      included: entity.include_entity,
      profileCode: entity.profile_code,
    },
    database: {
      schemaName: physicalTable?.schema_name ?? "lsar_core",
      tableName: physicalTable?.table_name ?? entity.entity_code,
      tableExists: Boolean(physicalTable),
      estimatedRows:
        physicalTable?.estimated_rows === null ||
        physicalTable?.estimated_rows === undefined
          ? null
          : Number(physicalTable.estimated_rows),
    },
    fields,
    relationships,
    gui: {
      listColumns,
      searchFields,
      formFields,
      readOnlyFields,
      defaultSort: keyFields[0]?.columnName ?? listColumns[0] ?? null,
      generatedFields,
    },
    summary: {
      fieldCount: fields.length,
      includedFieldCount: activeFields.length,
      keyFieldCount: keyFields.length,
      mandatoryFieldCount: mandatoryFields.length,
      foreignFieldCount: foreignFields.length,
      relationshipCount: relationships.length,
      normalizedMappingCount,
    },
    warnings,
  };
}
