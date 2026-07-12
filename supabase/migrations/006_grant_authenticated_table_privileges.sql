-- Fixes a real bug found running the previously Docker-blocked pgTAP suite
-- for the first time: migration 005 created RLS policies for these four
-- tables but never granted the underlying table-level privileges to
-- `authenticated`. Postgres denies access at the grant level before RLS is
-- even evaluated, so every one of these tables returned "permission denied"
-- for a signed-in user, not just in the test -- in the real app too.
--
-- Grants match each table's actual RLS policies (least privilege), with one
-- deliberate exception: touch_profile_versions and consent_preference_versions
-- grant update/delete even though no RLS policy allows either. The existing
-- touch_profile_versions_immutable / consent_preference_versions_immutable
-- triggers (before update or delete) are the documented "defense in depth"
-- enforcement (docs/SECURITY_MODEL.md): granting the operation lets a caller
-- attempt it so the trigger's specific "profile versions are immutable"
-- error fires, rather than a generic permission-denied that never reaches
-- the trigger at all. Either way nothing is ever actually mutated.
--
-- profiles rows are only ever inserted by the security-definer
-- handle_new_user() trigger, never directly by a user, so no INSERT grant.
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.onboarding_progress to authenticated;
grant select, insert, update, delete on public.touch_profile_versions to authenticated;
grant select, insert, update, delete on public.consent_preference_versions to authenticated;
