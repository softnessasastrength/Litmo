-- Trusted snapshot creation (ADR 0006) uses a service-role Supabase client
-- in backend/services/supabaseSessionSnapshotRepository.js to:
--   1. read the session row (participant + status check)
--   2. read each participant's latest immutable touch/consent versions
--   3. call create_session_snapshot(...) (already EXECUTE-granted to service_role)
--
-- Table-level SELECT was never granted to service_role for these tables.
-- RLS bypass alone is not enough in PostgREST: the role still needs GRANT.
-- Without this, POST /api/sessions/:sessionId/snapshot fails closed with
-- snapshot_storage_failed before any snapshot can be computed.
--
-- Scope is deliberately minimal: SELECT only on the three tables the
-- repository reads. No INSERT/UPDATE/DELETE, and no broadening of
-- authenticated client privileges.

grant select on public.sessions to service_role;
grant select on public.touch_profile_versions to service_role;
grant select on public.consent_preference_versions to service_role;
