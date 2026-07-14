/**
 * The Cathedral Purge — ritualized, escalating "delete everything."
 *
 * WHAT: A one-way, linear gate sequence (see cathedralPurgeCore.ts) ending
 *   in a real local data wipe and an optional queued account-erasure
 *   request. Every gate before execution can be walked away from with no
 *   explanation, same as Soft Signal. Reuses privacyService.wipeLocal() /
 *   requestErasure() exactly as app/app/privacy/delete-data.tsx already
 *   does — no new deletion mechanism invented here.
 * WHY: docs/CATHEDRAL_PURGE.md. The urge to burn everything and disappear
 *   is real; this gives it a slow, honest container instead of a 3am
 *   accidental tap.
 * CONSENT: Not consent to anything else. Naming a reason is optional.
 *   Typed confirmation exists to distinguish a decision from a reflex, not
 *   to interrogate anyone. Account erasure (if requested) is a queued
 *   human-fulfilled request, never instant server deletion — see
 *   docs/GDPR.md; this screen does not claim otherwise.
 * EDGE CASES: Countdown auto-cancels back to the confirmation gate if the
 *   screen unmounts mid-count (component cleanup clears the interval).
 *   Wipe failures are surfaced honestly, not hidden.
 * NEVER: Auto-advance a gate without an explicit tap. Claim the account
 *   erasure request is instant or complete. Skip the typed confirmation.
 *   Make "no reason given" change anything downstream.
 * SEE: docs/CATHEDRAL_PURGE.md, app/lib/cathedralPurgeCore.ts,
 *   app/services/cathedralSealStore.ts, app/services/privacyService.ts,
 *   app/services/localDataInventory.ts, app/app/privacy/delete-data.tsx.
 */
import { useEffect, useRef, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Choice, Eyebrow, Screen, Title } from "../../components/ui";
import {
  PURGE_CONFIRMATION_PHRASE,
  PURGE_COUNTDOWN_SECONDS,
  PURGE_REASON_OPTIONS,
  findPurgeGate,
  nextPurgeGate,
  purgeConfirmationMatches,
  type PurgeGateId,
  type PurgeReasonId,
} from "../../lib/cathedralPurgeCore";
import { cathedralSealStore } from "../../services/cathedralSealStore";
import { privacyService } from "../../services/privacyService";
import {
  collectLocalInventory,
  type LocalInventory,
} from "../../services/localDataInventory";
import { useAuth } from "../../context/AuthContext";
import type { LocalWipeReport } from "../../services/localDataWipe";

