#!/usr/bin/env python3
"""
S1000D V2 loader for OSLAR

Purpose
-------
1. Scan a package directory for S1000D XML files
2. Parse safely with namespace awareness
3. Fingerprint each file so re-runs are idempotent
4. Store raw XML in s1000d_stage.raw_xml
5. Extract key metadata into s1000d_stage.dm_parsed / pm_parsed / icn_parsed
6. Record load errors in s1000d_stage.load_error

Environment variables
---------------------
DB_NAME=open_lsar
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=postgres
DB_PORT=5432
S1000D_DATA_DIR=/app/data/s1000d_packages
S1000D_ARCHIVE_DIR=/app/data/s1000d_archive
S1000D_MOVE_AFTER_LOAD=false
S1000D_LOG_LEVEL=INFO

Notes
-----
- Uses lxml for better namespace + XML handling.
- Does not try to fully normalize all S1000D content yet.
- Designed to be deterministic, debuggable, and safe to rerun.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import psycopg2
import psycopg2.extras
from lxml import etree


LOG_LEVEL = os.getenv("S1000D_LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("s1000d-loader")

DATA_DIR = Path(os.getenv("S1000D_DATA_DIR", "/app/data/s1000d_packages"))
ARCHIVE_DIR = Path(os.getenv("S1000D_ARCHIVE_DIR", "/app/data/s1000d_archive"))
MOVE_AFTER_LOAD = os.getenv("S1000D_MOVE_AFTER_LOAD", "false").lower() == "true"

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "open_lsar"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "postgres"),
    "port": int(os.getenv("DB_PORT", "5432")),
}

XML_FILES = (".xml", ".XML")


@dataclass
class ParsedDocument:
    filename: str
    filepath: str
    file_hash: str
    root_tag: str
    doc_type: str
    dmc: str | None = None
    pmc: str | None = None
    icn: str | None = None
    issue_info: str | None = None
    language_code: str | None = None
    country_iso_code: str | None = None
    title: str | None = None
    raw_xml: str | None = None
    source_ident_json: dict[str, Any] | None = None
    metadata_json: dict[str, Any] | None = None


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def list_xml_files(data_dir: Path) -> list[Path]:
    if not data_dir.exists():
        raise FileNotFoundError(f"S1000D data directory does not exist: {data_dir}")
    return sorted([p for p in data_dir.rglob("*") if p.is_file() and p.suffix in XML_FILES])


def parse_xml(xml_text: str) -> etree._Element:
    parser = etree.XMLParser(
        recover=False,
        remove_blank_text=False,
        resolve_entities=False,
        no_network=True,
        huge_tree=True,
    )
    return etree.fromstring(xml_text.encode("utf-8"), parser=parser)


def local_name(tag: str) -> str:
    return etree.QName(tag).localname if tag.startswith("{") else tag


def find_first(root: etree._Element, names: Iterable[str]) -> etree._Element | None:
    wanted = set(names)
    for elem in root.iter():
        if local_name(elem.tag) in wanted:
            return elem
    return None


def find_all(root: etree._Element, names: Iterable[str]) -> list[etree._Element]:
    wanted = set(names)
    return [elem for elem in root.iter() if local_name(elem.tag) in wanted]


def first_text(root: etree._Element, names: Iterable[str]) -> str | None:
    elem = find_first(root, names)
    if elem is None:
        return None
    text = " ".join(t.strip() for t in elem.itertext() if t and t.strip())
    return text or None


def attrs(elem: etree._Element | None) -> dict[str, str]:
    return dict(elem.attrib) if elem is not None else {}


def detect_doc_type(root: etree._Element) -> str:
    lname = local_name(root.tag)
    if lname == "dmodule":
        return "DMC"
    if lname == "pm":
        return "PMC"
    if lname == "comment":
        return "COMMENT"
    if lname == "ddn":
        return "DDN"
    if lname == "illustratedPartsCatalog" or lname == "catalogSeqNumber":
        return "IPC_FRAGMENT"

    # Fallback by known descendant tags
    if find_first(root, ["dmCode"]):
        return "DMC"
    if find_first(root, ["pmCode"]):
        return "PMC"
    if find_first(root, ["infoEntityIdent", "icnMetadataFile"]) is not None:
        return "ICN"
    return "UNKNOWN"


DM_CODE_KEYS = [
    "modelIdentCode",
    "systemDiffCode",
    "systemCode",
    "subSystemCode",
    "subSubSystemCode",
    "assyCode",
    "disassyCode",
    "disassyCodeVariant",
    "infoCode",
    "infoCodeVariant",
    "itemLocationCode",
    "learnCode",
    "learnEventCode",
]

PM_CODE_KEYS = [
    "modelIdentCode",
    "pmIssuer",
    "pmNumber",
    "pmVolume",
]


def compose_dm_code(dm_attrs: dict[str, str]) -> str | None:
    if not dm_attrs:
        return None
    parts = [dm_attrs.get(k, "") for k in DM_CODE_KEYS]
    if not any(parts):
        return None
    return "-".join(parts)


def compose_pm_code(pm_attrs: dict[str, str]) -> str | None:
    if not pm_attrs:
        return None
    parts = [pm_attrs.get(k, "") for k in PM_CODE_KEYS]
    if not any(parts):
        return None
    return "-".join(parts)


def detect_issue_info(root: etree._Element) -> str | None:
    issue_info = find_first(root, ["issueInfo"])
    if issue_info is not None:
        issue_number = issue_info.attrib.get("issueNumber")
        in_work = issue_info.attrib.get("inWork")
        if issue_number or in_work:
            return f"issueNumber={issue_number or ''};inWork={in_work or ''}"

    issno = find_first(root, ["issno"])
    if issno is not None:
        return json.dumps(attrs(issno), ensure_ascii=False)
    return None


def detect_language(root: etree._Element) -> tuple[str | None, str | None]:
    lang = find_first(root, ["language"])
    if lang is None:
        return None, None
    return lang.attrib.get("languageIsoCode"), lang.attrib.get("countryIsoCode")


def detect_title(root: etree._Element, doc_type: str) -> str | None:
    if doc_type == "DMC":
        return first_text(root, ["techName", "infoName", "title"]) or first_text(root, ["dmTitle"])
    if doc_type == "PMC":
        return first_text(root, ["pmTitle", "shortPmTitle", "title"])
    if doc_type == "ICN":
        return first_text(root, ["title", "graphicTitle", "legendTitle"])
    return first_text(root, ["title", "techName", "infoName"])


def extract_icn(root: etree._Element) -> str | None:
    info_entity = find_first(root, ["infoEntityIdent"])
    if info_entity is not None:
        for key in ("infoEntityRefIdent", "infoEntityIdent", "entityId", "id"):
            if info_entity.attrib.get(key):
                return info_entity.attrib[key]

    icn_meta = find_first(root, ["icnMetadataFile"])
    if icn_meta is not None:
        for key in ("infoEntityRefIdent", "id"):
            if icn_meta.attrib.get(key):
                return icn_meta.attrib[key]
    return None


def extract_source_ident(root: etree._Element, doc_type: str) -> dict[str, Any]:
    dm_code = attrs(find_first(root, ["dmCode"]))
    pm_code = attrs(find_first(root, ["pmCode"]))
    issue_info = attrs(find_first(root, ["issueInfo"]))
    language = attrs(find_first(root, ["language"]))
    info_entity = attrs(find_first(root, ["infoEntityIdent"]))

    payload = {
        "doc_type": doc_type,
        "dmCode": dm_code or None,
        "pmCode": pm_code or None,
        "issueInfo": issue_info or None,
        "language": language or None,
        "infoEntityIdent": info_entity or None,
    }
    return payload


def extract_metadata(root: etree._Element, doc_type: str) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "root_tag": local_name(root.tag),
        "doc_type": doc_type,
        "status": attrs(find_first(root, ["dmStatus", "pmStatus"])),
        "responsible_partner_company": attrs(find_first(root, ["responsiblePartnerCompany"])),
        "originator": attrs(find_first(root, ["originator"])),
        "applic": attrs(find_first(root, ["applic"])),
        "brexDmRef": attrs(find_first(root, ["brexDmRef"])),
        "refs_count": len(find_all(root, ["dmRef", "pmRef", "externalPubRef", "refdm"])),
        "graphics_count": len(find_all(root, ["graphic", "symbol", "sheet"])),
        "tables_count": len(find_all(root, ["table", "internalRefTable"])),
    }
    return payload


def parse_document(file_path: Path) -> ParsedDocument:
    xml_text = file_path.read_text(encoding="utf-8")
    root = parse_xml(xml_text)

    doc_type = detect_doc_type(root)
    dm_code_attrs = attrs(find_first(root, ["dmCode"]))
    pm_code_attrs = attrs(find_first(root, ["pmCode"]))
    dmc = compose_dm_code(dm_code_attrs)
    pmc = compose_pm_code(pm_code_attrs)
    icn = extract_icn(root)
    issue_info = detect_issue_info(root)
    language_code, country_iso_code = detect_language(root)
    title = detect_title(root, doc_type)

    return ParsedDocument(
        filename=file_path.name,
        filepath=str(file_path),
        file_hash=sha256_text(xml_text),
        root_tag=local_name(root.tag),
        doc_type=doc_type,
        dmc=dmc,
        pmc=pmc,
        icn=icn,
        issue_info=issue_info,
        language_code=language_code,
        country_iso_code=country_iso_code,
        title=title,
        raw_xml=xml_text,
        source_ident_json=extract_source_ident(root, doc_type),
        metadata_json=extract_metadata(root, doc_type),
    )


DDL = """
CREATE SCHEMA IF NOT EXISTS s1000d_stage;

