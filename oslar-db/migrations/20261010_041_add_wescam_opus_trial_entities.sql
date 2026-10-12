BEGIN;

DO $$
BEGIN
    IF current_database() <> 'open_lsar' THEN
        RAISE EXCEPTION 'Wescam trial migration requires open_lsar';
    END IF;
END $$;

-- Exact column definitions copied from /tmp/wescam_egl_schema.sql (PostgreSQL 18.3).
-- Only PRIMARY KEY nullability is strengthened. No physical inter-table FKs.
-- XF is empty: its seven-column key is structurally derived, not row-validated.
DO $$
DECLARE code text;
BEGIN
    IF EXISTS (SELECT 1 FROM lsar_meta.profile WHERE profile_code = 'WESCAM_OPUS') THEN
        RAISE EXCEPTION 'WESCAM_OPUS profile already exists; review before applying';
    END IF;
    FOREACH code IN ARRAY ARRAY['WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF'] LOOP
        IF to_regclass(format('lsar_core.%I', code)) IS NOT NULL
           OR EXISTS (SELECT 1 FROM lsar_meta.entity WHERE entity_code = code)
           OR EXISTS (SELECT 1 FROM lsar_meta.field_def WHERE entity_code = code)
           OR EXISTS (SELECT 1 FROM lsar_meta.dbinfo_raw WHERE entity_code = code) THEN
            RAISE EXCEPTION 'Existing Wescam object %; migration cancelled', code;
        END IF;
    END LOOP;
END $$;

INSERT INTO lsar_meta.profile (profile_code, profile_name, active, comments)
VALUES ('WESCAM_OPUS', 'Wescam OPUS Phase-1 Trial', TRUE,
        'Writable lsar_core trial copy; LSAR_OPUS.egl source remains untouched.');

INSERT INTO lsar_meta.entity
    (entity_code, entity_name, source_tag, profile_code, include_entity, comments)
VALUES
('WESCAM_XA', 'Wescam XA', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_XB', 'Wescam XB', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_XC', 'Wescam XC', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_HA', 'Wescam HA', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_HG', 'Wescam HG', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_HO', 'Wescam HO', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_THA', 'Wescam THA', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_THG', 'Wescam THG', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.'),
('WESCAM_XF', 'Wescam XF', 'WESCAM_OPUS', 'WESCAM_OPUS', TRUE, 'Phase-1 EAGLE trial copy; no physical inter-table FKs.');

CREATE TABLE lsar_core."WESCAM_XA" (
    "EIACODXA" character varying(10),
    "LCNSTRXA" character varying(18),
    "ADDLTMXA" numeric(2,0),
    "CTDLTMXA" numeric(3,0),
    "CONTNOXA" character varying(19),
    "CSREORXA" numeric(4,2),
    "CSPRRQXA" numeric(4,2),
    "DEMILCXA" numeric(2,0),
    "DISCNTXA" numeric(4,2),
    "ESSALVXA" numeric(2,0),
    "HLCSPCXA" numeric(2,0),
    "INTBINXA" numeric(4,0),
    "INCATCXA" numeric(4,0),
    "INTRATXA" numeric(3,2),
    "INVSTGXA" numeric(4,2),
    "LODFACXA" numeric(3,2),
    "WSOPLVXA" numeric(2,0),
    "OPRLIFXA" numeric(2,0),
    "PRSTOVXA" numeric(2,0),
    "PRSTOMXA" numeric(2,0),
    "PROFACXA" numeric(3,2),
    "RCBINCXA" numeric(4,0),
    "RCCATCXA" numeric(4,0),
    "RESTCRXA" numeric(2,0),
    "SAFLVLXA" numeric(2,0),
    "SECSFCXA" numeric(3,2),
    "TRNCSTXA" numeric(5,2),
    "WSTYAQXA" character varying(1),
    "TSSCODXA" character varying(1),
    "DMCCCDXA" character varying(3),
    "IBCCCDXA" character varying(3),
    "ICCCCDXA" character varying(3),
    "ISSCCCXA" character varying(3),
    "RBCCCDXA" character varying(3),
    "RCCCCDXA" character varying(3),
    "TRNCCCXA" character varying(3),
    "EICCCDXA" character varying(3),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_XA_PK" PRIMARY KEY ("EIACODXA")
);

