BEGIN;

CREATE TABLE lsar_meta.standard (
  standard_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  standard_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  standard_code text NOT NULL,
  standard_name text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT standard_standard_uid_uq
    UNIQUE (standard_uid),

  CONSTRAINT standard_standard_code_uq
    UNIQUE (standard_code)
);

COMMENT ON TABLE lsar_meta.standard IS
  'Standards families supported by OSLAR.';

CREATE TABLE lsar_meta.standard_version (
  standard_version_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  standard_version_uid uuid NOT NULL DEFAULT gen_random_uuid(),
  standard_id bigint NOT NULL,
  version_code text NOT NULL,
  publication_date date,
  status text NOT NULL DEFAULT 'active',
  supersedes_standard_version_id bigint,
  source_reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT standard_version_uid_uq
    UNIQUE (standard_version_uid),

  CONSTRAINT standard_version_standard_version_uq
    UNIQUE (standard_id, version_code),

  CONSTRAINT standard_version_standard_id_fkey
    FOREIGN KEY (standard_id)
    REFERENCES lsar_meta.standard(standard_id)
    ON DELETE CASCADE,

  CONSTRAINT standard_version_supersedes_fkey
    FOREIGN KEY (supersedes_standard_version_id)
    REFERENCES lsar_meta.standard_version(standard_version_id)
    ON DELETE SET NULL,

  CONSTRAINT standard_version_status_chk
    CHECK (
      status IN (
        'draft',
        'active',
        'superseded',
        'withdrawn'
      )
    )
);

COMMENT ON TABLE lsar_meta.standard_version IS
  'Specific revisions or issues of standards supported by OSLAR.';

CREATE INDEX standard_version_standard_id_idx
  ON lsar_meta.standard_version (standard_id);

INSERT INTO lsar_meta.standard (
  standard_code,
  standard_name,
  description
)
VALUES
  (
    'GEIA-STD-0007',
    'Logistics Product Data',
    'GEIA logistics product data standard family.'
  ),
  (
    'MIL-STD-1388-2B',
    'DOD Requirements for a Logistics Support Analysis Record',
    'Legacy United States Department of Defense LSAR standard.'
  ),
  (
    'DEF-STAN-00-60',
    'Integrated Logistic Support',
    'United Kingdom defence standard family.'
  ),
  (
    'S3000L',
    'International Procedure Specification for Logistics Support Analysis',
    'S-Series logistics support analysis specification.'
  );

INSERT INTO lsar_meta.standard_version (
  standard_id,
  version_code,
  status,
  notes
)
SELECT
  standard_id,
  CASE standard_code
    WHEN 'GEIA-STD-0007' THEN 'C'
    WHEN 'MIL-STD-1388-2B' THEN '2B'
    ELSE 'CURRENT'
  END,
  'active',
  CASE
    WHEN standard_code IN ('DEF-STAN-00-60', 'S3000L')
      THEN 'Exact revision to be confirmed during catalogue population.'
    ELSE 'Initial OSLAR Phase 2 catalogue entry.'
  END
FROM lsar_meta.standard;

COMMIT;
