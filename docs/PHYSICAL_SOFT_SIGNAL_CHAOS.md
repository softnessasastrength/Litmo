# Physical Soft Signal offline chaos checklist

**Status:** human-led verification (SS-F5)  
**Does not invent results** — founder/agent records pass/fail after running on device.

## Invariants under test

1. Local stop is immediate and final.  
2. Network failure never re-enables the session.  
3. No reason is required.  
4. Pending sync reconciles with the same idempotency semantics.  
5. Soft Signal is not emergency services.

## Prep

- iOS development build preferred (Expo Go only for demo Soft Signal practice).  
- Real or mock `sessionId` path for network branch.  
- Airplane mode toggle ready.

## Scenarios

| # | Steps | Expected | Pass? |
| - | ----- | -------- | ----- |
| 1 | Active session → Soft Signal online | Ends; wrap-up / sticky stopped; peer terminal if dual | |
| 2 | Airplane mode → Soft Signal | Local end; pending-sync language; Soft Signal disabled | |
| 3 | Scenario 2 → force quit → relaunch signed-in | Reconcile pending; session not active; Soft Signal still free | |
| 4 | Practice Soft Signal offline | practice_only log; no remote call needed | |
| 5 | Panic mode offline | Soft Signal + cover; session ended | |
| 6 | Sticky Soft Signal with large Dynamic Type + short height | Soft Signal remains reachable without scroll | |
| 7 | VoiceOver: Soft Signal button + sticky label | Correct label/hint; not color-only | |

## Unit coverage (already automated)

`app/services/softSignalServiceCore.test.ts`:

- practice never remote  
- remote success / pending / throw  
- log/haptic/hardware failure never undoes stop  

## Record results

Date: ________  
Build: ________  
Device: ________  
Notes: ________  

Do not mark SS-F5 complete in project-state without this table filled by a human.