CREATE TABLE lsar_core."WESCAM_XB" (
    "EIACODXA" character varying(10),
    "LSACONXB" character varying(18),
    "ALTLCNXB" character varying(2),
    "LCNTYPXB" character varying(1),
    "LCNINDXB" character varying(1),
    "LCNAMEXB" text,
    "TMFGCDXB" character varying(11),
    "SYSIDNXB" character varying(1),
    "SECITMXB" character varying(1),
    "RAMINDXB" character varying(1),
    "LDOILSXB" character varying(200),
    "LDOENGXB" character varying(200),
    "WIBBLEXB" character varying(9),
    "SWIDCDXB" character varying(1),
    "DISCODXB" character varying(2),
    "LOCWAZXB" character varying(10),
    "DMCSDCXB" character varying(4),
    "DMCDCVXB" character varying(3),
    "BDEESSXB" numeric(1,0),
    "ELETYPXB" character varying(30),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_XB_PK" PRIMARY KEY ("EIACODXA", "ALTLCNXB", "LSACONXB", "LCNTYPXB")
);

CREATE TABLE lsar_core."WESCAM_XC" (
    "EIACODXA" character varying(10),
    "LSACONXB" character varying(18),
    "ALTLCNXB" character varying(2),
    "LCNTYPXB" character varying(1),
    "UOCSEIXC" character varying(4),
    "PCCNUMXC" character varying(6),
    "ITMDESXC" character varying(26),
    "PLISNOXC" character varying(5),
    "TOCCODXC" character varying(1),
    "QTYASYXC" character varying(4),
    "QTYPEIXC" character varying(5),
    "TRASEIXC" character varying(1),
    "UOCMOVXC" character varying(3),
    "RRTDRWXC" character varying(36),
    "QPEICOXC" character varying(1),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_XC_PK" PRIMARY KEY ("EIACODXA", "ALTLCNXB", "LSACONXB", "LCNTYPXB")
);

