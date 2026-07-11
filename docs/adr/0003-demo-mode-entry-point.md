# ADR 0003: Backend-free demo-mode entry point

**Status:** Accepted
**Date:** 2026-07-11

## Context

`docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md` requires a "sign in or enter demo mode" screen where demo entry needs no real account and no backend. Chapter 2's `AuthContext` never implemented that second path: every signed-out visitor is unconditionally redirected to `/auth/sign-in`, and sign-in requires a reachable Supabase instance. On a machine with no Docker (confirmed: no `docker` binary present), there is no way to start local Supabase, so the app cannot be reached past an error screen on a physical iPhone at all. This blocks the concrete, human-stated goal of running Litmo on a personal iPhone through Expo Go.

Chapter 1's original tap-through prototype (`app/app/index.tsx` through `app/app/profile/trust-ledger.tsx`) already implements the full required demo path using local component state (`PrototypeContext`) and static fixtures (`app/data/mock.ts`). Chapter 2 layered real Supabase-backed persistence onto three of those screens (`onboarding/quiz.tsx`, `onboarding/touch-language.tsx`, `profile/edit.tsx`) without leaving a no-backend path through them.

## Decision

Add a `"demo"` status to `AuthState` (`app/context/authState.ts`), entered only through an explicit `enterDemoMode()` action exposed on `AuthContext`. Demo mode is:

- **Opt-in and clearly labeled.** It is reached by tapping "Continue without an account (demo mode)" on the sign-in screen, or directly from the screen shown when no local Supabase URL/anon key is configured at all. Both surfaces state plainly that no account is created and nothing is saved.
- **Never conflated with a real session.** `enterDemoMode()` never touches Supabase. `user` and `session` remain `null` in demo status; screens that need a signed-in user (`onboarding/quiz.tsx`, `onboarding/touch-language.tsx`, `profile/edit.tsx`) already guard on `user` being present, so demo mode exercises exactly the same fallback code path Chapter 2 wrote for "not yet signed in," rather than a new parallel implementation.
- **Not a dead end.** `onboarding/touch-language.tsx`'s save handler previously did nothing at all when there was no user (`if (!user) return;`); it now advances to Discovery directly, since there is no profile to persist in demo mode. `profile/edit.tsx` and `match/discover.tsx`'s "Edit my general profile" button now explain that editing requires a real account instead of hanging or crashing.
- **Exitable without hitting the network.** `signOut()` in demo mode dispatches straight to `signed_out` instead of calling `authService.signOut()`, since there is no real Supabase session to invalidate. `profile/trust-ledger.tsx` labels the action "Exit demo mode" instead of "Sign out" when `status === "demo"`.
- **Routed like a normal session for navigation purposes.** `protectedRouteFor` treats `"demo"` the same as an authenticated state for the purpose of leaving the `auth` route group (redirects to `/`, the welcome screen, rather than back to sign-in), but never forces a redirect while already outside it — the whole Chapter 1 tap-through path stays reachable.

This keeps the Chapter 1 mock screens as the demo adapter, rather than building a second one: `app/data/mock.ts`, `PrototypeContext`, and the already-mock `session/active.tsx` / `session/wrap-up.tsx` / `match/discover.tsx` / `match/[id].tsx` / `match/consent-snapshot.tsx` screens needed no changes at all.

## Alternatives considered

- A separate "demo" route tree duplicating every screen was rejected: it would double the surface area to maintain and risk the demo and production paths drifting apart in exactly the way `docs/roadmap/PHONE_VISIBLE_VERTICAL_SLICE.md`'s architecture constraints warn against ("do not scatter demo conditionals across screen components... keep demo and production adapters behind typed interfaces").
- Silently falling back to demo mode whenever `environmentError` is set (no explicit user action) was rejected: a developer with a real but temporarily-unreachable Supabase instance would be dropped into demo mode without realizing it, and the roadmap requires demo entry to be an explicit, clearly labeled choice.
- Persisting `demoMode` across app restarts (e.g., in AsyncStorage) was rejected for this slice: demo mode resetting on every cold start makes it unambiguous that it is not a real account, which is a safety property, not just a convenience.

## Consequences

The Chapter 1 tap-through path (launch → quiz → result → touch language → discovery → match detail → consent snapshot → active session → soft signal/wrap-up → trust ledger) is reachable on a physical device through Expo Go with zero backend configuration. Real Supabase-backed persistence (Chapter 2) is unaffected and still exercised whenever a real account signs in.

## Follow-up work

- If a developer wants demo mode to survive app restarts for longer manual walkthroughs, add an explicit, clearly-labeled persisted flag — not a silent default.
- Chapter 4's session-lifecycle state machine should decide whether "demo mode" sessions are ever worth representing as real (but locally-scoped) session records, or should remain purely client-local as they are here.

## Update: reconciled with a dedicated entry screen

A separate, independently-authored commit on `main` added `app/app/entry.tsx` — a dedicated "choose how to enter" screen offering demo mode and account sign-in side by side, reached from `app/app/index.tsx`'s "Explore the prototype" button — without the `AuthState`/`AuthContext` plumbing this ADR describes to make either choice reachable or effective. The two were reconciled:

- `entry.tsx`'s demo button now calls `enterDemoMode()` (this ADR's mechanism) before navigating, instead of navigating directly with no state change.
- `entry.tsx`'s sign-in card, originally a permanently disabled placeholder ("not enabled in this prototype yet"), now links to the already-working `/auth/sign-in` screen — Chapter 2's real Supabase auth existed before this ADR and was never actually disabled; the placeholder text was inaccurate.
- `protectedRouteFor` gained a broader `isPublicRoute` check (the auth route group, or `"/"`, or `"/entry"`) so a signed-out visitor reaches the welcome and entry screens without being redirected straight to sign-in, and any other signed-out redirect (an expired session, exiting demo mode) now lands on `/entry` to choose again rather than skipping past that choice to the sign-in form.
