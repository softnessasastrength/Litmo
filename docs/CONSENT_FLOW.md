# Consent flow

1. Each participant maintains a personal touch profile and body-zone policy.
2. A session request creates no consent by itself.
3. The backend computes the strict intersection of both profiles.
4. The generated snapshot is immutable for that session.
5. Each participant independently confirms the same snapshot.
6. Only then may the session become active.
7. Consent remains revocable at any time; Soft Signal immediately exits the session.

## Conservative rules

- Empty overlap means the request cannot proceed.
- `off_limits` always wins.
- `ask_first` wins over `welcomed`.
- The lighter pressure and shorter duration always win.
- Unknown or malformed values fail closed.
- A prior confirmation never rolls forward into a new session.
