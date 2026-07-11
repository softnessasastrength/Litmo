# Chapters 7–13 — Long-Term Platform Roadmap

These chapters preserve future intent. They are not active implementation assignments until promoted in `AGENTS.md`.

## Chapter 7 — Identity, Eligibility, and Verification

### Goal

Create privacy-conscious adult eligibility and identity controls without implying that identity verification proves safety.

### Planned work

- Adult eligibility and age-assurance strategy
- Optional identity verification adapters
- Verification-state lifecycle and expiration
- Privacy-preserving storage and deletion
- Fraud and duplicate-account controls
- Verification vendor abstraction
- Manual exception and appeal process
- Threat model and legal review gates
- Clear user language about what verification does and does not establish

### Gate

No production identity provider may be integrated before data-classification, retention, deletion, legal, and breach-response requirements are documented.

## Chapter 8 — Moderation Operations and Safeguarding

### Goal

Turn reporting and trust concepts into an accountable human moderation operation.

### Planned work

- Moderator roles and least-privilege access
- Case queue, evidence preservation, notes, and audit logs
- Report taxonomy and urgency levels
- Blocking, suspension, restriction, and appeal workflows
- Emergency escalation policy
- Moderator safety and wellness procedures
- Service-level objectives without automated guilt assumptions
- Transparency reporting
- Abuse simulations and tabletop exercises
- Data retention and lawful request procedures

### Gate

No public launch before moderation staffing, escalation ownership, and incident response are operationally credible.

## Chapter 9 — Accessibility, Internationalization, and Inclusive Design

### Goal

Make Litmo usable across disability, language, culture, device, and sensory needs without weakening explicit consent language.

### Planned work

- WCAG-aligned audit and remediation
- VoiceOver, TalkBack, keyboard, switch-control, and screen-magnifier testing
- Reduced motion, contrast, text scaling, haptics, and sensory settings
- Localization framework and message catalogs
- Consent-language translation review by qualified humans
- Right-to-left layout support
- Locale-aware date, time, duration, and measurement behavior
- Accessibility test matrix and release gates
- Inclusive research and compensated community review

### Gate

Machine translation alone may never be treated as sufficient for safety-sensitive or consent-critical copy.

## Chapter 10 — Multi-Platform Clients and Open-Source Preparation

### Goal

Evolve Litmo from a mobile application into a documented platform with consistent clients for iOS, Android, web, macOS, Windows, and Linux.

### Planned architecture

- Platform-neutral domain and consent packages
- Versioned API contracts
- Shared validation and generated clients
- Shared design tokens and accessible component specifications
- Thin clients that do not reinterpret safety rules
- Feature-capability negotiation for platform differences
- Offline and synchronization contracts
- Cross-platform conformance tests

### Planned clients

- iOS
- Android
- Web
- macOS
- Windows
- Linux
- Moderation and administration console

Desktop technology must be selected through an ADR after comparing web/PWA, React Native, Electron, Tauri, and native approaches. Do not assume one desktop framework prematurely.

### Open-source preparation

- Select an explicit license
- Define repository and package boundaries
- Separate deployable infrastructure, secrets, user data, and abuse-sensitive operational controls
- Publish `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and governance policy
- Establish maintainer roles and decision process
- Add issue templates, pull-request templates, release notes, and contributor CI
- Define trademark and brand-use policy
- Create a responsible disclosure process

### Open-source principle

Open source must improve inspectability, portability, and community contribution. It must not expose user data, secrets, moderation evidence, private infrastructure, or operational details that materially enable abuse.

## Chapter 11 — Public API, SDKs, and Ecosystem

### Goal

Allow approved clients and integrations to use Litmo's platform without fragmenting consent semantics.

### Planned work

- Versioned public API specification
- TypeScript SDK
- Swift SDK
- Kotlin SDK
- Additional SDKs based on demonstrated demand
- Authentication and authorization scopes
- Rate limits, quotas, and abuse controls
- Webhooks with signed delivery and replay protection
- Sandbox environment and fictional fixtures
- API deprecation and compatibility policy
- Developer documentation and example applications
- Conformance tests for third-party clients

### Gate

No third-party integration may bypass Consent Snapshot confirmation, Soft Signal behavior, privacy boundaries, or moderation controls.

## Chapter 12 — Release Engineering and Distribution

### Goal

Make builds reproducible, signed, testable, and recoverable across supported platforms.

### Planned work

- Reproducible builds and locked toolchains
- CI matrices for all supported clients
- Automated tests, packaging, signing, and artifact attestation
- TestFlight and App Store delivery
- Google Play delivery
- Web deployment
- macOS notarization
- Windows signing and packaging
- Linux packages and portable artifacts
- Release channels: development, alpha, beta, stable, and long-term support where justified
- Semantic versioning and changelog automation
- Rollback and emergency-release procedures
- Software bill of materials and dependency provenance

### Gate

A release is not complete until its artifacts, source revision, migration requirements, known limitations, and rollback procedure are documented.

## Chapter 13 — Production Operations, Reliability, and Continuity

### Goal

Operate Litmo as a resilient service that can survive vendor outages, maintainer turnover, and organizational disruption.

### Planned work

- Service-level indicators and objectives
- Monitoring, alerting, tracing, and privacy-safe logs
- Incident command and post-incident review
- Backup, restore, and disaster-recovery testing
- Multi-region and vendor-exit analysis
- Infrastructure as code
- Secret rotation and privileged-access review
- Capacity, cost, and abuse-load testing
- Dependency and vulnerability management
- Business continuity and succession runbooks
- Domain, signing key, repository, and package-registry recovery
- Data export and service wind-down plan

### Gate

Continuity procedures must be tested, not merely described.

## Cross-platform invariant

A Litmo concept must mean the same thing on every client. `ConsentSnapshot`, `Soft Signal`, profile versions, session states, privacy classifications, and trust events may not acquire platform-specific meanings.

## Sequencing rule

Do not implement these chapters simply because they are documented. Promote one chapter at a time through `AGENTS.md` only after the prior chapter has a completion report and its acceptance criteria pass or are explicitly accepted as deferred by a documented human decision.
