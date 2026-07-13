# Litmo Apple Watch integration

**Status:** scaffold + domain law shipped (ADR 0064)  
**Watch app:** `watch/` (XcodeGen)  
**Swift language:** `packages/LitmoWatchHaptics`  
**Phone bridge:** `app/services/watchHapticBridge.ts` · `app/modules/litmo-watch-haptics`

> The Watch is a soft co-regulation device — never a notification feed.

## Generate Watch project

```bash
cd watch
xcodegen generate   # brew install xcodegen
open LitmoWatch.xcodeproj
```

Sign with your team; set companion bundle to the Expo iOS app (`com.litmo.app` or your configured id).

## Soft Signal flow (wrist)

```text
User presses Soft Signal on Watch
  → Taptic sacred sequence (local, immediate)
  → SoftSignalKillCommand { killAllHaptics, endSession }
  → WCSession sendMessage / transferUserInfo (best effort)
  → Phone receives kill → emergency stop / session end if not already stopped

Phone Soft Signal
  → local end + interrupt haptics (always)
  → best-effort watchHapticBridge.softSignalFromWrist(sessionId)
  → must NEVER await Watch before localEnded
```

## Complications

- Soft Signal only (no peer names, no badges, no streaks)
- WidgetKit extension: `LitmoWatchWidgets`

## Consent / preview (domain ready)

Phone proposes → Watch previews Taptic → affirm → live  
Implemented in `@litmo/domain` `resolveCrossDeviceProposal` / `mayPlayOnDevice`.  
Watch UI for multi-step affirm is future; Soft Signal is live on scaffold.

## Physical validation checklist

- [ ] Soft Signal Taptic recognizable on real Watch  
- [ ] Soft Signal works airplane mode (local)  
- [ ] Complication opens Soft Signal path  
- [ ] Phone Soft Signal still works with Watch unpaired  
- [ ] No engagement complications present  

## Related

- ADR 0064  
- `docs/HAPTIC_LANGUAGE.md` § Watch  
- Learning path `haptic-watch-track`  