CREATE TABLE lsar_core."WESCAM_HA" (
    "EIACODXA" character varying(10),
    "CAGECDXH" character varying(5),
    "REFNUMHA" character varying(32),
    "ITNAMEHA" text,
    "INAMECHA" character varying(5),
    "REFNCCHA" character varying(1),
    "REFNVCHA" numeric(1,0),
    "DLSCRCHA" character varying(1),
    "DOCIDCHA" character varying(3),
    "ITMMGCHA" character varying(1),
    "COGNSNHA" character varying(2),
    "SMMNSNHA" character varying(2),
    "MATNSNHA" character varying(1),
    "FSCNSNHA" numeric(4,0),
    "NIINSNHA" character varying(9),
    "ACTNSNHA" character varying(2),
    "UICONVHA" character varying(5),
    "SHLIFEHA" character varying(1),
    "SLACTNHA" character varying(2),
    "PPSLSTHA" character varying(1),
    "DOCAVCHA" character varying(1),
    "PRDLDTHA" numeric(2,0),
    "SPMACCHA" character varying(1),
    "SMAINCHA" character varying(1),
    "CRITCDHA" character varying(1),
    "PMICODHA" character varying(1),
    "SAIPCDHA" character varying(1),
    "AAPLCCHA" character varying(1),
    "BBPLCCHA" character varying(1),
    "CCPLCCHA" character varying(1),
    "DDPLCCHA" character varying(1),
    "EEPLCCHA" character varying(1),
    "FFPLCCHA" character varying(1),
    "GGPLCCHA" character varying(1),
    "HHPLCCHA" character varying(1),
    "JJPLCCHA" character varying(1),
    "KKPLCCHA" character varying(1),
    "LLPLCCHA" character varying(1),
    "MMPLCCHA" character varying(1),
    "PHYSECHA" character varying(1),
    "ADPEQPHA" numeric(1,0),
    "DEMILIHA" character varying(1),
    "ACQMETHA" numeric(1,0),
    "AMSUFCHA" character varying(1),
    "HMSCOSHA" numeric(8,0),
    "HWDCOSHA" numeric(8,0),
    "HWSCOSHA" numeric(8,0),
    "CTICODHA" character varying(2),
    "UWEIGHHA" character varying(5),
    "ULENGTHA" numeric(4,1),
    "UWIDTHHA" numeric(4,1),
    "UHEIGHHA" numeric(4,1),
    "HAZCODHA" character varying(1),
    "UNITMSHA" character varying(2),
    "UNITISHA" character varying(2),
    "LINNUMHA" character varying(6),
    "CRITITHA" character varying(13),
    "INDMATHA" character varying(19),
    "MTLEADHA" numeric(3,0),
    "MTLWGTHA" numeric(6,3),
    "MATERLHA" character varying(240),
    "P2000MHA" numeric(1,0),
    "HMSCCCHA" character varying(3),
    "HWDCCCHA" character varying(3),
    "HWSCCCHA" character varying(3),
    "WUUUOMHA" character varying(2),
    "SUUUOMHA" character varying(2),
    "CATOFMHA" numeric(1,0),
    "LDOSMOHA" character varying(200),
    "CLAOFSHA" character varying(1),
    "DOMMACHA" character varying(6),
    "ELESEDHA" numeric(1,0),
    "HAZMATHA" character varying(4),
    "LIFCATHA" character varying(9),
    "NEITEMHA" character varying(1),
    "POOLITHA" numeric(1,0),
    "REFNJCHA" numeric(1,0),
    "SPCLASHA" numeric(1,0),
    "UPKDIRHA" character varying(1),
    "ENGRECHA" character varying(240),
    "PROCCDHA" character varying(2),
    "DRAGHTHA" numeric(4,0),
    "DRGTUMHA" character varying(2),
    "SPEDRWHA" character varying(36),
    "DSLOCMHA" numeric(8,0),
    "DSLOCPHA" numeric(8,0),
    "SWRIPRHA" character varying(200),
    "PSIZEMHA" double precision,
    "PSIZEPHA" double precision,
    "SRFREQHA" numeric(2,0),
    "MEMREQHA" double precision,
    "SWVERNHA" character varying(4),
    "FITCODHA" character varying(1),
    "CALMKRHA" numeric(1,0),
    "PRVDOPHA" character varying(1),
    "ITMTYPHA" character varying(2),
    "SCHDBAHA" character varying(10),
    "CRCBTYHA" character varying(33),
    "HWACCCHA" character varying(3),
    "ICLSUPHA" character varying(4),
    "ISUBCLHA" character varying(1),
    "SPHANDHA" text,
    "DEMLDTHA" timestamp with time zone,
    "EMINCPHA" character varying(1),
    "EMSENSHA" character varying(1),
    "MAGSNSHA" character varying(1),
    "MTSTRTHA" character varying(65),
    "SCRATEHA" double precision,
    "SWTYPEHA" character varying(30),
    "PSIZUMHA" character varying(10),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_HA_PK" PRIMARY KEY ("EIACODXA", "CAGECDXH", "REFNUMHA")
);

