# Local-first architecture

**Status:** implemented in mobile app (vault + optional encrypted backup)  
**ADR:** [0058-local-first-personal-vault.md](adr/0058-local-first-personal-vault.md)  
**Migration:** `041_personal_encrypted_backups.sql`

> Personal data is authoritative **on the device**.  
> The network is optional. Offline is a first-class mode, not a degraded path.  
> Cloud backup, when enabled, stores **opaque ciphertext only**.

## Goals

1. **Full offline** personal use: Touch Language, Consent Snapshot prepare/seal (local), Soft Signal log, private history, learning progress, quiz summaries.
2. **Local writes always succeed** without waiting on network.
3. **Optional encrypted cloud backup** — opt-in, owner-only RLS, client-sealed.
4. **Fail closed** on decrypt / tamper; fail open on remote backup (local still wins).
5. Never treat backup, history, or vault presence as consent, safety score, or readiness.

## Authority model

```text
User action
  → validate (pure core)
  → localVault write (Secure Store preferred)
  → UI updates from local
  → (optional) seal + upsert ciphertext if backup enabled + signed in
```

| Layer | Role |
| ----- | ---- |
| **Local vault** | Authoritative personal store |
| **Session server** | Shared multi-party session / dual-confirm when online (existing) |
| **Encrypted backup** | Disaster recovery of *own* sealed blobs only |

Shared session activation and dual participant confirmation still require the existing server authority when using real accounts online. **Personal maps and history do not.**

## Vault domains

| Domain | Contents | Sensitive |
| ------ | -------- | --------- |
| `touch_language` | Full Touch Language document | Yes |
| `consent_declaration` | Pre-session personal declaration | Yes |
| `consent_mutual` | Local mutual seal package | Yes |
| `soft_signal_log` | Private Soft Signal history | Yes |
| `private_history` | Private trust/session notes list | Yes |
| `learning_progress` | Module step/completion metadata | No |
| `quiz_results` | Own quiz summaries | Yes |
| `backup_prefs` | Opt-in + last backup metadata | No |

Key registry: `app/services/localVault.ts` (`VAULT_KEYS`).

**Not in vault / not backed up:** partner E2E ratchet keys, device registration secret, passkey material, session tokens.

## Offline behavior

| Feature | Offline |
| ------- | ------- |
| Edit Touch Language | Full |
| Consent Snapshot prepare + local mutual seal (demo partner) | Full |
| Soft Signal practice + personal log | Full |
| Guided Learning progress | Full |
| Private history | Full |
| Quizzes play + local save | Full |
| Encrypted cloud backup / restore | Requires network + account |
| Live multi-user session with remote peer | Requires network (existing) |
| Discovery / matching | Requires network (existing) |

Demo mode remains fully local with no Supabase.

## Encrypted cloud backup

### Opt-in

- Default **off**.
- Settings → **Local-first vault & encrypted backup** (`/security/local-first`).
- Enable creates a 32-byte master key in Secure Store and shows a **recovery code** once (exportable again while key present).

### Crypto

- AES-256-GCM via `@noble/ciphers`
- Per-domain key: HKDF-SHA-256(master, salt, info=`LitmoPersonalBackup-v1|domain`)
- Envelope: `{ v, domain, salt, ct, sealedAt, alg, opaque: true }`
- Server never receives plaintext or the master key

### Server

Table `personal_encrypted_backups` + RPC `upsert_own_encrypted_backup`:

- Owner RLS only
- `ciphertext` opaque text
- Domains allow-listed
- Size bounds enforced

### Restore

1. Sign in on new device  
2. Install recovery code  
3. Restore from cloud → local vault overwritten for restored domains  

Wrong code → decrypt fails closed; local left intact if no write occurred.

## Code map

| Path | Role |
| ---- | ---- |
| `app/lib/localFirstCore.ts` | Domains, prefs, private history types |
| `app/services/localVault.ts` | Unified Secure Store / AsyncStorage vault |
| `app/services/encryptedBackupCore.ts` | Seal / open / recovery code |
| `app/services/encryptedCloudBackupService.ts` | Opt-in backup/restore |
| `app/services/localFirstCoordinator.ts` | After-write best-effort backup |
| `app/services/privateHistoryStore.ts` | Private history document |
| `app/services/touchLanguageStore.ts` | TL → vault |
| `app/services/sessionConsentSnapshotStore.ts` | Snapshots → vault |
| `app/services/softSignalLogStore.ts` | Soft Signal log → vault |
| `app/services/learningProgress.ts` | Learning → vault |
| `app/services/quizResultsStore.ts` | Quiz summaries → vault |
| `app/services/dojoStore.ts` | Exorcism Dojo urge log + burn gates (AsyncStorage `litmo.dojo.state.v1`) |
| `app/app/security/local-first.tsx` | User control surface |
| `supabase/migrations/041_personal_encrypted_backups.sql` | Owner ciphertext table |

## Wipe & inventory

- `wipeLocalLitmoData` clears all vault domains + backup master + E2E keys + prefs, including `litmo.dojo.state.v1`.
- `collectLocalInventory` reports vault presence, offline_ready, backup enabled, and Dojo **flags/counts only** — never raw secrets, never urge fear sentences.

## Safety non-claims

- Local history is **not** a public trust ledger score.
- Backup completion is **not** consent skill certification.
- Restored Soft Signal logs are personal only.
- Cloud ciphertext is **not** readable by staff under normal operation (no server keys).

## Future work

- Passphrase-wrapped master key (in addition to recovery code)
- Selective domain backup toggles
- Background backup queue with exponential backoff
- Multi-device key sync without iCloud Keychain migration of app secrets
- SQL tests for RLS on `personal_encrypted_backups`
