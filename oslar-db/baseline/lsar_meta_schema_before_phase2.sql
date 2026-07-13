--
-- PostgreSQL database dump
--

\restrict ftbcqTc0VsZPrAzdH5jwQi9hyERQBCWR1RrW3wOz2tYyCQp4RBb1Ajpe8ZDsdiT

-- Dumped from database version 18.3 (Debian 18.3-1.pgdg13+1)
-- Dumped by pg_dump version 18.3 (Debian 18.3-1.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: lsar_meta; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA lsar_meta;


--
-- Name: base_has_digit_before_dash(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.base_has_digit_before_dash(p_part_no text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$
    select case
        when p_part_no is null then false
        else coalesce(lsar_meta.part_base_before_last_dash(p_part_no) ~ '.*[0-9].*', false)
    end
$$;


--
-- Name: build_entities_from_dbinfo(text, text, text[], boolean); Type: PROCEDURE; Schema: lsar_meta; Owner: -
--

CREATE PROCEDURE lsar_meta.build_entities_from_dbinfo(IN p_profile_code text, IN p_target_schema text, IN p_entities text[], IN p_drop_existing boolean DEFAULT true)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: build_part_alias_view(text, text, text, text); Type: PROCEDURE; Schema: lsar_meta; Owner: -
--

CREATE PROCEDURE lsar_meta.build_part_alias_view(IN p_source_schema text DEFAULT 'cdm'::text, IN p_source_table text DEFAULT 'item_master'::text, IN p_target_schema text DEFAULT 'cdm'::text, IN p_target_view text DEFAULT 'v_part_alias_detection'::text)
    LANGUAGE plpgsql
    AS $_$
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
$_$;


--
-- Name: build_part_dash_family_view(text, text, text, text); Type: PROCEDURE; Schema: lsar_meta; Owner: -
--

CREATE PROCEDURE lsar_meta.build_part_dash_family_view(IN p_source_schema text DEFAULT 'cdm'::text, IN p_source_table text DEFAULT 'item_master'::text, IN p_target_schema text DEFAULT 'cdm'::text, IN p_target_view text DEFAULT 'v_part_dash_family_detection'::text)
    LANGUAGE plpgsql
    AS $_$
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
$_$;


--
-- Name: has_exactly_one_dash(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.has_exactly_one_dash(p_part_no text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $$
    select case
        when p_part_no is null then false
        else length(p_part_no) - length(replace(p_part_no, '-', '')) = 1
    end
$$;


--
-- Name: is_numeric_dash_suffix(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.is_numeric_dash_suffix(p_part_no text) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    select case
        when p_part_no is null then false
        else coalesce(lsar_meta.part_suffix_after_last_dash(p_part_no) ~ '^[0-9]+$', false)
    end
$_$;


--
-- Name: last_token(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.last_token(p_part_no text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
    select case
        when p_part_no is null then null
        else substring(p_part_no from '[^-]+$')
    end
$_$;


--
-- Name: map_format_spec_to_pg_type(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.map_format_spec_to_pg_type(format_spec text) RETURNS text
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: normalize_part_no(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.normalize_part_no(p_part_no text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
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
$$;


--
-- Name: part_base_before_last_dash(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.part_base_before_last_dash(p_part_no text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
    select case
        when p_part_no is null or position('-' in p_part_no) = 0 then p_part_no
        else regexp_replace(p_part_no, '-[^-]+$', '')
    end
$_$;


--
-- Name: part_suffix_after_last_dash(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.part_suffix_after_last_dash(p_part_no text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
    select case
        when p_part_no is null then null
        else substring(p_part_no from '[^-]+$')
    end
$_$;


--
-- Name: second_last_token(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.second_last_token(p_part_no text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
    select case
        when p_part_no is null then null
        else (regexp_match(p_part_no, '-([^-]+)-[^-]+$'))[1]
    end
$_$;


--
-- Name: strip_last_token(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.strip_last_token(p_part_no text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
    select case
        when p_part_no is null or position('-' in p_part_no) = 0 then p_part_no
        else regexp_replace(p_part_no, '-[^-]+$', '')
    end
$_$;


--
-- Name: strip_last_two_tokens(text); Type: FUNCTION; Schema: lsar_meta; Owner: -
--

CREATE FUNCTION lsar_meta.strip_last_two_tokens(p_part_no text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $_$
    select case
        when p_part_no is null then null
        else regexp_replace(p_part_no, '(-[^-]+){2}$', '')
    end
$_$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: part_suffix_rule; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.part_suffix_rule (
    suffix_code text NOT NULL,
    suffix_type text NOT NULL,
    strip_priority integer DEFAULT 100 NOT NULL,
    active_flag boolean DEFAULT true NOT NULL,
    notes text
);


--
-- Name: dbinfo; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.dbinfo (
    target_schema character varying(63) NOT NULL,
    entity_code character varying(10) NOT NULL,
    dtn integer NOT NULL,
    geia_short_name character varying(64) NOT NULL,
    geia_element_name text NOT NULL,
    format_spec character varying(64),
    mil_1388_field character varying(64),
    is_key boolean DEFAULT false,
    ordinal_pos integer NOT NULL,
    include_entity boolean DEFAULT true,
    include_element boolean DEFAULT true,
    mandatory_override boolean DEFAULT false,
    deprecated boolean DEFAULT false,
    tailoring_profile character varying(64) DEFAULT 'BASELINE'::character varying,
    tailoring_notes text
);


--
-- Name: dbinfo_raw; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.dbinfo_raw (
    dbinfo_id bigint NOT NULL,
    tag text,
    profile_code text,
    entity_code text,
    field text,
    geia_short_name text,
    element_name text,
    format_spec text,
    ded text,
    giea text,
    mil_1388_field text,
    def_std_00_60 text,
    s3000l text,
    ordinal_pos text,
    key text,
    is_key text,
    is_foreign text,
    is_mandatory text,
    originates_in_entity text,
    include_element text,
    mandatory_override text,
    deprecated text,
    tailoring_notes text,
    comments text
);


--
-- Name: dbinfo_raw_dbinfo_id_seq; Type: SEQUENCE; Schema: lsar_meta; Owner: -
--

CREATE SEQUENCE lsar_meta.dbinfo_raw_dbinfo_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: dbinfo_raw_dbinfo_id_seq; Type: SEQUENCE OWNED BY; Schema: lsar_meta; Owner: -
--

ALTER SEQUENCE lsar_meta.dbinfo_raw_dbinfo_id_seq OWNED BY lsar_meta.dbinfo_raw.dbinfo_id;


--
-- Name: domain; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.domain (
    domain_name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: domain_value; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.domain_value (
    domain_name text NOT NULL,
    code text NOT NULL,
    description text,
    sort_order integer,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: entity; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.entity (
    entity_code text NOT NULL,
    entity_name text,
    source_tag text,
    profile_code text,
    include_entity boolean DEFAULT true NOT NULL,
    comments text
);


--
-- Name: TABLE entity; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON TABLE lsar_meta.entity IS 'Entity-level metadata, e.g. XA, XB, CA, CB.';


--
-- Name: COLUMN entity.entity_code; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON COLUMN lsar_meta.entity.entity_code IS 'Short entity code, usually the 2-character / table identifier such as XA or XB.';


--
-- Name: entity_relationship; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.entity_relationship (
    relationship_id bigint NOT NULL,
    child_entity_code text NOT NULL,
    parent_entity_code text NOT NULL,
    constraint_name text,
    relationship_type text DEFAULT 'foreign_key'::text NOT NULL,
    fk_columns jsonb NOT NULL,
    pk_columns jsonb NOT NULL,
    active boolean DEFAULT true NOT NULL,
    comments text
);


--
-- Name: TABLE entity_relationship; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON TABLE lsar_meta.entity_relationship IS 'Metadata for child-parent relationships, including composite FK column lists.';


--
-- Name: COLUMN entity_relationship.fk_columns; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON COLUMN lsar_meta.entity_relationship.fk_columns IS 'JSON array of child columns, e.g. ["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"].';


--
-- Name: COLUMN entity_relationship.pk_columns; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON COLUMN lsar_meta.entity_relationship.pk_columns IS 'JSON array of parent columns in matching order.';


--
-- Name: entity_relationship_relationship_id_seq; Type: SEQUENCE; Schema: lsar_meta; Owner: -
--

CREATE SEQUENCE lsar_meta.entity_relationship_relationship_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entity_relationship_relationship_id_seq; Type: SEQUENCE OWNED BY; Schema: lsar_meta; Owner: -
--

ALTER SEQUENCE lsar_meta.entity_relationship_relationship_id_seq OWNED BY lsar_meta.entity_relationship.relationship_id;


--
-- Name: field_def; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.field_def (
    field_def_id bigint NOT NULL,
    entity_code text NOT NULL,
    column_name text NOT NULL,
    ordinal_pos integer,
    format_spec text,
    ded text,
    geia_short_name text,
    element_name text,
    mil_1388_field text,
    def_std_00_60 text,
    s3000l text,
    key_class text,
    is_key boolean DEFAULT false NOT NULL,
    is_foreign boolean DEFAULT false NOT NULL,
    is_mandatory boolean DEFAULT false NOT NULL,
    originates_in_entity text,
    include_element boolean DEFAULT true NOT NULL,
    mandatory_override text,
    deprecated boolean DEFAULT false NOT NULL,
    tailoring_notes text,
    comments text,
    source_row_hash text
);


--
-- Name: TABLE field_def; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON TABLE lsar_meta.field_def IS 'Normalized per-field metadata derived from dbinfo_raw.';


--
-- Name: COLUMN field_def.key_class; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON COLUMN lsar_meta.field_def.key_class IS 'Optional classification such as PK, AK, FK, PARTIAL_FK, etc.';


--
-- Name: field_def_field_def_id_seq; Type: SEQUENCE; Schema: lsar_meta; Owner: -
--

CREATE SEQUENCE lsar_meta.field_def_field_def_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: field_def_field_def_id_seq; Type: SEQUENCE OWNED BY; Schema: lsar_meta; Owner: -
--

ALTER SEQUENCE lsar_meta.field_def_field_def_id_seq OWNED BY lsar_meta.field_def.field_def_id;


--
-- Name: field_rule; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.field_rule (
    field_rule_id bigint NOT NULL,
    field_def_id bigint NOT NULL,
    rule_type text NOT NULL,
    rule_value_text text,
    rule_value_num numeric,
    rule_json jsonb,
    severity text DEFAULT 'error'::text NOT NULL,
    rule_source text,
    active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 100 NOT NULL,
    "Comments" text
);


--
-- Name: TABLE field_rule; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON TABLE lsar_meta.field_rule IS 'Machine-usable validation rules for fields.';


--
-- Name: COLUMN field_rule.rule_type; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON COLUMN lsar_meta.field_rule.rule_type IS 'Examples: required, max_length, min_length, regex, uppercase_only, allowed_values, numeric_min, numeric_max, domain_table.';


--
-- Name: COLUMN field_rule.rule_json; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON COLUMN lsar_meta.field_rule.rule_json IS 'Optional structured payload for complex rules, e.g. allowed values, conditional logic, UI hints.';


--
-- Name: COLUMN field_rule.severity; Type: COMMENT; Schema: lsar_meta; Owner: -
--

COMMENT ON COLUMN lsar_meta.field_rule.severity IS 'Typical values: error, warning, info.';


--
-- Name: field_rule_field_rule_id_seq; Type: SEQUENCE; Schema: lsar_meta; Owner: -
--

CREATE SEQUENCE lsar_meta.field_rule_field_rule_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: field_rule_field_rule_id_seq; Type: SEQUENCE OWNED BY; Schema: lsar_meta; Owner: -
--

ALTER SEQUENCE lsar_meta.field_rule_field_rule_id_seq OWNED BY lsar_meta.field_rule.field_rule_id;


--
-- Name: profile; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.profile (
    profile_code text NOT NULL,
    profile_name text,
    active boolean DEFAULT true NOT NULL,
    comments text
);


--
-- Name: profile_field_rule; Type: TABLE; Schema: lsar_meta; Owner: -
--

CREATE TABLE lsar_meta.profile_field_rule (
    profile_code text NOT NULL,
    field_rule_id bigint NOT NULL,
    active boolean DEFAULT true NOT NULL,
    override_required boolean,
    override_rule_value_text text,
    override_rule_value_num numeric,
    override_rule_json jsonb,
    comments text
);


--
-- Name: v_access_compatibility_scan; Type: VIEW; Schema: lsar_meta; Owner: -
--

CREATE VIEW lsar_meta.v_access_compatibility_scan AS
 WITH base_objs AS (
         SELECT n.nspname AS schema_name,
            c.relname AS object_name,
            c.relkind
           FROM (pg_class c
             JOIN pg_namespace n ON ((n.oid = c.relnamespace)))
          WHERE ((n.nspname = ANY (ARRAY['cdm'::name, 'lsar_meta'::name, 'stage'::name])) AND (c.relkind = ANY (ARRAY['r'::"char", 'p'::"char", 'v'::"char", 'm'::"char"])))
        ), pk_info AS (
         SELECT tc.table_schema,
            tc.table_name,
            count(*) AS pk_col_count,
            string_agg((kcu.column_name)::text, ', '::text ORDER BY kcu.ordinal_position) AS pk_columns
           FROM (information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu ON ((((tc.constraint_name)::name = (kcu.constraint_name)::name) AND ((tc.table_schema)::name = (kcu.table_schema)::name) AND ((tc.table_name)::name = (kcu.table_name)::name))))
          WHERE (((tc.constraint_type)::text = 'PRIMARY KEY'::text) AND ((tc.table_schema)::name = ANY (ARRAY['cdm'::name, 'lsar_meta'::name, 'stage'::name])))
          GROUP BY tc.table_schema, tc.table_name
        ), bad_cols AS (
         SELECT c.table_schema,
            c.table_name,
            count(*) FILTER (WHERE (((c.data_type)::text = ANY (ARRAY[('ARRAY'::character varying)::text, ('json'::character varying)::text, ('jsonb'::character varying)::text, ('xml'::character varying)::text, ('bytea'::character varying)::text])) OR ((c.data_type)::text = 'USER-DEFINED'::text))) AS risky_col_count,
            string_agg((((((c.column_name)::text || ' ('::text) || (c.data_type)::text) || COALESCE(('/'::text || (c.udt_name)::text), ''::text)) || ')'::text), ', '::text ORDER BY c.ordinal_position) FILTER (WHERE (((c.data_type)::text = ANY (ARRAY[('ARRAY'::character varying)::text, ('json'::character varying)::text, ('jsonb'::character varying)::text, ('xml'::character varying)::text, ('bytea'::character varying)::text])) OR ((c.data_type)::text = 'USER-DEFINED'::text))) AS risky_columns
           FROM information_schema.columns c
          WHERE ((c.table_schema)::name = ANY (ARRAY['cdm'::name, 'lsar_meta'::name, 'stage'::name]))
          GROUP BY c.table_schema, c.table_name
        )
 SELECT b.schema_name,
    b.object_name,
        CASE b.relkind
            WHEN 'r'::"char" THEN 'table'::text
            WHEN 'p'::"char" THEN 'partitioned_table'::text
            WHEN 'v'::"char" THEN 'view'::text
            WHEN 'm'::"char" THEN 'materialized_view'::text
            ELSE NULL::text
        END AS object_type,
    COALESCE(p.pk_columns, ''::text) AS pk_columns,
    COALESCE(bc.risky_col_count, (0)::bigint) AS risky_col_count,
    COALESCE(bc.risky_columns, ''::text) AS risky_columns,
        CASE
            WHEN (b.relkind = ANY (ARRAY['v'::"char", 'm'::"char"])) THEN 'HIGH'::text
            WHEN (p.pk_columns IS NULL) THEN 'HIGH'::text
            WHEN (p.pk_col_count > 1) THEN 'HIGH'::text
            WHEN (COALESCE(bc.risky_col_count, (0)::bigint) > 0) THEN 'MEDIUM'::text
            ELSE 'LOW'::text
        END AS access_risk,
        CASE
            WHEN (b.relkind = ANY (ARRAY['v'::"char", 'm'::"char"])) THEN 'Use read-only in Access or expose via table'::text
            WHEN (p.pk_columns IS NULL) THEN 'Add primary key'::text
            WHEN (p.pk_col_count > 1) THEN 'Add surrogate integer key for Access'::text
            WHEN (COALESCE(bc.risky_col_count, (0)::bigint) > 0) THEN 'Review/flatten risky columns for Access'::text
            ELSE 'Likely Access-safe'::text
        END AS recommendation
   FROM ((base_objs b
     LEFT JOIN pk_info p ON ((((p.table_schema)::name = b.schema_name) AND ((p.table_name)::name = b.object_name))))
     LEFT JOIN bad_cols bc ON ((((bc.table_schema)::name = b.schema_name) AND ((bc.table_name)::name = b.object_name))));


--
-- Name: v_active_field_rule; Type: VIEW; Schema: lsar_meta; Owner: -
--

CREATE VIEW lsar_meta.v_active_field_rule AS
 SELECT fr.field_rule_id,
    fd.entity_code,
    fd.column_name,
    fd.ordinal_pos,
    fr.rule_type,
    fr.rule_value_text,
    fr.rule_value_num,
    fr.rule_json,
    fr.severity,
    fr.rule_source,
    fr.sort_order
   FROM (lsar_meta.field_rule fr
     JOIN lsar_meta.field_def fd ON ((fd.field_def_id = fr.field_def_id)))
  WHERE (fr.active = true)
  ORDER BY fd.entity_code, fd.ordinal_pos, fr.sort_order, fr.field_rule_id;


--
-- Name: v_dbinfo; Type: VIEW; Schema: lsar_meta; Owner: -
--

CREATE VIEW lsar_meta.v_dbinfo AS
 SELECT COALESCE(NULLIF(profile_code, ''::text), 'BASELINE'::text) AS profile_code,
    upper(entity_code) AS entity_code,
    (ded)::integer AS dtn,
    field AS db_field_name,
    geia_short_name,
    element_name AS geia_element_name,
    format_spec,
    mil_1388_field,
    def_std_00_60 AS def_std_00_60_column,
    s3000l,
    (NULLIF(ordinal_pos, ''::text))::integer AS ordinal_pos,
    (lower(is_key) = ANY (ARRAY['true'::text, 't'::text, '1'::text, 'yes'::text, 'y'::text])) AS is_key,
    (lower(is_foreign) = ANY (ARRAY['true'::text, 't'::text, '1'::text, 'yes'::text, 'y'::text])) AS is_foreign,
    (lower(is_mandatory) = ANY (ARRAY['true'::text, 't'::text, '1'::text, 'yes'::text, 'y'::text])) AS is_mandatory,
    originates_in_entity,
    (COALESCE(lower(include_element), 'true'::text) = ANY (ARRAY['true'::text, 't'::text, '1'::text, 'yes'::text, 'y'::text])) AS include_element,
    (lower(mandatory_override) = ANY (ARRAY['true'::text, 't'::text, '1'::text, 'yes'::text, 'y'::text])) AS mandatory_override,
    (lower(deprecated) = ANY (ARRAY['true'::text, 't'::text, '1'::text, 'yes'::text, 'y'::text])) AS deprecated,
    tailoring_notes,
    comments
   FROM lsar_meta.dbinfo_raw
  WHERE ((NULLIF(entity_code, ''::text) IS NOT NULL) AND (NULLIF(ded, ''::text) IS NOT NULL) AND (NULLIF(field, ''::text) IS NOT NULL));


--
-- Name: v_field_def_enriched; Type: VIEW; Schema: lsar_meta; Owner: -
--

CREATE VIEW lsar_meta.v_field_def_enriched AS
 SELECT fd.field_def_id,
    fd.entity_code,
    e.entity_name,
    fd.column_name,
    fd.ordinal_pos,
    fd.format_spec,
    fd.ded,
    fd.geia_short_name,
    fd.element_name,
    fd.mil_1388_field,
    fd.def_std_00_60,
    fd.s3000l,
    fd.key_class,
    fd.is_key,
    fd.is_foreign,
    fd.is_mandatory,
    fd.originates_in_entity,
    fd.include_element,
    fd.mandatory_override,
    fd.deprecated,
    fd.tailoring_notes,
    fd.comments
   FROM (lsar_meta.field_def fd
     LEFT JOIN lsar_meta.entity e ON ((e.entity_code = fd.entity_code)));


--
-- Name: dbinfo_raw dbinfo_id; Type: DEFAULT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.dbinfo_raw ALTER COLUMN dbinfo_id SET DEFAULT nextval('lsar_meta.dbinfo_raw_dbinfo_id_seq'::regclass);


--
-- Name: entity_relationship relationship_id; Type: DEFAULT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.entity_relationship ALTER COLUMN relationship_id SET DEFAULT nextval('lsar_meta.entity_relationship_relationship_id_seq'::regclass);


--
-- Name: field_def field_def_id; Type: DEFAULT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.field_def ALTER COLUMN field_def_id SET DEFAULT nextval('lsar_meta.field_def_field_def_id_seq'::regclass);


--
-- Name: field_rule field_rule_id; Type: DEFAULT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.field_rule ALTER COLUMN field_rule_id SET DEFAULT nextval('lsar_meta.field_rule_field_rule_id_seq'::regclass);


--
-- Name: dbinfo dbinfo_pk; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.dbinfo
    ADD CONSTRAINT dbinfo_pk PRIMARY KEY (target_schema, entity_code, dtn);


--
-- Name: dbinfo_raw dbinfo_raw_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.dbinfo_raw
    ADD CONSTRAINT dbinfo_raw_pkey PRIMARY KEY (dbinfo_id);


--
-- Name: domain domain_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.domain
    ADD CONSTRAINT domain_pkey PRIMARY KEY (domain_name);


--
-- Name: domain_value domain_value_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.domain_value
    ADD CONSTRAINT domain_value_pkey PRIMARY KEY (domain_name, code);


--
-- Name: entity entity_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.entity
    ADD CONSTRAINT entity_pkey PRIMARY KEY (entity_code);


--
-- Name: entity_relationship entity_relationship_child_entity_code_parent_entity_code_co_key; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.entity_relationship
    ADD CONSTRAINT entity_relationship_child_entity_code_parent_entity_code_co_key UNIQUE (child_entity_code, parent_entity_code, constraint_name);


--
-- Name: entity_relationship entity_relationship_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.entity_relationship
    ADD CONSTRAINT entity_relationship_pkey PRIMARY KEY (relationship_id);


--
-- Name: field_def field_def_entity_code_column_name_key; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.field_def
    ADD CONSTRAINT field_def_entity_code_column_name_key UNIQUE (entity_code, column_name);


--
-- Name: field_def field_def_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.field_def
    ADD CONSTRAINT field_def_pkey PRIMARY KEY (field_def_id);


--
-- Name: field_rule field_rule_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.field_rule
    ADD CONSTRAINT field_rule_pkey PRIMARY KEY (field_rule_id);


--
-- Name: part_suffix_rule part_suffix_rule_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.part_suffix_rule
    ADD CONSTRAINT part_suffix_rule_pkey PRIMARY KEY (suffix_code);


--
-- Name: profile_field_rule profile_field_rule_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.profile_field_rule
    ADD CONSTRAINT profile_field_rule_pkey PRIMARY KEY (profile_code, field_rule_id);


--
-- Name: profile profile_pkey; Type: CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.profile
    ADD CONSTRAINT profile_pkey PRIMARY KEY (profile_code);


--
-- Name: ix_domain_value_active; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_domain_value_active ON lsar_meta.domain_value USING btree (domain_name, active, sort_order);


--
-- Name: ix_entity_rel_child; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_entity_rel_child ON lsar_meta.entity_relationship USING btree (child_entity_code);


--
-- Name: ix_entity_rel_parent; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_entity_rel_parent ON lsar_meta.entity_relationship USING btree (parent_entity_code);


--
-- Name: ix_field_def_entity; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_field_def_entity ON lsar_meta.field_def USING btree (entity_code);


--
-- Name: ix_field_def_entity_ordinal; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_field_def_entity_ordinal ON lsar_meta.field_def USING btree (entity_code, ordinal_pos);


--
-- Name: ix_field_def_originates_in; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_field_def_originates_in ON lsar_meta.field_def USING btree (originates_in_entity);


--
-- Name: ix_field_rule_active; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_field_rule_active ON lsar_meta.field_rule USING btree (active);


--
-- Name: ix_field_rule_field_def; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_field_rule_field_def ON lsar_meta.field_rule USING btree (field_def_id);


--
-- Name: ix_field_rule_type; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_field_rule_type ON lsar_meta.field_rule USING btree (rule_type);


--
-- Name: ix_profile_field_rule_active; Type: INDEX; Schema: lsar_meta; Owner: -
--

CREATE INDEX ix_profile_field_rule_active ON lsar_meta.profile_field_rule USING btree (profile_code, active);


--
-- Name: domain_value domain_value_domain_name_fkey; Type: FK CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.domain_value
    ADD CONSTRAINT domain_value_domain_name_fkey FOREIGN KEY (domain_name) REFERENCES lsar_meta.domain(domain_name) ON DELETE CASCADE;


--
-- Name: entity_relationship entity_relationship_child_entity_code_fkey; Type: FK CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.entity_relationship
    ADD CONSTRAINT entity_relationship_child_entity_code_fkey FOREIGN KEY (child_entity_code) REFERENCES lsar_meta.entity(entity_code) ON DELETE CASCADE;


--
-- Name: entity_relationship entity_relationship_parent_entity_code_fkey; Type: FK CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.entity_relationship
    ADD CONSTRAINT entity_relationship_parent_entity_code_fkey FOREIGN KEY (parent_entity_code) REFERENCES lsar_meta.entity(entity_code) ON DELETE CASCADE;


--
-- Name: field_def field_def_entity_code_fkey; Type: FK CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.field_def
    ADD CONSTRAINT field_def_entity_code_fkey FOREIGN KEY (entity_code) REFERENCES lsar_meta.entity(entity_code) ON DELETE CASCADE;


--
-- Name: field_rule field_rule_field_def_id_fkey; Type: FK CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.field_rule
    ADD CONSTRAINT field_rule_field_def_id_fkey FOREIGN KEY (field_def_id) REFERENCES lsar_meta.field_def(field_def_id) ON DELETE CASCADE;


--
-- Name: profile_field_rule profile_field_rule_field_rule_id_fkey; Type: FK CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.profile_field_rule
    ADD CONSTRAINT profile_field_rule_field_rule_id_fkey FOREIGN KEY (field_rule_id) REFERENCES lsar_meta.field_rule(field_rule_id) ON DELETE CASCADE;


--
-- Name: profile_field_rule profile_field_rule_profile_code_fkey; Type: FK CONSTRAINT; Schema: lsar_meta; Owner: -
--

ALTER TABLE ONLY lsar_meta.profile_field_rule
    ADD CONSTRAINT profile_field_rule_profile_code_fkey FOREIGN KEY (profile_code) REFERENCES lsar_meta.profile(profile_code) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ftbcqTc0VsZPrAzdH5jwQi9hyERQBCWR1RrW3wOz2tYyCQp4RBb1Ajpe8ZDsdiT