CREATE TABLE lsar_core."WESCAM_HG" (
    "CAGECDXH" character varying(5),
    "REFNUMHA" character varying(32),
    "EIACODXA" character varying(10),
    "LSACONXB" character varying(18),
    "ALTLCNXB" character varying(2),
    "LCNTYPXB" character varying(1),
    "PLISNOHG" character varying(5),
    "QTYASYHG" character varying(4),
    "SUPINDHG" character varying(1),
    "DATASCHG" character varying(1),
    "PROSICHG" character varying(3),
    "LLIPTDHG" character varying(1),
    "PPLPTDHG" character varying(1),
    "SFPPTDHG" character varying(1),
    "CBLPTDHG" character varying(1),
    "RILPTDHG" character varying(1),
    "ISLPTDHG" character varying(1),
    "PCLPTDHG" character varying(1),
    "TTLPTDHG" character varying(1),
    "SCPPTDHG" character varying(1),
    "ARAPTDHG" character varying(1),
    "ARBPTDHG" character varying(1),
    "TOCCODHG" character varying(1),
    "INDCODHG" character varying(1),
    "QTYPEIHG" character varying(5),
    "PIPLISHG" character varying(5),
    "SAPLISHG" character varying(5),
    "HARDCIHG" character varying(1),
    "REMIPIHG" character varying(1),
    "LRUNITHG" character varying(1),
    "ITMCATHG" character varying(2),
    "ESSCODHG" numeric(1,0),
    "SMRCODHG" character varying(6),
    "MRRONEHG" numeric(8,4),
    "MRRTWOHG" numeric(8,3),
    "MRRMODHG" character varying(7),
    "ORTDOOHG" numeric(3,0),
    "FRTDFFHG" numeric(3,0),
    "HRTDHHHG" numeric(3,0),
    "LRTDLLHG" numeric(3,0),
    "DRTDDDHG" numeric(3,0),
    "MINREUHG" numeric(3,0),
    "MAOTIMHG" character varying(4),
    "MAIACTHG" character varying(1),
    "RISSBUHG" numeric(3,0),
    "RMSSLIHG" numeric(3,0),
    "RTLLQTHG" numeric(3,0),
    "TOTQTYHG" numeric(6,0),
    "OMTDOOHG" numeric(2,0),
    "FMTDFFHG" numeric(2,0),
    "HMTDHHHG" numeric(2,0),
    "LMTDLLHG" numeric(2,0),
    "DMTDDDHG" numeric(2,0),
    "CBDMTDHG" numeric(2,0),
    "CADMTDHG" numeric(2,0),
    "ORCTOOHG" numeric(3,0),
    "FRCTFFHG" numeric(3,0),
    "HRCTHHHG" numeric(3,0),
    "LRCTLLHG" numeric(3,0),
    "DRCTDDHG" numeric(3,0),
    "CONRCTHG" numeric(3,0),
    "NORETSHG" numeric(3,0),
    "REPSURHG" numeric(3,0),
    "DRPONEHG" character varying(6),
    "DRPTWOHG" character varying(6),
    "WRKUCDHG" character varying(11),
    "ALLOWCHG" character varying(2),
    "ALIQTYHG" numeric(3,0),
    "ALLOWSHG" numeric(9,0),
    "ATSOSPHG" numeric(1,0),
    "SIDCAGHG" character varying(5),
    "SIDREFHG" character varying(32),
    "SIDNSNHG" character varying(13),
    "RECMQYHG" numeric(5,0),
    "RECORQHG" numeric(5,0),
    "SOMFRGHG" character varying(40),
    "SUPCATHG" character varying(2),
    "VFICODHG" character varying(1),
    "TOTLIFHG" numeric(3,0),
    "PREIICHG" character varying(12),
    "PREISTHG" character varying(1),
    "SOMFIDHG" character varying(1),
    "TURNRSHG" character varying(1),
    "EQTSERHG" character varying(6),
    "IDENTNHG" character varying(19),
    "SDAUTHHG" character varying(200),
    "ALLOW1HG" numeric(3,0),
    "ALLOW2HG" numeric(3,0),
    "ALLOW3HG" numeric(3,0),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_HG_PK" PRIMARY KEY ("EIACODXA", "ALTLCNXB", "LSACONXB", "LCNTYPXB", "CAGECDXH", "REFNUMHA")
);

CREATE TABLE lsar_core."WESCAM_HO" (
    "EIACODXA" character varying(10),
    "LCNTYPXB" character varying(1),
    "CAGECDHO" character varying(5),
    "REFNUMHO" character varying(32),
    "LSACONHO" character varying(18),
    "ALTLCNHO" character varying(2),
    "LCNSEIHO" character varying(18),
    "ALCSEIHO" character varying(2),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_HO_PK" PRIMARY KEY ("EIACODXA", "LCNTYPXB", "CAGECDHO", "REFNUMHO", "LSACONHO", "ALTLCNHO", "LCNSEIHO", "ALCSEIHO")
);

