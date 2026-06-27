"use client";

import Button from "./button";

export default function DeleteButton({
  message = "Delete this record?",
}: {
  message?: string;
}) {
  return (
    <Button
      type="submit"
      variant="danger"
      onClick={(e: any) => {
        if (!confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      Delete
    </Button>
  );
}
