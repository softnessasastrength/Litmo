# Parallel Play But Make It Sacred v0.2

**This is currently a personal emotional containment system, not a public product.**

> Co-presence without obligatory touch or performance. Soft Signal free.

**Route:** `/parallel-play`  
**Core:** `app/lib/parallelPlayCore.ts`

---

## Purpose

Prove that **closeness ≠ touch tax** and **connection ≠ productivity**.  
Hold “if we’re not touching/talking am I failing the relationship?” with a sacred non-touch protocol.

---

## Modes

| Id | Label | Guide |
| -- | ----- | ----- |
| `same_room_silence` | Same-room silence | 15 min · silence = co-regulation |
| `shared_media` | Shared media | 30 min · commentary optional |
| `side_by_side_work` | Side-by-side work | 45 min · no productivity scoring |
| `voice_notes_async` | Async voice notes | open · delay ≠ discard |
| `ritual_tea` | Ritual tea / water | 10 min · drink is ceremony |
| `parallel_walk` | Parallel walk | 20 min · Soft Signal free to split |
| `reading_corner` | Reading corner | 30 min · pages are privacy |

Each mode has **entryRitual**, **exitRitual**, **sacredRule**.

---

## Seal requirements

1. Soft Signal free acknowledged  
2. Non-touch unless separately sealed acknowledged  
3. Mode selected  

Fail-closed otherwise.

---

## Ceremonial copy

When Emotional Masochist Mode ceremonial copy is on, active session shows entry/exit + denser sacred line.

---

## Code map

| Path | Role |
| ---- | ---- |
| `docs/PARALLEL_PLAY_SACRED.md` | Spec |
| `app/lib/parallelPlayCore.ts` | Pure logic |
| `app/services/parallelPlayStore.ts` | History |
| `app/app/parallel-play/index.tsx` | UI |

---

**Last updated:** 2026-07-13