CREATE TABLE lsar_core."WESCAM_THA" (
    "EIACODXA" character varying(10),
    "CAGECDXH" character varying(5),
    "REFNUMHA" character varying(32),
    "KWORDTHA" character varying(8),
    "DESCRTHA" character varying(255),
    "VOCABTHA" character varying(6),
    "CSNUMTHA" character varying(13),
    "CONFGTHA" character varying(9),
    "SPECHAND" character varying(1),
    "COMMSPEC" character varying(17),
    "PROCCODE" character varying(4),
    "FINSCODE" character varying(4),
    "GOVMCODE" character varying(4),
    "STOKGUAG" character varying(7),
    "STOKWIDT" character varying(7),
    "STOKLENG" character varying(7),
    "STOKUTMS" character varying(2),
    "SUPRCAGE" character varying(5),
    "SUPRREFN" character varying(32),
    "STOCKSIZ" character varying(15),
    "HEADOREN" character varying(1),
    "SECTION" character varying(5),
    "PARTLOW" numeric(5,0),
    "ORDRPLCY" character varying(3),
    "ORDERQTY" numeric(5,0),
    "UIDREQRD" character varying(1),
    "ZOID" character varying(30),
    "CUREFFDT" timestamp with time zone,
    "APPLICDT" timestamp with time zone,
    "KPISTADT" timestamp with time zone,
    "KPIENDDT" timestamp with time zone,
    "CAP1STDT" timestamp with time zone,
    "CAP1ENDT" timestamp with time zone,
    "CAP1QUTY" numeric(4,0),
    "CAP2STDT" timestamp with time zone,
    "CAP2ENDT" timestamp with time zone,
    "CAP2QUTY" numeric(4,0),
    "REVIEWTH" character varying(1),
    "COMMENTS" character varying(255),
    "OMITCAGE" character varying(3),
    "OMITREFN" character varying(3),
    "LINAMTHA" character varying(255),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_THA_PK" PRIMARY KEY ("EIACODXA", "CAGECDXH", "REFNUMHA")
);

CREATE TABLE lsar_core."WESCAM_THG" (
    "CAGECDXH" character varying(5),
    "REFNUMHA" character varying(32),
    "EIACODXA" character varying(10),
    "LSACONXB" character varying(18),
    "ALTLCNXB" character varying(2),
    "LCNTYPXB" character varying(1),
    "CSNUMTHG" character varying(13),
    "CONFGTHG" character varying(9),
    "LONGDIST" numeric(7,3),
    "LATTDIST" numeric(3,2),
    "LOADDIST" character varying(1),
    "CUSTCINM" character varying(20),
    "CINUMBYH" character varying(19),
    "CPCODEYH" character varying(19),
    "DIAMETYH" numeric(6,1),
    "DUTCYCYH" numeric(4,2),
    "LOGMANYH" numeric(4,2),
    "TMPMINYH" numeric(2,0),
    "TMPMAXYH" numeric(2,0),
    "VBRATXYH" numeric(5,0),
    "VBRATYYH" numeric(5,0),
    "VIBRAZYH" numeric(5,0),
    "PRSMINYH" numeric(2,2),
    "PRSMAXYH" numeric(2,2),
    "COGXYH" numeric(5,0),
    "COGYYH" numeric(5,0),
    "COGZYH" numeric(5,0),
    "THERMALYH" numeric(6,0),
    "POWERYH" numeric(6,0),
    "PRESSYH" character varying(1),
    "HUMMINYH" numeric(2,0),
    "HUMMAXYH" numeric(2,0),
    "DYNLOXYH" numeric(5,0),
    "DYNLOYYH" numeric(5,0),
    "DYNLOZYH" numeric(5,0),
    "LOGDELYH" numeric(3,0),
    "UNNUMYH" character varying(4),
    "DATSTAYH" character varying(20),
    "CVFCAOYH" numeric(4,2),
    "CVFCSOYH" numeric(4,2),
    "GNCTCDYH" character varying(3),
    "CRRNIDYH" character varying(3),
    "RCCOSTYH" numeric(10,2),
    "COMMENTYH" text,
    "MHBFTTHG" double precision,
    "SRUNITHG" character varying(1),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_THG_PK" PRIMARY KEY ("EIACODXA", "ALTLCNXB", "LSACONXB", "LCNTYPXB", "CAGECDXH", "REFNUMHA")
);

