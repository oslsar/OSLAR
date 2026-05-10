S1000D realistic demo package for OSLAR testing

Files included
- 3 DMC files:
  - Removal/installation task
  - IPC parts data
  - Figure/ICN reference module
- 1 PMC file
- 1 BREX-style module
- 1 ICN metadata file
- 1 comment file
- 1 intentionally broken XML file

Suggested test flow
1. Copy files into /data/s1000d_packages
2. Run the V2 loader
3. Confirm raw_xml, dm_parsed, pm_parsed, icn_parsed, and load_error contents

Expected behavior
- DMC, PMC, and ICN should load and parse
- BREX should load as a DMC-type module because it is still a dmodule root
- comment should load as COMMENT
- broken file should appear in s1000d_stage.load_error