export default function CathedralPurgeScreen() {
  const router = useRouter();
  const { status } = useAuth();
  const [gateId, setGateId] = useState<PurgeGateId>("intro");
  const [reasonId, setReasonId] = useState<PurgeReasonId | null>(null);
  const [inventory, setInventory] = useState<LocalInventory | null>(null);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [alsoRequestErasure, setAlsoRequestErasure] = useState(false);
  const [erasureNote, setErasureNote] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(PURGE_COUNTDOWN_SECONDS);
  const [wipeReport, setWipeReport] = useState<LocalWipeReport | null>(null);
  const [erasureResult, setErasureResult] = useState<string | null>(null);
  const [erasureError, setErasureError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gate = findPurgeGate(gateId);

  const goBackToSettings = () => router.push("/settings" as never);

  const advance = () => {
    const next = nextPurgeGate(gateId);
    if (next) setGateId(next);
  };

  // Countdown gate — ticks down; auto-cancels the interval on unmount or
  // when the gate changes so leaving mid-count never leaves a stray timer.
  useEffect(() => {
    if (gateId !== "countdown") return;
    setSecondsLeft(PURGE_COUNTDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [gateId]);

  useEffect(() => {
    if (gateId === "countdown" && secondsLeft === 0) {
      setGateId("executing");
    }
  }, [gateId, secondsLeft]);

  // Execution gate — runs once on entry, always wipes local, optionally
  // queues server erasure, then advances to the closing gate.
  useEffect(() => {
    if (gateId !== "executing") return;
    let active = true;
    void (async () => {
      const report = await privacyService.wipeLocal();
      if (!active) return;
      setWipeReport(report);
      if (alsoRequestErasure && status === "authenticated") {
        const result = await privacyService.requestErasure(erasureNote);
        if (!active) return;
        if ("error" in result) setErasureError(result.error);
        else setErasureResult(result.id);
      }
      if (active) setGateId("done");
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gateId]);

  const loadInventory = async () => {
    setInventory(await collectLocalInventory());
  };

  return (
    <Screen>
      <Eyebrow>THE CATHEDRAL PURGE</Eyebrow>
      <Title>{gate.title}</Title>
      <Card>
        <Body>{gate.voiceLine}</Body>
      </Card>

      {gateId === "intro" ? (
        <>
          <Button label="Begin" onPress={advance} />
          <Button variant="secondary" label="Never mind" onPress={goBackToSettings} />
        </>
      ) : null}

      {gateId === "remove_seal" ? (
        <>
          <Button
            label="Remove my seal"
            onPress={() => {
              void cathedralSealStore.removeSeal();
              advance();
            }}
          />
          <Button variant="secondary" label="Cancel — I'm not ready" onPress={goBackToSettings} />
        </>
      ) : null}

      {gateId === "name_it" ? (
        <View style={{ gap: 8 }}>
          {PURGE_REASON_OPTIONS.map((r, i, arr) => (
            <Choice
              key={r.id}
              label={r.label}
              selected={reasonId === r.id}
              onPress={() => setReasonId(r.id)}
              index={i + 1}
              count={arr.length}
            />
          ))}
          <Body muted>
            Answering isn't required — nothing downstream reads this or
            changes based on it.
          </Body>
          <Button label="Continue" onPress={advance} />
          <Button variant="secondary" label="Cancel — I'm not ready" onPress={goBackToSettings} />
        </View>
      ) : null}

      {gateId === "last_look" ? (
        <View style={{ gap: 8 }}>
          {!inventory ? (
            <Button label="Show me what exists" onPress={() => void loadInventory()} />
          ) : (
            <Card>
              <Body muted>
                {Object.keys(inventory).length} local categories collected on
                this device just now. Nothing here is a guess.
              </Body>
            </Card>
          )}
          <Button
            variant="secondary"
            label="Export a copy first"
            onPress={() => router.push("/security/data-export" as never)}
          />
          <Card>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Body>Also queue account erasure request</Body>
              <Switch value={alsoRequestErasure} onValueChange={setAlsoRequestErasure} />
            </View>
            <Body muted>
              Signed-in only. Queued for human fulfillment — not instant
              server deletion. See docs/GDPR.md.
            </Body>
            {alsoRequestErasure ? (
              <TextInput
                value={erasureNote}
                onChangeText={setErasureNote}
                placeholder="Optional note (never required)"
                multiline
                style={{ minHeight: 60, borderWidth: 1, borderRadius: 12, padding: 10 }}
                accessibilityLabel="Optional erasure request note"
              />
            ) : null}
          </Card>
          <Button label="Continue" onPress={advance} disabled={!inventory} />
          <Button variant="secondary" label="Cancel — I'm not ready" onPress={goBackToSettings} />
        </View>
      ) : null}

      {gateId === "typed_confirmation" ? (
        <View style={{ gap: 8 }}>
          <Card>
            <Text style={{ fontWeight: "700" as const, fontSize: 16 }}>
              {PURGE_CONFIRMATION_PHRASE}
            </Text>
          </Card>
          <TextInput
            value={typedConfirmation}
            onChangeText={setTypedConfirmation}
            placeholder="Type the phrase exactly…"
            style={{ borderWidth: 1, borderRadius: 12, padding: 12 }}
            accessibilityLabel="Type the confirmation phrase"
          />
          <Button
            label="Confirm"
            disabled={!purgeConfirmationMatches(typedConfirmation)}
            onPress={advance}
          />
          <Button variant="secondary" label="Cancel — I'm not ready" onPress={goBackToSettings} />
        </View>
      ) : null}

      {gateId === "countdown" ? (
        <View style={{ gap: 8, alignItems: "center" as const }}>
          <Text style={{ fontSize: 48, fontWeight: "800" as const }}>{secondsLeft}</Text>
          <Button variant="signal" label="Stop — walk away, no explanation needed" onPress={goBackToSettings} />
        </View>
      ) : null}

      {gateId === "executing" ? <Body muted>Working…</Body> : null}

      {gateId === "done" ? (
        <View style={{ gap: 8 }}>
          {wipeReport ? (
            <Card>
              <Body muted>
                {wipeReport.asyncCleared.length + wipeReport.secureCleared.length +
                  wipeReport.vaultDomainsCleared.length}{" "}
                local stores cleared.
                {wipeReport.errors.length > 0
                  ? ` ${wipeReport.errors.length} could not be confirmed cleared — see logs.`
                  : ""}
              </Body>
            </Card>
          ) : null}
          {erasureResult ? (
            <Card>
              <Body muted>Erasure request recorded ({erasureResult.slice(0, 8)}…).</Body>
            </Card>
          ) : null}
          {erasureError ? (
            <Card>
              <Body muted>Erasure request could not be submitted: {erasureError}</Body>
            </Card>
          ) : null}
          <Button label="Back to Home" onPress={() => router.push("/(tabs)/home" as never)} />
        </View>
      ) : null}
    </Screen>
  );
}
