BEGIN;

CREATE TABLE lsar_meta.presentation_category (
  presentation_category_id bigint
    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_code text NOT NULL UNIQUE,
  category_name text NOT NULL,
  description text,
  reserved_role text,
  background_class text,
  border_class text,
  text_class text,
  badge_class text,
  legend_label text,
  display_order integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT presentation_category_reserved_role_chk
    CHECK (
      reserved_role IS NULL
      OR reserved_role IN (
        'mandatory',
        'secondary',
        'custom'
      )
    )
);

CREATE TABLE lsar_meta.field_presentation (
  field_presentation_id bigint
    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  field_def_id bigint NOT NULL
    REFERENCES lsar_meta.field_def(field_def_id)
    ON DELETE CASCADE,
  category_code text NOT NULL
    REFERENCES lsar_meta.presentation_category(category_code),
  profile_code text,
  phase_code text,
  priority integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX field_presentation_field_idx
  ON lsar_meta.field_presentation(field_def_id)
  WHERE active = true;

CREATE INDEX field_presentation_scope_idx
  ON lsar_meta.field_presentation(
    profile_code,
    phase_code,
    priority,
    field_def_id
  )
  WHERE active = true;

INSERT INTO lsar_meta.presentation_category (
  category_code,
  category_name,
  description,
  reserved_role,
  background_class,
  border_class,
  text_class,
  badge_class,
  legend_label,
  display_order
)
VALUES
(
  'MANDATORY',
  'Mandatory',
  'Required field. Red is reserved for mandatory and validation status.',
  'mandatory',
  'bg-red-50/40',
  'border-red-300',
  'text-red-900',
  'bg-red-100 text-red-800',
  'Mandatory',
  10
),
(
  'SECONDARY',
  'Secondary',
  'Secondary or lower-priority business field.',
  'secondary',
  'bg-orange-50/40',
  'border-orange-300',
  'text-orange-900',
  'bg-orange-100 text-orange-800',
  'Secondary',
  20
),
(
  'USUAL',
  'Usually populated',
  'Normally populated for the selected project or customer.',
  'custom',
  'bg-blue-50/40',
  'border-blue-300',
  'text-blue-900',
  'bg-blue-100 text-blue-800',
  'Usually populated',
  30
),
(
  'SOMETIMES',
  'Sometimes populated',
  'Populated for some records or scenarios.',
  'custom',
  'bg-purple-50/40',
  'border-purple-300',
  'text-purple-900',
  'bg-purple-100 text-purple-800',
  'Sometimes populated',
  40
),
(
  'PHASE1',
  'Phase 1',
  'Field emphasized during project Phase 1.',
  'custom',
  'bg-green-50/40',
  'border-green-300',
  'text-green-900',
  'bg-green-100 text-green-800',
  'Phase 1',
  50
),
(
  'PHASE2',
  'Phase 2',
  'Field emphasized during project Phase 2.',
  'custom',
  'bg-cyan-50/40',
  'border-cyan-300',
  'text-cyan-900',
  'bg-cyan-100 text-cyan-800',
  'Phase 2',
  60
),
(
  'CUSTOMER',
  'Customer supplied',
  'Normally supplied by the customer.',
  'custom',
  'bg-indigo-50/40',
  'border-indigo-300',
  'text-indigo-900',
  'bg-indigo-100 text-indigo-800',
  'Customer supplied',
  70
),
(
  'REVIEW',
  'Review',
  'Field requiring review or additional attention.',
  'custom',
  'bg-pink-50/40',
  'border-pink-300',
  'text-pink-900',
  'bg-pink-100 text-pink-800',
  'Review',
  80
),
(
  'DERIVED',
  'Derived',
  'Value normally derived or system generated.',
  'custom',
  'bg-slate-50',
  'border-slate-300',
  'text-slate-900',
  'bg-slate-100 text-slate-800',
  'Derived',
  90
),
(
  'SPECIAL',
  'Special',
  'Project-specific presentation category.',
  'custom',
  'bg-teal-50/40',
  'border-teal-300',
  'text-teal-900',
  'bg-teal-100 text-teal-800',
  'Special',
  100
);

COMMIT;
