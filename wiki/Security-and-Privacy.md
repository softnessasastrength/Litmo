# Security and Privacy

Litmo handles highly sensitive information. Security and privacy are therefore architectural requirements, not release polish.

## Security posture

- Prefer passkeys over passwords.
- Require device-owner authentication for sensitive access.
- Store credentials and local secrets in platform key storage.
- Encrypt highly sensitive application data with authenticated encryption.
- Keep server-side authorization and database constraints authoritative.
- Apply row-level security and least privilege.
- Fail closed when identity, authorization, key state, or consent state is ambiguous.

## Data minimization

Litmo should collect and retain only what is necessary for the user-facing purpose and safety model.

Sensitive free text must not leak into:

- general audit metadata;
- analytics;
- crash reports;
- diagnostic logs;
- notifications;
- clipboard history;
- screenshots or app-switcher previews;
- developer test fixtures.

## Biometric application lock

The application should cover sensitive content before authentication completes and whenever it backgrounds. Face ID or other device-owner authentication verifies access; Litmo never receives or stores biometric data.

## Notification privacy

Lock-screen notifications should be generic. Sensitive content is revealed only after successful application unlock.

## Encryption boundaries

Sensitive data should use modern platform-supported cryptography, key versioning, rotation planning, integrity checks, and explicit handling for key loss, revocation, and corruption. Custom cryptographic primitives are prohibited.

## Threat-model mindset

The project considers stolen devices, malicious participants, stale clients, replayed requests, compromised tokens, database exposure, insider access, offline tampering, screenshots, and shoulder surfing. No single mitigation is treated as complete protection.