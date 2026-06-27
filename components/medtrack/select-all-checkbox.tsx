"use client";

export default function SelectAllCheckbox({
  name = "item_ids",
}: {
  name?: string;
}) {
  return (
    <input
      type="checkbox"
      title="Select all"
      onChange={(e) => {
        document
          .querySelectorAll<HTMLInputElement>(
            `input[name="${name}"]`
          )
          .forEach((checkbox) => {
            checkbox.checked = e.target.checked;
          });
      }}
    />
  );
}
