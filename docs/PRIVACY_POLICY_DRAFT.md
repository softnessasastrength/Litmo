# Litmo privacy notice — pre-release draft

> **Engineering source for in-app copy:** `app/data/privacyContent.ts`  
> **GDPR alignment map:** `docs/GDPR.md`  
> This draft is **not** sufficient for public distribution without qualified legal review.

Litmo is an experimental consent-centered prototype, not emergency or clinical care. It stores account identity, device-registration metadata, Touch Language and consent preferences, session state, private wrap-up outcomes, and minimum audit facts. Private free-text notes receive device-bound application encryption; structured Consent Snapshots remain readable to their two participants and server enforcement under row-level security.

**Sensitive priority:** Touch profiles, consent preferences, and Consent Snapshots are privacy-by-design critical. They are not discovery-visible, not public safety scores, and never replace session-specific mutual confirmation.

Passkey private keys and biometric data remain with Apple. Session/device secrets remain in the passcode-required, this-device-only Keychain. Notifications reveal only that a private update exists. Litmo currently configures no analytics or crash-reporting vendor.

Compatibility, verification, and Trust Ledger events never certify safety. Withdrawal requires no reason and private safety information is not shared with the counterpart or general audit.

**Rights tooling (implemented engineering):** in-app Privacy Policy and Data Protection screens; `export_my_data` + device-local inventory export; device local wipe; `request_account_erasure` queue (no automatic hard-delete of `auth.users` until legal/ops approve destructive workflows); optional privacy-notice acceptance versioning.

Production retention periods, named controller/contact details, DPO/EU representative, subprocessors contracts, and complete automated erasure fulfillment are not finalized. Screenshot protection is limited; authorized on-screen content may be deliberately captured. Beta testers must use synthetic data only until a reviewed notice and deletion workflow are published.
