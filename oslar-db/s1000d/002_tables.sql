create table if not exists s1kd_raw.package (
  package_id bigserial primary key,
  package_code text unique,
  package_title text,
  issue_info text,
  source_path text,
  imported_at timestamptz default now()
);

create table if not exists s1kd_raw.file (
  file_id bigserial primary key,
  package_id bigint not null references s1kd_raw.package(package_id) on delete cascade,
  file_name text not null,
  file_type text,
  relative_path text,
  xml_text xml,
  sha256 text,
  imported_at timestamptz default now()
);

create table if not exists s1kd_core.data_module (
  dm_id bigserial primary key,
  file_id bigint references s1kd_raw.file(file_id) on delete set null,
  dm_code text unique not null,
  model_ident_code text,
  system_diff_code text,
  system_code text,
  sub_system_code text,
  sub_sub_system_code text,
  assy_code text,
  disassy_code text,
  disassy_code_variant text,
  info_code text,
  info_code_variant text,
  item_location_code text,
  issue_number text,
  in_work text,
  language_iso_code text,
  country_iso_code text,
  tech_name text,
  info_name text,
  issue_date date,
  security_classification text,
  schema_name text,
  raw_xml xml not null
);

create table if not exists s1kd_core.publication_module (
  pm_id bigserial primary key,
  file_id bigint references s1kd_raw.file(file_id) on delete set null,
  pm_code text unique not null,
  pm_title text,
  issue_number text,
  in_work text,
  raw_xml xml not null
);

create table if not exists s1kd_core.graphic (
  graphic_id bigserial primary key,
  icn text unique,
  file_id bigint references s1kd_raw.file(file_id) on delete set null,
  mime_type text,
  relative_path text,
  binary_path text,
  title text
);

create table if not exists s1kd_core.dm_ref (
  dm_ref_id bigserial primary key,
  source_dm_code text not null,
  ref_type text not null,
  target_dm_code text,
  target_fragment text,
  raw_ref text
);

create table if not exists s1kd_core.applicability (
  appl_id bigserial primary key,
  dm_code text not null,
  applic_text text,
  applic_logic text,
  raw_xml xml
);

create table if not exists s1kd_core.dm_content_block (
  block_id bigserial primary key,
  dm_code text not null,
  seq_no integer not null,
  block_type text not null,
  parent_block_id bigint,
  block_json jsonb not null
);

create index if not exists ix_dm_content_block_dm_code_seq
  on s1kd_core.dm_content_block(dm_code, seq_no);

create table if not exists s1kd_core.pm_entry (
  pm_entry_id bigserial primary key,
  pm_code text not null,
  seq_no integer not null,
  entry_type text not null,
  target_code text,
  title text,
  parent_seq_no integer
);
