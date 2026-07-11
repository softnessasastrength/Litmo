# Chapter 2 — Production-Grade Foundation

## Mission

Convert the existing proof of concept into a reliable, locally reproducible application foundation.

At completion, a developer must be able to clone the repository, configure the documented environment, start local services, create an account, complete onboarding, close and reopen the app, remain authenticated, and run all required checks successfully.

Do not implement later roadmap chapters during this chapter.

## 1. Inspect before editing

Before substantial changes:

1. Read the entire repository and all product documentation.
2. Inspect package manifests, navigation, database migrations, environment handling, tests, and CI.
3. Run all existing lint, type-check, test, and build commands.
4. Create `docs/CHAPTER_2_BASELINE.md` documenting:
   - Current architecture
   - Commands attempted
   - Passing and failing commands
   - Missing infrastructure
   - Major risks
   - Proposed implementation order
5. Commit the baseline separately.

Do not assume the original POC was implemented correctly.

## 2. Repository coherence

Preserve the current structure when it is reasonable. Refactor only when the benefits outweigh migration risk.

The repository must expose documented commands equivalent to:

```bash
npm run dev
npm run mobile
npm run api
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run build
npm run db:start
npm run db:reset
npm run db:stop
```

A different package manager or command naming scheme is acceptable when consistently documented.

## 3. Shared domain model

Create framework-independent TypeScript types and runtime validation schemas for at least:

- User
- UserProfile
- TouchLanguageProfile
- ConsentPreference
- BodyZonePreference
- SessionRequest
- Session
- ConsentSnapshot
- SessionOutcome
- TrustEvent

Requirements:

- Use runtime validation at application boundaries.
- Avoid untyped JSON between database, API, and client.
- Maintain one canonical definition for enums.
- Never log sensitive consent fields or private nervous-system notes.
- Add unit tests for validation and serialization behavior.

## 4. Authentication

Implement real Supabase authentication:

- Email/password signup
- Sign in
- Sign out
- Authenticated-session restoration after app restart
- Protected routes
- Unauthenticated redirects
- Onboarding-completion redirects
- Expired-session handling
- Clear, safe user-facing errors

Use one authoritative authentication state module. Never ship privileged service credentials to the client.

Required tests:

- Successful signup
- Invalid credentials
- Session restoration
- Logout
- Protected route behavior

## 5. Persistent onboarding and profiles

Required behavior:

1. A new authenticated user enters onboarding.
2. Progress can be saved between steps.
3. Submitted answers are validated.
4. Completed profiles persist in Supabase.
5. Restarting the app routes users correctly.
6. Users can edit their profile.
7. Material consent changes create a new immutable version instead of silently rewriting history.

Separate:

- General profile information
- Touch preferences
- Consent boundaries
- Optional private nervous-system notes

Private nervous-system notes must never appear in discovery payloads.

## 6. Database and Row-Level Security

Create orderly, repeatable Supabase migrations.

Include the tables necessary for this chapter, such as:

- `profiles`
- `touch_profile_versions`
- `consent_preference_versions`
- `onboarding_progress`

Use foreign keys, constraints, indexes, timestamps, and explicit deletion behavior.

Enable RLS on every user-data table. Demonstrate that:

- Users can read and modify their own private records.
- Discovery-safe fields are exposed only through an intentional view or function.
- One user cannot read another user's private consent information.
- Mobile clients cannot access service-role privileges.
- Historical consent versions cannot be rewritten by ordinary users.

Add policy tests or documented integration tests proving cross-user private access fails.

## 7. Data-access layer

Create one consistent data-access layer with:

- Typed inputs and outputs
- Central error mapping
- No scattered direct database calls from UI components
- Retries only for safe, idempotent operations
- Offline and timeout handling
- Redacted structured logs
- Stable public error codes rather than raw database messages

## 8. User experience states and accessibility

Primary screens must handle:

- Loading
- Empty
- Success
- Validation failure
- Network failure
- Permission failure
- Unexpected failure

Add a reusable error boundary and retry interface. The application must not show a blank screen because a request failed.

Accessibility baseline:

- Screen-reader labels
- Logical focus order
- Large touch targets
- Dynamic text sizing where practical
- No essential meaning conveyed only by color
- Reduced-motion compatibility

## 9. Local development

Configure local Supabase development with:

- Supabase configuration
- Repeatable migrations
- Safe seed data
- Two non-production demo users
- Database reset command
- `.env.example`
- Startup environment validation

Create `docs/LOCAL_DEVELOPMENT.md` with exact commands. A new developer must not need undocumented manual database changes.

## 10. Testing

### Unit tests

Cover:

- Domain schemas
- Authentication transitions
- Onboarding validation
- Profile serialization
- Error mapping

### Integration tests

Cover:

- Account creation
- Profile creation and retrieval
- RLS isolation
- Profile-version creation
- Session restoration

### Mobile smoke path

Automate when practical, otherwise document a deterministic procedure:

```text
launch
→ sign up
→ complete onboarding
→ reach authenticated home
→ restart
→ remain authenticated
→ sign out
```

Prioritize safety-critical state transitions over arbitrary coverage percentages.

## 11. Continuous integration

Add GitHub Actions checks for pull requests and pushes to the primary branch:

- Lockfile-based dependency installation
- Lint
- Type checking
- Unit tests
- Integration tests where feasible
- Build validation
- Migration validation

CI must fail when any required check fails. Document any check that cannot run in CI and explain why.

## 12. Documentation

Update the README and create:

- `docs/ARCHITECTURE.md`
- `docs/SECURITY_MODEL.md`
- `docs/DATA_CLASSIFICATION.md`
- `docs/CHAPTER_2_BASELINE.md`
- `docs/CHAPTER_2_COMPLETION.md`

The data-classification document must identify:

- Public data
- Discovery-visible data
- Private profile data
- Sensitive consent data
- Moderation data
- Secrets

## Suggested commit sequence

1. Baseline audit
2. Repository and command normalization
3. Domain types and validation
4. Authentication
5. Persistent onboarding
6. Database migrations and RLS
7. Data-access layer
8. Error and accessibility states
9. Local development environment
10. Tests
11. CI
12. Documentation

## Acceptance criteria

Chapter 2 is complete only when:

- A clean clone can be configured from documentation.
- Local services start with documented commands.
- A user can sign up, sign in, and sign out.
- Authentication survives app restart.
- Onboarding progress persists.
- A completed Touch Language Profile persists.
- Material profile changes create versions.
- Cross-user private-data access is rejected.
- No service-role key exists in mobile code.
- Loading and failure states are visible and usable.
- Lint passes.
- Type checking passes.
- Required tests pass.
- Build validation passes.
- CI passes.
- No secrets are committed.

## Completion response

When done, summarize:

1. What existed before the chapter
2. What changed
3. Architecture decisions
4. Security decisions
5. Tests added
6. Commands run and exact results
7. Known limitations
8. Every materially changed file
9. Recommended first task for Chapter 3

Never claim a command passed unless it was actually run. Never silently omit unfinished acceptance criteria.