CREATE TABLE lsar_core."WESCAM_XF" (
    "EIACODXA" character varying(10),
    "LSACONXF" character varying(18),
    "ALTLCNXF" character varying(2),
    "LCNTYPXF" character varying(1),
    "LCNSEIXF" character varying(18),
    "ALCSEIXF" character varying(2),
    "LTYSEIXF" character varying(1),
    "USERIDZU" character varying(30),
    "Filter" character varying(10),
    CONSTRAINT "WESCAM_XF_PK" PRIMARY KEY ("EIACODXA", "LSACONXF", "ALTLCNXF", "LCNTYPXF", "LCNSEIXF", "ALCSEIXF", "LTYSEIXF")
);

-- Derive format behavior from the new physical catalog, never baseline types.
-- Reuse baseline descriptions only for exact same-table column identities.
-- Extension keys share their HA/HG identity; other extension fields remain unmapped.
WITH physical AS (
    SELECT c.relname AS entity_code, a.attname AS column_name,
           a.attnum::integer AS ordinal_pos,
           CASE
             WHEN t.typname = 'varchar' THEN 'string(' || (a.atttypmod - 4) || ')'
             ELSE format_type(a.atttypid, a.atttypmod)
           END AS format_spec,
           a.attnotnull AS is_key,
           CASE c.relname
             WHEN 'WESCAM_THA' THEN 'HA'
             WHEN 'WESCAM_THG' THEN 'HG'
             ELSE substring(c.relname FROM 8)
           END AS baseline_entity
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = c.oid
    JOIN pg_type t ON t.oid = a.atttypid
    WHERE n.nspname = 'lsar_core'
      AND c.relname IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF')
      AND a.attnum > 0 AND NOT a.attisdropped
)
INSERT INTO lsar_meta.field_def
    (entity_code, column_name, ordinal_pos, format_spec,
     ded, geia_short_name, element_name, mil_1388_field, def_std_00_60, s3000l,
     key_class, is_key, is_foreign, is_mandatory, originates_in_entity,
     include_element, deprecated, comments)
SELECT p.entity_code, p.column_name, p.ordinal_pos, p.format_spec,
       b.ded, b.geia_short_name,
       COALESCE(NULLIF(b.element_name, ''), 'EAGLE ' || p.column_name),
       b.mil_1388_field, b.def_std_00_60, b.s3000l,
       CASE WHEN p.is_key THEN 'PK' ELSE NULL END,
       p.is_key, FALSE, p.is_key, '0', TRUE, FALSE,
       'Source: LSAR_OPUS.egl; exact EAGLE physical format. Unverified mappings remain NULL.'
FROM physical p
LEFT JOIN lsar_meta.entity e
  ON e.entity_code = p.baseline_entity AND e.profile_code = 'BASELINE'
LEFT JOIN lsar_meta.field_def b
  ON b.entity_code = e.entity_code AND b.column_name = p.column_name
 AND b.include_element AND NOT b.deprecated
 AND (p.entity_code NOT IN ('WESCAM_THA', 'WESCAM_THG') OR p.is_key);

-- These metadata foreign_key relationships validate NEW compiler creates only.
-- COPY bypasses that validation so existing source orphans are preserved.
-- Deliberately no HG -> HA, THA -> HA, THG -> HG or HO -> XF automation.
INSERT INTO lsar_meta.entity_relationship
    (child_entity_code, parent_entity_code, constraint_name, relationship_type,
     relationship_label, fk_columns, pk_columns, lookup_anchor_column,
     lookup_filter, active, comments)