CREATE TABLE IF NOT EXISTS s1000d_stage.raw_xml (
    id                  BIGSERIAL PRIMARY KEY,
    filename            TEXT NOT NULL,
    filepath            TEXT,
    file_hash           TEXT NOT NULL UNIQUE,
    root_tag            TEXT,
    doc_type            TEXT,
    dmc                 TEXT,
    pmc                 TEXT,
    icn                 TEXT,
    issue_info          TEXT,
    language_code       TEXT,
    country_iso_code    TEXT,
    title               TEXT,
    source_ident_json   JSONB,
    metadata_json       JSONB,
    xml_content         XML NOT NULL,
    loaded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_raw_xml_doc_type ON s1000d_stage.raw_xml (doc_type);
CREATE INDEX IF NOT EXISTS ix_raw_xml_dmc ON s1000d_stage.raw_xml (dmc);
CREATE INDEX IF NOT EXISTS ix_raw_xml_pmc ON s1000d_stage.raw_xml (pmc);
CREATE INDEX IF NOT EXISTS ix_raw_xml_icn ON s1000d_stage.raw_xml (icn);
CREATE INDEX IF NOT EXISTS ix_raw_xml_filename ON s1000d_stage.raw_xml (filename);

CREATE TABLE IF NOT EXISTS s1000d_stage.dm_parsed (
    raw_id              BIGINT PRIMARY KEY REFERENCES s1000d_stage.raw_xml(id) ON DELETE CASCADE,
    dmc                 TEXT,
    title               TEXT,
    issue_info          TEXT,
    language_code       TEXT,
    country_iso_code    TEXT,
    model_ident_code    TEXT,
    system_diff_code    TEXT,
    system_code         TEXT,
    sub_system_code     TEXT,
    sub_sub_system_code TEXT,
    assy_code           TEXT,
    disassy_code        TEXT,
    disassy_variant     TEXT,
    info_code           TEXT,
    info_code_variant   TEXT,
    item_location_code  TEXT,
    learn_code          TEXT,
    learn_event_code    TEXT,
    metadata_json       JSONB,
    loaded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_dm_parsed_dmc ON s1000d_stage.dm_parsed (dmc);
CREATE INDEX IF NOT EXISTS ix_dm_parsed_system_code ON s1000d_stage.dm_parsed (system_code);

CREATE TABLE IF NOT EXISTS s1000d_stage.pm_parsed (
    raw_id              BIGINT PRIMARY KEY REFERENCES s1000d_stage.raw_xml(id) ON DELETE CASCADE,
    pmc                 TEXT,
    title               TEXT,
    issue_info          TEXT,
    language_code       TEXT,
    country_iso_code    TEXT,
    model_ident_code    TEXT,
    pm_issuer           TEXT,
    pm_number           TEXT,
    pm_volume           TEXT,
    metadata_json       JSONB,
    loaded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_pm_parsed_pmc ON s1000d_stage.pm_parsed (pmc);

CREATE TABLE IF NOT EXISTS s1000d_stage.icn_parsed (
    raw_id              BIGINT PRIMARY KEY REFERENCES s1000d_stage.raw_xml(id) ON DELETE CASCADE,
    icn                 TEXT,
    title               TEXT,
    issue_info          TEXT,
    language_code       TEXT,
    country_iso_code    TEXT,
    metadata_json       JSONB,
    loaded_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_icn_parsed_icn ON s1000d_stage.icn_parsed (icn);

CREATE TABLE IF NOT EXISTS s1000d_stage.load_error (
    id                  BIGSERIAL PRIMARY KEY,
    filename            TEXT,
    filepath            TEXT,
    error_type          TEXT,
    error_message       TEXT,
    stack_hint          TEXT,
    logged_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
"""


def ensure_schema(conn: psycopg2.extensions.connection) -> None:
    with conn.cursor() as cur:
        cur.execute(DDL)
    conn.commit()


def already_loaded(cur: psycopg2.extensions.cursor, file_hash: str) -> bool:
    cur.execute(
        "SELECT 1 FROM s1000d_stage.raw_xml WHERE file_hash = %s LIMIT 1",
        (file_hash,),
    )
    return cur.fetchone() is not None


def insert_raw(cur: psycopg2.extensions.cursor, doc: ParsedDocument) -> int:
    cur.execute(
        """
        INSERT INTO s1000d_stage.raw_xml (
            filename, filepath, file_hash, root_tag, doc_type,
            dmc, pmc, icn, issue_info, language_code, country_iso_code,
            title, source_ident_json, metadata_json, xml_content
        )
        VALUES (
            %(filename)s, %(filepath)s, %(file_hash)s, %(root_tag)s, %(doc_type)s,
            %(dmc)s, %(pmc)s, %(icn)s, %(issue_info)s, %(language_code)s, %(country_iso_code)s,
            %(title)s, %(source_ident_json)s::jsonb, %(metadata_json)s::jsonb, %(raw_xml)s
        )
        RETURNING id
        """,
        {
            **doc.__dict__,
            "source_ident_json": json.dumps(doc.source_ident_json or {}, ensure_ascii=False),
            "metadata_json": json.dumps(doc.metadata_json or {}, ensure_ascii=False),
        },
    )
    return int(cur.fetchone()[0])


def upsert_dm_parsed(cur: psycopg2.extensions.cursor, raw_id: int, doc: ParsedDocument) -> None:
    dm_code = (doc.source_ident_json or {}).get("dmCode") or {}
    cur.execute(
        """
        INSERT INTO s1000d_stage.dm_parsed (
            raw_id, dmc, title, issue_info, language_code, country_iso_code,
            model_ident_code, system_diff_code, system_code, sub_system_code,
            sub_sub_system_code, assy_code, disassy_code, disassy_variant,
            info_code, info_code_variant, item_location_code, learn_code,
            learn_event_code, metadata_json
        )
        VALUES (
            %(raw_id)s, %(dmc)s, %(title)s, %(issue_info)s, %(language_code)s, %(country_iso_code)s,
            %(modelIdentCode)s, %(systemDiffCode)s, %(systemCode)s, %(subSystemCode)s,
            %(subSubSystemCode)s, %(assyCode)s, %(disassyCode)s, %(disassyCodeVariant)s,
            %(infoCode)s, %(infoCodeVariant)s, %(itemLocationCode)s, %(learnCode)s,
            %(learnEventCode)s, %(metadata_json)s::jsonb
        )
        ON CONFLICT (raw_id) DO UPDATE SET
            dmc = EXCLUDED.dmc,
            title = EXCLUDED.title,
            issue_info = EXCLUDED.issue_info,
            language_code = EXCLUDED.language_code,
            country_iso_code = EXCLUDED.country_iso_code,
            model_ident_code = EXCLUDED.model_ident_code,
            system_diff_code = EXCLUDED.system_diff_code,
            system_code = EXCLUDED.system_code,
            sub_system_code = EXCLUDED.sub_system_code,
            sub_sub_system_code = EXCLUDED.sub_sub_system_code,
            assy_code = EXCLUDED.assy_code,
            disassy_code = EXCLUDED.disassy_code,
            disassy_variant = EXCLUDED.disassy_variant,
            info_code = EXCLUDED.info_code,
            info_code_variant = EXCLUDED.info_code_variant,
            item_location_code = EXCLUDED.item_location_code,
            learn_code = EXCLUDED.learn_code,
            learn_event_code = EXCLUDED.learn_event_code,
            metadata_json = EXCLUDED.metadata_json,
            loaded_at = now()
        """,
        {
            "raw_id": raw_id,
            "dmc": doc.dmc,
            "title": doc.title,
            "issue_info": doc.issue_info,
            "language_code": doc.language_code,
            "country_iso_code": doc.country_iso_code,
            "metadata_json": json.dumps(doc.metadata_json or {}, ensure_ascii=False),
            **{k: dm_code.get(k) for k in DM_CODE_KEYS},
        },
    )


def upsert_pm_parsed(cur: psycopg2.extensions.cursor, raw_id: int, doc: ParsedDocument) -> None:
    pm_code = (doc.source_ident_json or {}).get("pmCode") or {}
    cur.execute(
        """
        INSERT INTO s1000d_stage.pm_parsed (
            raw_id, pmc, title, issue_info, language_code, country_iso_code,
            model_ident_code, pm_issuer, pm_number, pm_volume, metadata_json
        )
        VALUES (
            %(raw_id)s, %(pmc)s, %(title)s, %(issue_info)s, %(language_code)s, %(country_iso_code)s,
            %(modelIdentCode)s, %(pmIssuer)s, %(pmNumber)s, %(pmVolume)s, %(metadata_json)s::jsonb
        )
        ON CONFLICT (raw_id) DO UPDATE SET
            pmc = EXCLUDED.pmc,
            title = EXCLUDED.title,
            issue_info = EXCLUDED.issue_info,
            language_code = EXCLUDED.language_code,
            country_iso_code = EXCLUDED.country_iso_code,
            model_ident_code = EXCLUDED.model_ident_code,
            pm_issuer = EXCLUDED.pm_issuer,
            pm_number = EXCLUDED.pm_number,
            pm_volume = EXCLUDED.pm_volume,
            metadata_json = EXCLUDED.metadata_json,
            loaded_at = now()
        """,
        {
            "raw_id": raw_id,
            "pmc": doc.pmc,
            "title": doc.title,
            "issue_info": doc.issue_info,
            "language_code": doc.language_code,
            "country_iso_code": doc.country_iso_code,
            "metadata_json": json.dumps(doc.metadata_json or {}, ensure_ascii=False),
            **{k: pm_code.get(k) for k in PM_CODE_KEYS},
        },
    )


def upsert_icn_parsed(cur: psycopg2.extensions.cursor, raw_id: int, doc: ParsedDocument) -> None:
    cur.execute(
        """
        INSERT INTO s1000d_stage.icn_parsed (
            raw_id, icn, title, issue_info, language_code, country_iso_code, metadata_json
        )
        VALUES (
            %(raw_id)s, %(icn)s, %(title)s, %(issue_info)s, %(language_code)s, %(country_iso_code)s,
            %(metadata_json)s::jsonb
        )
        ON CONFLICT (raw_id) DO UPDATE SET
            icn = EXCLUDED.icn,
            title = EXCLUDED.title,
            issue_info = EXCLUDED.issue_info,
            language_code = EXCLUDED.language_code,
            country_iso_code = EXCLUDED.country_iso_code,
            metadata_json = EXCLUDED.metadata_json,
            loaded_at = now()
        """,
        {
            "raw_id": raw_id,
            "icn": doc.icn,
            "title": doc.title,
            "issue_info": doc.issue_info,
            "language_code": doc.language_code,
            "country_iso_code": doc.country_iso_code,
            "metadata_json": json.dumps(doc.metadata_json or {}, ensure_ascii=False),
        },
    )


def record_error(
    conn: psycopg2.extensions.connection,
    filename: str,
    filepath: str,
    error_type: str,
    error_message: str,
    stack_hint: str | None = None,
) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO s1000d_stage.load_error (
                filename, filepath, error_type, error_message, stack_hint
            ) VALUES (%s, %s, %s, %s, %s)
            """,
            (filename, filepath, error_type, error_message[:4000], stack_hint),
        )
    conn.commit()


def archive_file(path: Path) -> None:
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    target = ARCHIVE_DIR / path.name
    if target.exists():
        stem = path.stem
        suffix = path.suffix
        counter = 1
        while True:
            alt = ARCHIVE_DIR / f"{stem}_{counter}{suffix}"
            if not alt.exists():
                target = alt
                break
            counter += 1
    shutil.move(str(path), str(target))
    logger.info("Archived %s -> %s", path, target)


def process_file(conn: psycopg2.extensions.connection, path: Path) -> str:
    try:
        doc = parse_document(path)
    except Exception as exc:
        logger.exception("Parse failed for %s", path.name)
        record_error(conn, path.name, str(path), type(exc).__name__, str(exc), "parse_document")
        return "error"

    with conn.cursor() as cur:
        if already_loaded(cur, doc.file_hash):
            logger.info("Skipping already-loaded file %s", path.name)
            conn.rollback()
            return "skipped"

        try:
            raw_id = insert_raw(cur, doc)
            if doc.doc_type == "DMC":
                upsert_dm_parsed(cur, raw_id, doc)
            elif doc.doc_type == "PMC":
                upsert_pm_parsed(cur, raw_id, doc)
            elif doc.doc_type == "ICN":
                upsert_icn_parsed(cur, raw_id, doc)

            conn.commit()
            logger.info(
                "Loaded %-30s type=%-7s dmc=%s pmc=%s icn=%s",
                path.name,
                doc.doc_type,
                doc.dmc,
                doc.pmc,
                doc.icn,
            )
        except Exception as exc:
            conn.rollback()
            logger.exception("Database load failed for %s", path.name)
            record_error(conn, path.name, str(path), type(exc).__name__, str(exc), "insert/upsert")
            return "error"

    if MOVE_AFTER_LOAD:
        archive_file(path)

    return "loaded"


def main() -> int:
    logger.info("Starting S1000D V2 loader")
    logger.info("Data directory: %s", DATA_DIR)

    try:
        files = list_xml_files(DATA_DIR)
    except Exception as exc:
        logger.error("Cannot list package directory: %s", exc)
        return 2

    if not files:
        logger.warning("No XML files found in %s", DATA_DIR)
        return 0

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        ensure_schema(conn)

        stats = {"loaded": 0, "skipped": 0, "error": 0}
        for path in files:
            result = process_file(conn, path)
            stats[result] += 1

        logger.info("Finished. loaded=%s skipped=%s error=%s", stats["loaded"], stats["skipped"], stats["error"])
        return 0 if stats["error"] == 0 else 1
    finally:
        conn.close()


if __name__ == "__main__":
    sys.exit(main())
