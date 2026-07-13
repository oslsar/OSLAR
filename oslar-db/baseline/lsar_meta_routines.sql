CREATE OR REPLACE FUNCTION lsar_meta.base_has_digit_before_dash(p_part_no text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null then false
        else coalesce(lsar_meta.part_base_before_last_dash(p_part_no) ~ '.*[0-9].*', false)
    end
$function$


CREATE OR REPLACE PROCEDURE lsar_meta.build_entities_from_dbinfo(IN p_profile_code text, IN p_target_schema text, IN p_entities text[], IN p_drop_existing boolean DEFAULT true)
 LANGUAGE plpgsql
AS $procedure$
declare
  ent text;
  col record;
  ddl text;
  pk_cols text;
  col_type text;
  col_null text;
begin
  execute format('create schema if not exists %I', p_target_schema);

  foreach ent in array p_entities loop
    if p_drop_existing then
      execute format('drop table if exists %I.%I cascade', p_target_schema, ent);
    end if;

    ddl := format('create table %I.%I (', p_target_schema, ent);
    pk_cols := '';

    for col in
      select *
      from lsar_meta.v_dbinfo
      where profile_code = p_profile_code
        and entity_code = ent
        and include_element = true
        and deprecated = false
      order by coalesce(ordinal_pos, 999999), db_field_name
    loop
      col_type := lsar_meta.map_format_spec_to_pg_type(col.format_spec);

      if col.is_key or col.mandatory_override then
        col_null := ' not null';
      else
        col_null := '';
      end if;

      ddl := ddl || format('%I %s%s,', col.db_field_name, col_type, col_null);

      if col.is_key then
        pk_cols := pk_cols || format('%I,', col.db_field_name);
      end if;
    end loop;

    -- remove trailing comma
    ddl := left(ddl, length(ddl)-1);

    if pk_cols <> '' then
      pk_cols := left(pk_cols, length(pk_cols)-1);
      ddl := ddl || format(', constraint %I primary key (%s)', ent || '_PK', pk_cols);
    end if;

    ddl := ddl || ');';
    execute ddl;
  end loop;
end;
$procedure$


CREATE OR REPLACE PROCEDURE lsar_meta.build_part_alias_view(IN p_source_schema text DEFAULT 'cdm'::text, IN p_source_table text DEFAULT 'item_master'::text, IN p_target_schema text DEFAULT 'cdm'::text, IN p_target_view text DEFAULT 'v_part_alias_detection'::text)
 LANGUAGE plpgsql
AS $procedure$
declare
    v_part_col  text;
    v_cage_col  text;
    v_desc_col  text;
    v_uid_col   text;
    v_sql       text;
begin
    -- ---------- detect UID / primary identifier ----------
    select c.column_name
      into v_uid_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in ('uid', 'id', 'item_uid', 'item_id')
    order by case c.column_name
        when 'uid' then 1
        when 'id' then 2
        when 'item_uid' then 3
        when 'item_id' then 4
        else 999
    end
    limit 1;

    if v_uid_col is null then
        raise exception 'Could not find a UID/id column in %.%', p_source_schema, p_source_table;
    end if;

    -- ---------- detect part number column ----------
    select c.column_name
      into v_part_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in (
          'part_no',
          'part_number',
          'pn',
          'item_code',
          'partnumber',
          'partnum'
      )
    order by case c.column_name
        when 'part_no' then 1
        when 'part_number' then 2
        when 'pn' then 3
        when 'item_code' then 4
        when 'partnumber' then 5
        when 'partnum' then 6
        else 999
    end
    limit 1;

    if v_part_col is null then
        raise exception 'Could not find a part-number-like column in %.%', p_source_schema, p_source_table;
    end if;

    -- ---------- detect cage/manufacturer column ----------
    select c.column_name
      into v_cage_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in (
          'cage_code',
          'cage',
          'manufacturer_code',
          'mfr_code',
          'csmi',
          'source_code'
      )
    order by case c.column_name
        when 'cage_code' then 1
        when 'cage' then 2
        when 'manufacturer_code' then 3
        when 'mfr_code' then 4
        when 'csmi' then 5
        when 'source_code' then 6
        else 999
    end
    limit 1;

    -- ---------- detect description column ----------
    select c.column_name
      into v_desc_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in (
          'nomenclature',
          'description',
          'item_name',
          'noun_name',
          'name'
      )
    order by case c.column_name
        when 'nomenclature' then 1
        when 'description' then 2
        when 'item_name' then 3
        when 'noun_name' then 4
        when 'name' then 5
        else 999
    end
    limit 1;

    v_sql := format($fmt$
create or replace view %I.%I as
with base_items as (
    select
        i.%I as source_uid,
        i.%I::text as source_part_no,
        lsar_meta.normalize_part_no(i.%I::text) as norm_part_no,
        %s as cage_code,
        %s as item_description
    from %I.%I i
    where i.%I is not null
),
suffix_lookup as (
    select
        upper(suffix_code) as suffix_code,
        suffix_type,
        strip_priority
    from lsar_meta.part_suffix_rule
    where active_flag = true
),
candidates as (
    select
        b.source_uid,
        b.source_part_no,
        b.norm_part_no,
        b.cage_code,
        b.item_description,
        lsar_meta.last_token(b.norm_part_no) as suffix_1,
        lsar_meta.second_last_token(b.norm_part_no) as suffix_2,
        lsar_meta.strip_last_token(b.norm_part_no) as strip_1_part_no,
        lsar_meta.strip_last_two_tokens(b.norm_part_no) as strip_2_part_no
    from base_items b
),
resolved as (
    select
        c.*,
        s1.suffix_code as sfx1_match,
        s1.suffix_type as sfx1_type,
        s2.suffix_code as sfx2_match,
        s2.suffix_type as sfx2_type,
        b1.source_uid as canonical_uid_1,
        b1.norm_part_no as canonical_part_no_1,
        b2.source_uid as canonical_uid_2,
        b2.norm_part_no as canonical_part_no_2
    from candidates c
    left join suffix_lookup s1
        on c.suffix_1 = s1.suffix_code
    left join suffix_lookup s2
        on c.suffix_2 = s2.suffix_code
    left join base_items b1
        on c.strip_1_part_no = b1.norm_part_no
       and coalesce(c.cage_code, '') = coalesce(b1.cage_code, '')
    left join base_items b2
        on c.strip_2_part_no = b2.norm_part_no
       and coalesce(c.cage_code, '') = coalesce(b2.cage_code, '')
)
select
    r.source_uid,
    r.source_part_no as part_no,
    r.norm_part_no,

    case
        when r.canonical_uid_2 is not null
         and r.sfx1_match is not null
         and r.sfx2_match is not null
        then r.canonical_uid_2
        when r.canonical_uid_1 is not null
         and r.sfx1_match is not null
        then r.canonical_uid_1
        else r.source_uid
    end as canonical_uid,

    case
        when r.canonical_uid_2 is not null
         and r.sfx1_match is not null
         and r.sfx2_match is not null
        then r.canonical_part_no_2
        when r.canonical_uid_1 is not null
         and r.sfx1_match is not null
        then r.canonical_part_no_1
        else r.norm_part_no
    end as canonical_part_no,

    case
        when r.canonical_uid_2 is not null
         and r.sfx1_match is not null
         and r.sfx2_match is not null
        then 'alias_2_suffix'
        when r.canonical_uid_1 is not null
         and r.sfx1_match is not null
        then 'alias_1_suffix'
        else 'base_or_unresolved'
    end as alias_status,

    r.suffix_2,
    r.sfx2_type as suffix_2_type,
    r.suffix_1,
    r.sfx1_type as suffix_1_type,

    case
        when r.canonical_uid_2 is not null
         and r.sfx1_match is not null
         and r.sfx2_match is not null
        then 90
        when r.canonical_uid_1 is not null
         and r.sfx1_match is not null
        then 75
        else 0
    end as confidence_score,

    r.cage_code,
    r.item_description

from resolved r;
$fmt$,
        p_target_schema,
        p_target_view,
        v_uid_col,
        v_part_col,
        v_part_col,
        case
            when v_cage_col is null then 'null::text'
            else format('i.%I::text', v_cage_col)
        end,
        case
            when v_desc_col is null then 'null::text'
            else format('i.%I::text', v_desc_col)
        end,
        p_source_schema,
        p_source_table,
        v_part_col
    );

    execute v_sql;

    raise notice 'Built %.% from %.%', p_target_schema, p_target_view, p_source_schema, p_source_table;
    raise notice 'Detected columns: uid=%, part_no=%, cage=%, description=%',
        v_uid_col, v_part_col, coalesce(v_cage_col, '<none>'), coalesce(v_desc_col, '<none>');
end;
$procedure$


CREATE OR REPLACE PROCEDURE lsar_meta.build_part_dash_family_view(IN p_source_schema text DEFAULT 'cdm'::text, IN p_source_table text DEFAULT 'item_master'::text, IN p_target_schema text DEFAULT 'cdm'::text, IN p_target_view text DEFAULT 'v_part_dash_family_detection'::text)
 LANGUAGE plpgsql
AS $procedure$
declare
    v_part_col  text;
    v_cage_col  text;
    v_desc_col  text;
    v_uid_col   text;
    v_sql       text;
begin
    -- detect uid/id column
    select c.column_name
      into v_uid_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in ('uid', 'id', 'item_uid', 'item_id')
    order by case c.column_name
        when 'uid' then 1
        when 'id' then 2
        when 'item_uid' then 3
        when 'item_id' then 4
        else 999
    end
    limit 1;

    if v_uid_col is null then
        raise exception 'Could not find a UID/id column in %.%', p_source_schema, p_source_table;
    end if;

    -- detect part number column
    select c.column_name
      into v_part_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in (
          'part_no',
          'part_number',
          'pn',
          'item_code',
          'partnumber',
          'partnum'
      )
    order by case c.column_name
        when 'part_no' then 1
        when 'part_number' then 2
        when 'pn' then 3
        when 'item_code' then 4
        when 'partnumber' then 5
        when 'partnum' then 6
        else 999
    end
    limit 1;

    if v_part_col is null then
        raise exception 'Could not find a part-number-like column in %.%', p_source_schema, p_source_table;
    end if;

    -- detect cage/manufacturer column
    select c.column_name
      into v_cage_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in (
          'cage_code',
          'cage',
          'manufacturer_code',
          'mfr_code',
          'csmi',
          'source_code'
      )
    order by case c.column_name
        when 'cage_code' then 1
        when 'cage' then 2
        when 'manufacturer_code' then 3
        when 'mfr_code' then 4
        when 'csmi' then 5
        when 'source_code' then 6
        else 999
    end
    limit 1;

    -- detect description column
    select c.column_name
      into v_desc_col
    from information_schema.columns c
    where c.table_schema = p_source_schema
      and c.table_name   = p_source_table
      and c.column_name in (
          'nomenclature',
          'description',
          'item_name',
          'noun_name',
          'name'
      )
    order by case c.column_name
        when 'nomenclature' then 1
        when 'description' then 2
        when 'item_name' then 3
        when 'noun_name' then 4
        when 'name' then 5
        else 999
    end
    limit 1;

    v_sql := format($fmt$
create or replace view %I.%I as
with base_items as (
    select
        i.%I as source_uid,
        i.%I::text as source_part_no,
        lsar_meta.normalize_part_no(i.%I::text) as norm_part_no,
        %s as cage_code,
        %s as item_description
    from %I.%I i
    where i.%I is not null
),
parsed as (
    select
        b.*,
        lsar_meta.has_exactly_one_dash(b.norm_part_no) as has_one_dash,
        lsar_meta.part_base_before_last_dash(b.norm_part_no) as family_base_candidate,
        lsar_meta.part_suffix_after_last_dash(b.norm_part_no) as dash_suffix,
        lsar_meta.is_numeric_dash_suffix(b.norm_part_no) as numeric_suffix_flag
    from base_items b
),
family_counts as (
    select
        p.family_base_candidate,
        p.cage_code,
        count(*) as family_member_count
    from parsed p
    where p.has_one_dash = true
      and p.numeric_suffix_flag = true
      and p.family_base_candidate is not null
    group by p.family_base_candidate, p.cage_code
),
resolved as (
    select
        p.source_uid,
        p.source_part_no as part_no,
        p.norm_part_no,
        p.cage_code,
        p.item_description,
        p.family_base_candidate,
        p.dash_suffix,
        p.has_one_dash,
        p.numeric_suffix_flag,
        fc.family_member_count,
        b.source_uid as base_uid_exact
    from parsed p
    left join family_counts fc
      on p.family_base_candidate = fc.family_base_candidate
     and coalesce(p.cage_code, '') = coalesce(fc.cage_code, '')
    left join base_items b
      on p.family_base_candidate = b.norm_part_no
     and coalesce(p.cage_code, '') = coalesce(b.cage_code, '')
)
select
    r.source_uid,
    r.part_no,
    r.norm_part_no,

    case
        when r.has_one_dash = true
         and r.numeric_suffix_flag = true
        then r.family_base_candidate
        else r.norm_part_no
    end as family_base_part_no,

    r.base_uid_exact as family_base_uid,
    r.dash_suffix,

    case
        when r.has_one_dash = true
         and r.numeric_suffix_flag = true
         and r.base_uid_exact is not null
        then 'dash_variant_with_existing_base'

        when r.has_one_dash = true
         and r.numeric_suffix_flag = true
         and coalesce(r.family_member_count, 0) >= 2
        then 'dash_variant_family_inferred'

        when r.has_one_dash = true
         and r.numeric_suffix_flag = true
        then 'possible_dash_variant'

        else 'not_dash_variant'
    end as family_status,

    case
        when r.has_one_dash = true
         and r.numeric_suffix_flag = true
         and r.base_uid_exact is not null
        then 95

        when r.has_one_dash = true
         and r.numeric_suffix_flag = true
         and coalesce(r.family_member_count, 0) >= 2
        then 85

        when r.has_one_dash = true
         and r.numeric_suffix_flag = true
        then 65

        else 0
    end as confidence_score,

    r.family_member_count,
    r.cage_code,
    r.item_description

from resolved r;
$fmt$,
        p_target_schema,
        p_target_view,
        v_uid_col,
        v_part_col,
        v_part_col,
        case
            when v_cage_col is null then 'null::text'
            else format('i.%I::text', v_cage_col)
        end,
        case
            when v_desc_col is null then 'null::text'
            else format('i.%I::text', v_desc_col)
        end,
        p_source_schema,
        p_source_table,
        v_part_col
    );

    execute v_sql;

    raise notice 'Built %.% from %.%', p_target_schema, p_target_view, p_source_schema, p_source_table;
    raise notice 'Detected columns: uid=%, part_no=%, cage=%, description=%',
        v_uid_col, v_part_col, coalesce(v_cage_col, '<none>'), coalesce(v_desc_col, '<none>');
end;
$procedure$


CREATE OR REPLACE FUNCTION lsar_meta.has_exactly_one_dash(p_part_no text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null then false
        else length(p_part_no) - length(replace(p_part_no, '-', '')) = 1
    end
$function$


CREATE OR REPLACE FUNCTION lsar_meta.is_numeric_dash_suffix(p_part_no text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null then false
        else coalesce(lsar_meta.part_suffix_after_last_dash(p_part_no) ~ '^[0-9]+$', false)
    end
$function$


CREATE OR REPLACE FUNCTION lsar_meta.last_token(p_part_no text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null then null
        else substring(p_part_no from '[^-]+$')
    end
$function$


CREATE OR REPLACE FUNCTION lsar_meta.map_format_spec_to_pg_type(format_spec text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
declare
  s text := lower(trim(coalesce(format_spec,'')));
  n1 int; n2 int;
begin
  if s = '' then return 'text'; end if;

  if s like 'string(%' then
    if s like 'string(unlimited)%' then return 'text'; end if;
    select (regexp_match(s, 'string\((\d+)\)'))[1]::int into n1;
    return coalesce(format('varchar(%s)', n1), 'text');
  end if;

  if s like 'integer(%' then
    if s like 'integer(unlimited)%' then return 'bigint'; end if;
    select (regexp_match(s, 'integer\((\d+)\)'))[1]::int into n1;
    if n1 is null then return 'integer'; end if;
    if n1 <= 4 then return 'smallint';
    elsif n1 <= 9 then return 'integer';
    else return 'bigint';
    end if;
  end if;

  if s like 'decimal(%' then
    if s like 'decimal(unlimited%' then return 'numeric'; end if;
    select (regexp_match(s, 'decimal\((\d+),(\d+)\)'))[1]::int into n1;
    select (regexp_match(s, 'decimal\((\d+),(\d+)\)'))[2]::int into n2;
    if n1 is not null and n2 is not null then return format('numeric(%s,%s)', n1, n2); end if;
    return 'numeric';
  end if;

  if s='boolean' then return 'boolean'; end if;
  if s='date' then return 'date'; end if;

  return 'text';
end;
$function$


CREATE OR REPLACE FUNCTION lsar_meta.normalize_part_no(p_part_no text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select nullif(
        upper(
            regexp_replace(
                regexp_replace(
                    trim(coalesce(p_part_no, '')),
                    '[[:space:]_\/]+', '-', 'g'
                ),
                '-{2,}', '-', 'g'
            )
        ),
        ''
    )
$function$


CREATE OR REPLACE FUNCTION lsar_meta.part_base_before_last_dash(p_part_no text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null or position('-' in p_part_no) = 0 then p_part_no
        else regexp_replace(p_part_no, '-[^-]+$', '')
    end
$function$


CREATE OR REPLACE FUNCTION lsar_meta.part_suffix_after_last_dash(p_part_no text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null then null
        else substring(p_part_no from '[^-]+$')
    end
$function$


CREATE OR REPLACE FUNCTION lsar_meta.second_last_token(p_part_no text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null then null
        else (regexp_match(p_part_no, '-([^-]+)-[^-]+$'))[1]
    end
$function$


CREATE OR REPLACE FUNCTION lsar_meta.strip_last_token(p_part_no text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null or position('-' in p_part_no) = 0 then p_part_no
        else regexp_replace(p_part_no, '-[^-]+$', '')
    end
$function$


CREATE OR REPLACE FUNCTION lsar_meta.strip_last_two_tokens(p_part_no text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
    select case
        when p_part_no is null then null
        else regexp_replace(p_part_no, '(-[^-]+){2}$', '')
    end
$function$