VALUES
('WESCAM_XB', 'WESCAM_XA', 'fk_wescam_xb__xa', 'foreign_key', 'End Item', '["EIACODXA"]'::jsonb, '["EIACODXA"]'::jsonb, 'EIACODXA', NULL, TRUE, 'Phase-1 metadata lookup; no physical FK. Source rows preserved by COPY.'),
('WESCAM_XC', 'WESCAM_XB', 'fk_wescam_xc__xb', 'foreign_key', 'LCN', '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb, 'EIACODXA', NULL, TRUE, 'Phase-1 metadata lookup; no physical FK. Source rows preserved by COPY.'),
('WESCAM_HG', 'WESCAM_XB', 'fk_wescam_hg__xb', 'foreign_key', 'LCN', '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb, 'EIACODXA', NULL, TRUE, 'Phase-1 metadata lookup; no physical FK. Source rows preserved by COPY.'),
('WESCAM_HO', 'WESCAM_HG', 'fk_wescam_ho__hg', 'foreign_key', 'Part Application', '["EIACODXA","ALTLCNHO","LSACONHO","LCNTYPXB","CAGECDHO","REFNUMHO"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB","CAGECDXH","REFNUMHA"]'::jsonb, 'EIACODXA', NULL, TRUE, 'Phase-1 metadata lookup; no physical FK. Source rows preserved by COPY.'),
('WESCAM_HO', 'WESCAM_XC', 'fk_wescam_ho__xc', 'foreign_key', 'System/End Item UOC', '["EIACODXA","ALCSEIHO","LCNSEIHO","LCNTYPXB"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb, 'ALCSEIHO', '{"operator":"eq_contexts","filters":[{"column":"EIACODXA","sourceColumn":"EIACODXA"},{"column":"LCNTYPXB","sourceColumn":"LCNTYPXB"}]}'::jsonb, TRUE, 'Phase-1 metadata lookup; no physical FK. Source rows preserved by COPY.'),
('WESCAM_XF', 'WESCAM_XB', 'fk_wescam_xf__xb', 'foreign_key', 'LCN', '["EIACODXA","ALTLCNXF","LSACONXF","LCNTYPXF"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb, 'LSACONXF', NULL, TRUE, 'Phase-1 metadata lookup; no physical FK. Source rows preserved by COPY.'),
('WESCAM_XF', 'WESCAM_XC', 'fk_wescam_xf__xc', 'foreign_key', 'System/End Item UOC', '["EIACODXA","ALCSEIXF","LCNSEIXF","LTYSEIXF"]'::jsonb, '["EIACODXA","ALTLCNXB","LSACONXB","LCNTYPXB"]'::jsonb, 'LCNSEIXF', '{"operator":"eq_context","column":"EIACODXA","sourceColumn":"EIACODXA"}'::jsonb, TRUE, 'Phase-1 metadata lookup; no physical FK. Source rows preserved by COPY.');

UPDATE lsar_meta.field_def f
SET is_foreign = TRUE
WHERE f.entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF')
  AND EXISTS (
      SELECT 1 FROM lsar_meta.entity_relationship r
      WHERE r.child_entity_code = f.entity_code AND r.fk_columns ? f.column_name
  );

INSERT INTO lsar_meta.dbinfo_raw
    (tag, profile_code, entity_code, field, ordinal_pos, format_spec, ded,
     geia_short_name, element_name, mil_1388_field, def_std_00_60, s3000l,
     key, is_key, is_foreign, is_mandatory, originates_in_entity,
     include_element, deprecated, comments)
SELECT 'WESCAM_OPUS', 'WESCAM_OPUS', entity_code, column_name,
       ordinal_pos::text, format_spec, ded, geia_short_name, element_name,
       mil_1388_field, def_std_00_60, s3000l, key_class,
       is_key::text, is_foreign::text, is_mandatory::text, '0', 'true', 'false', comments
FROM lsar_meta.field_def WHERE entity_code IN ('WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF');

DO $$
DECLARE code text; physical_count integer; metadata_count integer;
BEGIN
    FOREACH code IN ARRAY ARRAY['WESCAM_XA', 'WESCAM_XB', 'WESCAM_XC', 'WESCAM_HA', 'WESCAM_HG', 'WESCAM_HO', 'WESCAM_THA', 'WESCAM_THG', 'WESCAM_XF'] LOOP
        SELECT count(*) INTO physical_count FROM information_schema.columns
        WHERE table_schema = 'lsar_core' AND table_name = code;
        SELECT count(*) INTO metadata_count FROM lsar_meta.field_def WHERE entity_code = code;
        IF physical_count <> metadata_count OR physical_count = 0 THEN
            RAISE EXCEPTION 'Incomplete field metadata for %', code;
        END IF;
    END LOOP;
END $$;

COMMIT;
