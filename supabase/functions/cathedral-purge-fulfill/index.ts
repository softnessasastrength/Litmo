/**
 * Litmo cathedral-purge-fulfill Edge Function — STUB, NOT DEPLOYED, NOT CALLED.
 *
 * WHAT THIS WOULD DO, EVENTUALLY: fulfill a pending row in
 * public.account_erasure_requests by cascade-deleting (or irreversibly
 * anonymizing) the requesting user's server-side data, then marking the
 * request 'completed'. That is the ONLY thing this function is for — it
 * does not touch device-local data (the app already handles that via
 * privacyService.wipeLocal(), which needs no server round-trip at all).
 *
 * WHY IT IS NOT LIVE: docs/GDPR.md and supabase/migrations/
 * 039_gdpr_privacy_and_erasure.sql both document a deliberate policy —
 * request_account_erasure() queues a request for HUMAN fulfillment. It
 * does not, and this stub must not make it, auto-delete auth.users or
 * cascade-destroy account data instantly. CURRENT_STATE.md names the real
 * blockers as external and "not inventable": a named second reviewer,
 * a real retention/deletion policy, jurisdiction, external referral. This
 * file existing is not those things happening — it is a shape for once
 * they do.
 *
 * DO NOT deploy this function and wire it into the app without:
 *   1. A named second reviewer signing off on the destructive SQL below
 *      being complete and correct (it is NOT verified complete here —
 *      it is a sketch of tables to touch, not an audited cascade).
 *   2. A real jurisdiction/retention policy decision (see docs/GDPR.md §8).
 *   3. Explicit founder approval per AI_COLLABORATION_CONSTITUTION.md §16
 *      ("handling production intimate data" requires explicit approval).
 *
 * Until then, this function refuses to run (see the 501 below) so it can
 * exist in source control as a design artifact without anyone accidentally
 * deploying a half-audited destructive path.
 *
 * SEE: docs/CATHEDRAL_PURGE.md, docs/GDPR.md, TASKS.md (SAFETY-OPS-001).
 */

const NOT_YET_APPROVED_RESPONSE = {
  ok: false,
  error: "not_implemented",
  message:
    "cathedral-purge-fulfill is a design stub, not an approved destructive " +
    "path. See the header comment in this file and docs/CATHEDRAL_PURGE.md. " +
    "This function intentionally refuses to run.",
};

Deno.serve(async (_req: Request) => {
  return new Response(JSON.stringify(NOT_YET_APPROVED_RESPONSE), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * SKETCH ONLY — not audited, not executed by the handler above. What a
 * real fulfillment pass would need to touch, once approved (illustrative,
 * not exhaustive — a real implementation needs its own schema audit):
 *
 *   - public.account_erasure_requests           → mark 'completed'
 *   - public.privacy_notice_acceptances         → delete by user_id
 *   - touch/consent/session/snapshot tables      → per docs/DATA_CLASSIFICATION.md
 *   - quiz_result_summaries, trust_events        → per retention policy (undecided)
 *   - auth.users                                 → requires Supabase Admin API,
 *                                                   service_role only, last step
 *
 * None of this is wired. Writing the real version is real engineering work
 * gated on the three approvals listed above, not a follow-up task to just
 * pick up later without them.
 */
