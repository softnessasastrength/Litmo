# Containment Lo-Fi · Soundtrack for the Cathedral

**This is currently a personal emotional containment system, not a public product.**

> Background music for people who can’t just fucking feel things without a protocol  
> and also need a beat that won’t yell.

**Route (in-app index):** `/containment/lofi`  
**Date:** 2026-07-13

---

## Philosophy

Lo-fi is the acoustic Soft Signal:

- low demand  
- no lyrical plot twists  
- room for a nervous system to reorganize  

These are **listening maps**, not bundled copyrighted files. Prefer streams/playlists you already have rights to play. For app embedding later: Pixabay / CC-BY tracks only.

---

## Protocol → vibe map

| Protocol | Vibe | BPM-ish energy | Keywords |
| -------- | ---- | -------------- | -------- |
| **Containment Hub** | Lobby jazz-hop | soft 70–85 | rainy window, open laptop, Option A |
| **Spooning Protocol** | Velvet / warm vinyl | slow 60–75 | blanket prison, Safety Spoon, held-together |
| **Morning Cuddle** | Half-awake gremlin | drowsy 55–70 | coffee not ready, 7:42am, Exit Protocol ok |
| **Attachment Repair Cathedral** | Soft church of reverb | spacious 50–70 | mommy issues, care-seeker strength, soft land |
| **Emotional Masochist Circuit** | Edge then release | low drone → gentle | capped intensity, no growth-porn soundtrack |
| **Conflict Navigation Sim** | Steady pulse, not aggressive | calm 70–80 | practice room, not courtroom |
| **Soft Signal / aftercare** | Near silence + rain | ambient | you are free |

---

## Curated listening (external)

### Always-on radio (great default)

| Source | Why | Link |
| ------ | --- | ---- |
| **Chillhop Radio** | Clean lo-fi / jazz-hop, built for long focus | https://chillhop.com/radio/ |
| **Chillhop Music** | Label playlists / essentials | https://chillhop.com/ |

### Royalty-friendly / free libraries (if you want files later)

| Source | Notes |
| ------ | ----- |
| **Pixabay Lo-fi** | Free downloads; check each track’s license | https://pixabay.com/music/search/lofi/ |
| **Free Stock Music · Lo-Fi** | Often CC-BY — credit when required | https://www.free-stock-music.com/lo-fi-hip-hop.html |
| **LAKEY INSPIRED** (and similar “no copyright lofi” YT/SoundCloud) | Often CC BY-SA — **read the credit line** before any embed | search “LAKEY INSPIRED chill lofi” |

### YouTube-shaped vibes (personal listening)

| Mood | Search / vibe |
| ---- | ------------- |
| Spooning | “lofi rain window soft jazz hop” |
| Morning gremlin | “sleepy lofi morning coffee” |
| Cathedral | “ambient lo-fi piano soft reverb” |
| Conflict sim | “study lofi steady no drop” |
| Soft Signal | “rain sounds soft piano minimal” |

---

## Suggested “album” order for a containment session

1. **Hub** — Chillhop radio (background)  
2. **Protocol of the day** — match table above  
3. **Aftercare / Soft Signal** — drop to rain or silence  
4. **Don’t autoplay bangers** — no tempo that mimics panic  

---

## Track titles we pretend we released (comedy canon)

Not real songs. Ritual flavor text for the app index:

| Fake track | Protocol |
| ---------- | -------- |
| *Gremlin Needs 8 Minutes* | Morning Cuddle |
| *Safety Spoon in D♭* | Spooning |
| *Court Summons (Lo-Fi Edit)* | Conflict Sim |
| *Care-Seeker Is Strength* | Mommy Issues Ritual |
| *Edge Is Capped* | Emotional Masochist Circuit |
| *No TED Talk Required* | Soft Signal |
| *Option A (Keep Building)* | Hub idle |

---

## In-app (expo-audio)

**Route:** `/containment/lofi`

| Piece | Role |
| ----- | ---- |
| `app/lib/lofiCatalog.ts` | Track catalog, comedy titles, CC URIs |
| `app/services/lofiAmbientPlayer.ts` | Singleton expo-audio player (loop, volume, mute, next/prev) |
| Prefs | AsyncStorage `litmo.lofi.ambient.prefs.v1` (wiped with local data) |

**Playback sources (remote HTTPS MP3):** Kevin MacLeod / incompetech.com  
**License:** Creative Commons Attribution 4.0 (CC BY 4.0)  
**Attribution (required):**  
Music by Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 License  
https://creativecommons.org/licenses/by/4.0/

Soft Signal of sound = **Stop** / **Mute** anytime. Needs network for first buffer.

Dependency: `expo-audio` (SDK 55). **Not** `expo-av` — EXAV fails to compile on Xcode 27 / current ExpoModulesCore.

---

## Non-claims

Not a Spotify product. Not clinical music therapy. Not required for any ritual.  
Not commercial lo-fi brand IP — free CC streams with credit.

**Last updated:** 2026-07-13
