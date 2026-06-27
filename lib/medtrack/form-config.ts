export type FormFieldOption = {
  label: string;
  value: string;
};

export type FormFieldConfig = {
  name: string;
  label: string;
  type:
  | "text"
  | "number"
  | "date"
  | "datetime-local"
  | "textarea"
  | "select"
  | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: FormFieldOption[];
};

export const itemFormFields: FormFieldConfig[] = [
  {
    name: "name",
    label: "Name",
    type: "text",
    required: true,
  },
  {
    name: "kind",
    label: "Kind",
    type: "select",
    required: true,
    options: [
      { label: "Supplement", value: "supplement" },
      { label: "Medicine", value: "medicine" },
    ],
  },
  {
    name: "strength",
    label: "Strength",
    type: "text",
    placeholder: "e.g. 500 mg",
  },
  {
    name: "form",
    label: "Form",
    type: "text",
    placeholder: "tablet, capsule, liquid...",
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
  },
  {
    name: "active",
    label: "Active",
    type: "checkbox",
  },
];

export const symptomFormFields: FormFieldConfig[] = [
  {
    name: "logged_at",
    label: "Logged At",
    type: "datetime-local",
    required: true,
  },
  {
    name: "symptom",
    label: "Symptom",
    type: "text",
    required: true,
    placeholder: "e.g. Fatigue, headache, brain fog",
  },
  {
    name: "severity",
    label: "Severity 1-10",
    type: "number",
    placeholder: "1 to 10",
  },
  {
    name: "notes",
    label: "Notes",
    type: "textarea",
  },
];
