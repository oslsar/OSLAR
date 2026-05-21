export type MedItem = {
  id: string;
  user_id: string;
  name: string;
  kind: "supplement" | "medicine";
  strength?: string;
  form?: string;
  notes?: string;
  active: boolean;
};

export type Schedule = {
  id: string;
  item_id: string;
  frequency_type:
    | "daily"
    | "specific_days"
    | "interval"
    | "as_needed";
};