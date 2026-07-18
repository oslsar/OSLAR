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
  formatSpec: string | null;
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
