
export type CompilerField = {
  fieldDefId: string;
  fieldUid: string;
  columnName: string;
  ordinalPosition: number | null;
  displayName: string;
  formatSpec: string | null;
  isKey: boolean;
  isForeign: boolean;
  isMandatory: boolean;
  included: boolean;
  deprecated: boolean;
  behavior: {
    displayLabel: string | null;
    displayOrder: number | null;
    controlType: CompilerControlType | null;
    required: boolean | null;
    readOnly: boolean | null;
    hidden: boolean;
    searchable: boolean | null;
    sortable: boolean | null;
    filterable: boolean | null;
    placeholder: string | null;
    helpText: string | null;
    defaultWidth: number | null;
    formSectionId: string | null;
    columnSpan: number | null;
  };
  standards: {
    ded: string | null;
    geiaShortName: string | null;
    mil1388Field: string | null;
    defStan0060: string | null;
    s3000l: string | null;
    normalizedMappings: number;
  };
};

export type CompilerRelationship = {
  relationshipId: string;
  childEntityCode: string;
  parentEntityCode: string;
  constraintName: string | null;
  relationshipLabel: string | null;
  relationshipType: string;
  foreignKeyColumns: string[];
  primaryKeyColumns: string[];
  lookupAnchorColumn: string | null;
  lookupFilter: CompilerLookupFilter | null;
  active: boolean;
};

export type CompilerLookupContextFilter = {
  column: string;
  sourceColumn: string;
};

// Compiler planning is separate from the legacy browser field projection.
// Unresolved entries remain represented instead of silently losing a relationship.
export type CompilerLookupPlanEntry = {
  relationship: CompilerRelationship;
  anchorColumn: string | null;
  anchorSource: "explicit" | "default" | "inferred" | "unresolved";
  diagnostic: string | null;
};

export type CompilerLookupFilter =
  | {
      column: string;
      operator: "in";
      values: Array<string | number | boolean>;
    }
  | {
      column: string;
      operator: "eq_context";
      sourceColumn: string;
    }
  | {
      operator: "eq_contexts";
      filters: CompilerLookupContextFilter[];
    };

export type CompilerLookup = {
  relationshipId: string;
  parentEntityCode: string;
  parentLabel: string;
  foreignKeyColumns: string[];
  primaryKeyColumns: string[];
  displayColumns: string[];
  composite: boolean;

  // Retained for backwards compatibility with existing
  // single-context generated controls such as HG.
  contextSourceColumn: string | null;

  // Generic one-or-more context mappings.
  contextFilters: CompilerLookupContextFilter[];
};

export type CompilerEntityBehavior = {
  navigationLabel: string | null;
  navigationOrder: number | null;
  defaultFormCode: string | null;
  defaultSortColumn: string | null;
  defaultSortDirection: "asc" | "desc" | null;
  defaultPageSize: number | null;
  lookupDisplayColumns: string[] | null;
  defaultListColumns: string[] | null;
  defaultSearchColumns: string[] | null;
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowImport: boolean;
  allowExport: boolean;
};

export type CompilerPresentation = {
  categoryCode: string;
  categoryName: string;
  description: string | null;
  reservedRole: string | null;
  backgroundClass: string | null;
  borderClass: string | null;
  textClass: string | null;
  badgeClass: string | null;
  legendLabel: string | null;
  displayOrder: number | null;
};

export type CompilerControlType =
  | "text"
  | "number"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "textarea"
  | "lookup";

export type CompilerValidation = {
  required: boolean;
  maxLength: number | null;
  integerDigits: number | null;
  precision: number | null;
  scale: number | null;
};

export type CompilerValidationError = {
  columnName: string;
  label: string;
  code:
    | "required"
    | "max_length"
    | "integer_digits"
    | "decimal_format"
    | "unknown_field"
    | "invalid_type"
    | "partial_foreign_key"
    | "foreign_key_not_found";
  message: string;
};

export type CompilerValidationResult = {
  valid: boolean;
  errors: CompilerValidationError[];
};

export type CompilerCoercionResult = {
  valid: boolean;
  values: Record<string, unknown>;
  errors: CompilerValidationError[];
};

export type CompilerForeignKeyValidationResult = {
  valid: boolean;
  errors: CompilerValidationError[];
};

export type CompilerGuiField = {
  columnName: string;
  label: string;
  controlType: CompilerControlType;
  required: boolean;
  readOnly: boolean;
  searchable: boolean;
  sortable: boolean;
  filterable: boolean;
  placeholder: string | null;
  helpText: string | null;
  defaultWidth: number | null;
  columnSpan: number;
  formatSpec: string | null;
  lookup: CompilerLookup | null;
  validation: CompilerValidation;
  presentation: CompilerPresentation | null;
};

export type CompilerFormSection = {
  sectionCode: string;
  sectionName: string;
  description: string | null;
  displayOrder: number;
  columnCount: number;
  collapsible: boolean;
  initiallyCollapsed: boolean;
  fields: CompilerGuiField[];
};

export type CompilerForm = {
  formCode: string;
  formName: string;
  formType: string;
  description: string | null;
  sections: CompilerFormSection[];
};

export type CompilerPreview = {
  generatedAt: string;
  mode: "preview";
  entity: {
    entityCode: string;
    entityUid: string;
    entityName: string | null;
    included: boolean;
    profileCode: string | null;
  };

  behavior: CompilerEntityBehavior | null;

  database: {
    schemaName: string;
    tableName: string;
    tableExists: boolean;
    estimatedRows: number | null;
  };
  fields: CompilerField[];
  relationships: CompilerRelationship[];
  gui: {
    lookupPlan: CompilerLookupPlanEntry[];
    listColumns: string[];
    searchFields: string[];
    formFields: string[];
    readOnlyFields: string[];
    defaultSort: string | null;
    generatedFields: CompilerGuiField[];
    form: CompilerForm;
  };
  summary: {
    fieldCount: number;
    includedFieldCount: number;
    keyFieldCount: number;
    mandatoryFieldCount: number;
    foreignFieldCount: number;
    relationshipCount: number;
    normalizedMappingCount: number;
  };
  warnings: string[];
};
