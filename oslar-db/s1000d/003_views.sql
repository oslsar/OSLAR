create or replace view s1kd_view.v_dm_header as
select
  dm_code,
  tech_name,
  info_name,
  issue_number,
  in_work,
  issue_date,
  language_iso_code,
  country_iso_code,
  security_classification
from s1kd_core.data_module;

create or replace view s1kd_view.v_dm_content as
select
  dm_code,
  seq_no,
  block_type,
  block_json
from s1kd_core.dm_content_block;

create or replace view s1kd_view.v_pm_toc as
select
  pm_code,
  seq_no,
  parent_seq_no,
  entry_type,
  target_code,
  title
from s1kd_core.pm_entry
order by pm_code, seq_no;
