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

function inferValidation(
  formatSpec: string | null,
  required: boolean
) {
  const spec = formatSpec?.trim().toLowerCase() ?? "";

  const stringMatch = spec.match(
    /^(?:string|char|varchar)\s*\(\s*(\d+)\s*\)$/
  );

  if (stringMatch) {
    return {
      required,
      maxLength: Number(stringMatch[1]),
      integerDigits: null,
      precision: null,
      scale: null,
    };
  }

  const integerMatch = spec.match(
    /^(?:integer|int|number)\s*\(\s*(\d+)\s*\)$/
  );

  if (integerMatch) {
    return {
      required,
      maxLength: null,
      integerDigits: Number(integerMatch[1]),
      precision: null,
      scale: null,
    };
  }

  const decimalMatch = spec.match(
    /^(?:decimal|numeric)\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)$/
  );

  if (decimalMatch) {
    return {
      required,
      maxLength: null,
      integerDigits: null,
      precision: Number(decimalMatch[1]),
      scale: Number(decimalMatch[2]),
    };
  }

  return {
    required,
    maxLength: null,
    integerDigits: null,
    precision: null,
    scale: null,
  };
}

export async function buildEntityPreview(
  entityCode: string
): Promise<CompilerPreview | null> {
  const metadata = await getEntityMetadata(entityCode);

  if (!metadata) {
    return null;
  }

  const {
    entity,
    fields,
    relationships,
    formRows,
    entityBehavior,
    relatedEntityBehaviors,
    physicalTable,
  } = metadata;

  const activeFields = fields.filter(
    (field) =>
      field.included &&
      !field.deprecated &&
      !field.behavior.hidden
  );

  const keyFields = activeFields.filter((field) => field.isKey);
  const mandatoryFields = activeFields.filter(
    (field) => field.isMandatory
  );
  const foreignFields = activeFields.filter(
    (field) => field.isForeign
  );

  const orderedFields = [...activeFields].sort((a, b) => {
    const aOrder =
      a.behavior.displayOrder ??
      a.ordinalPosition ??
      Number.MAX_SAFE_INTEGER;

    const bOrder =
      b.behavior.displayOrder ??
      b.ordinalPosition ??
      Number.MAX_SAFE_INTEGER;

    return aOrder - bOrder || a.columnName.localeCompare(b.columnName);
  });

  const approvedColumnNames = new Set(
    activeFields.map((field) => field.columnName)
  );

  const compilerListColumns = [
    ...keyFields,
    ...orderedFields.filter((field) => !field.isKey),
  ]
    .slice(0, MAX_DEFAULT_LIST_COLUMNS)
    .map((field) => field.columnName);

  const configuredListColumns = Array.isArray(
    entityBehavior?.default_list_columns
  )
    ? entityBehavior.default_list_columns.filter(
        (column: unknown): column is string =>
          typeof column === "string" &&
          approvedColumnNames.has(column)
      )
    : [];

  const listColumns =
    configuredListColumns.length > 0
      ? configuredListColumns
      : compilerListColumns;

  const inferredSearchFields = orderedFields
    .filter((field) => {
      if (field.behavior.searchable !== null) {
        return field.behavior.searchable;
      }

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

  const configuredSearchFields = Array.isArray(
    entityBehavior?.default_search_columns
  )
    ? entityBehavior.default_search_columns.filter(
        (column: unknown): column is string =>
          typeof column === "string" &&
          approvedColumnNames.has(column)
      )
    : [];

  const searchFields =
    configuredSearchFields.length > 0
      ? configuredSearchFields
      : inferredSearchFields;

  const formFields = orderedFields.map(
    (field) => field.columnName
  );

  const readOnlyFields = activeFields
    .filter((field) => field.isKey)
    .map((field) => field.columnName);

  const outgoingRelationships = relationships.filter(
    (relationship) =>
      relationship.active &&
      relationship.relationshipType === "foreign_key" &&
      relationship.childEntityCode === entity.entity_code
  );

  const compositeLookupCompanionColumns = new Set(
    outgoingRelationships.flatMap((relationship) =>
      relationship.foreignKeyColumns.length > 1
        ? relationship.foreignKeyColumns.slice(1)
        : []
    )
  );

  const configuredDefaultSort =
    entityBehavior?.default_sort_column &&
    approvedColumnNames.has(entityBehavior.default_sort_column)
      ? entityBehavior.default_sort_column
      : null;

  const defaultSort =
    configuredDefaultSort ??
    keyFields[0]?.columnName ??
    listColumns[0] ??
    null;

  const generatedFields = orderedFields.map((field) => {
    const lookupRelationship = outgoingRelationships.find(
      (relationship) =>
        relationship.foreignKeyColumns[0] === field.columnName
    );

    const lookup = lookupRelationship
      ? {
          relationshipId: lookupRelationship.relationshipId,
          parentEntityCode:
            lookupRelationship.parentEntityCode,
          foreignKeyColumns:
            lookupRelationship.foreignKeyColumns,
          primaryKeyColumns:
            lookupRelationship.primaryKeyColumns,
          displayColumns:
            relatedEntityBehaviors[
              lookupRelationship.parentEntityCode
            ]?.lookupDisplayColumns ??
            lookupRelationship.primaryKeyColumns,
          composite:
            lookupRelationship.foreignKeyColumns.length > 1,
        }
      : null;

    const required =
      field.behavior.required ??
      (field.isMandatory || field.isKey);

    return {
      columnName: field.columnName,
      label:
        field.behavior.displayLabel ??
        field.displayName,
      controlType:
        field.behavior.controlType ??
        (lookup ? "lookup" : inferControlType(field.formatSpec)),
      required,
      readOnly:
        field.behavior.readOnly ??
        (
          field.isKey ||
          compositeLookupCompanionColumns.has(field.columnName)
        ),
      searchable:
        field.behavior.searchable ??
        searchFields.includes(field.columnName),
      sortable:
        field.behavior.sortable ?? true,
      filterable:
        field.behavior.filterable ?? true,
      placeholder: field.behavior.placeholder,
      helpText: field.behavior.helpText,
      defaultWidth: field.behavior.defaultWidth,
      columnSpan: field.behavior.columnSpan ?? 1,
      formatSpec: field.formatSpec,
      lookup,
      validation: inferValidation(
        field.formatSpec,
        required
      ),
    };
  });

  const formRow = formRows[0] ?? null;

  const sectionRows = formRows.filter(
    (row) => row.form_section_id !== null
  );

const generatedForm = formRow
  ? {
      formCode: formRow.form_code,
      formName: formRow.form_name,
      formType: formRow.form_type,
      description: formRow.form_description,
      sections: sectionRows.map((sectionRow) => {
        const isOtherSection =
          sectionRow.section_code === "other";

        const sectionFields = generatedFields.filter(
          (guiField) => {
            const sourceField = fields.find(
              (field) =>
                field.columnName === guiField.columnName
            );

            if (!sourceField) {
              return false;
            }

            if (isOtherSection) {
              return (
                sourceField.behavior.formSectionId === null
              );
            }

            return (
              sourceField.behavior.formSectionId ===
              sectionRow.form_section_id
            );
          }
        );

        return {
          sectionCode: sectionRow.section_code,
          sectionName: sectionRow.section_name,
          description: sectionRow.section_description,
          displayOrder: sectionRow.display_order,
          columnCount: sectionRow.column_count,
          collapsible: sectionRow.collapsible,
          initiallyCollapsed:
            sectionRow.initially_collapsed,
          fields: sectionFields,
        };
      }),
    }
  : {
      formCode: "generated",
      formName: `${entity.entity_code} Generated Form`,
      formType: "edit",
      description: null,
      sections: [
        {
          sectionCode: "general",
          sectionName: "General",
          description: null,
          displayOrder: 0,
          columnCount: 2,
          collapsible: false,
          initiallyCollapsed: false,
          fields: generatedFields,
        },
      ],
    };

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

    behavior: entityBehavior
      ? {
          navigationLabel: entityBehavior.navigation_label,
          navigationOrder: entityBehavior.navigation_order,
          defaultFormCode: entityBehavior.default_form_code,
          defaultSortColumn: entityBehavior.default_sort_column,
          defaultSortDirection:
            entityBehavior.default_sort_direction,
          defaultPageSize: entityBehavior.default_page_size,
          lookupDisplayColumns:
            entityBehavior.lookup_display_columns,
          defaultListColumns:
            entityBehavior.default_list_columns,
          defaultSearchColumns:
            entityBehavior.default_search_columns,
          allowCreate: entityBehavior.allow_create,
          allowEdit: entityBehavior.allow_edit,
          allowDelete: entityBehavior.allow_delete,
          allowImport: entityBehavior.allow_import,
          allowExport: entityBehavior.allow_export,
        }
      : null,

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
      defaultSort,
      generatedFields,
      form: generatedForm,
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
