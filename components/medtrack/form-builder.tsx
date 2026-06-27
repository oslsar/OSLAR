import type { FormFieldConfig } from "@/lib/medtrack/form-config";

const inputStyle: React.CSSProperties = {
  width: 320,
  padding: "8px 10px",
  border: "1px solid #ccc",
  borderRadius: 6,
  fontSize: 14,
};

const fieldStyle: React.CSSProperties = {
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginBottom: 6,
};

function toDateTimeLocal(value: any) {
  if (!value) {
    return new Date().toISOString().slice(0, 16);
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 16);
}

export default function FormBuilder({
  fields,
  values = {},
}: {
  fields: FormFieldConfig[];
  values?: Record<string, any>;
}) {
  return (
    <>
      {fields.map((field) => {
        const value = values[field.name];

        return (
          <div key={field.name} style={fieldStyle}>
            <label style={labelStyle}>{field.label}</label>

            {["text", "number", "date", "datetime-local"].includes(field.type) && (
              <input
                type={field.type}
                name={field.name}
                defaultValue={
                  field.type === "datetime-local"
                    ? toDateTimeLocal(value)
                    : value ?? ""
                }
                required={field.required}
                placeholder={field.placeholder}
                style={inputStyle}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                name={field.name}
                defaultValue={value ?? ""}
                rows={4}
                required={field.required}
                placeholder={field.placeholder}
                style={{
                  ...inputStyle,
                  width: 420,
                  minHeight: 100,
                }}
              />
            )}

            {field.type === "select" && (
              <select
                name={field.name}
                defaultValue={value ?? ""}
                required={field.required}
                style={inputStyle}
              >
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === "checkbox" && (
              <input
                type="checkbox"
                name={field.name}
                defaultChecked={Boolean(value)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}