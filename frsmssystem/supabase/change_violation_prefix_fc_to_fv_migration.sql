-- Switch violation codes to the FV prefix.
--   FC-213            -> FV-213
--   VC-2026-0001      -> FV-2026-0001   (old auto-generated format)
-- Safe to run more than once: rows that already start with FV- are untouched.

update violations
set violation_code = regexp_replace(violation_code, '^(FC|VC)-', 'FV-')
where violation_code ~ '^(FC|VC)-';
