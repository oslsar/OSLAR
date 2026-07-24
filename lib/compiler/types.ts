
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
  relationshipType: string;
  foreignKeyColumns: unknown;
  primaryKeyColumns: unknown;
  active: boolean;
};

export type CompilerControlType =
  | "text"
  | "number"
  | "decimal"
  | "boolean"
  | "date"
  | "datetime"
  | "textarea";

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
  database: {
    schemaName: string;
    tableName: string;
    tableExists: boolean;
    estimatedRows: number | null;
  };
  fields: CompilerField[];
  relationships: CompilerRelationship[];
  gui: {
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
