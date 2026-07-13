/**
 * Non-sensitive build diagnostics. Never shows consent, tokens, or urge free-text.
 * Dojo block is flags/counts only (D23 lifecycle honesty for the founder).
 */
import { useEffect, useState } from "react";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../components/ui";
import { runtimeConfig } from "../config/runtime";
import {
  DOJO_CORE_VERSION,
  summarizeDojoForInventory,
  type DojoInventorySummary,
} from "../lib/dojoCore";
import { dojoStore } from "../services/dojoStore";
import { useRouter } from "expo-router";

export default function DiagnosticsScreen() {
  const router = useRouter();
  const [dojo, setDojo] = useState<DojoInventorySummary | null>(null);

  useEffect(() => {
    if (!runtimeConfig.allowDiagnostics) return;
    let cancelled = false;
    void (async () => {
      try {
        const present = await dojoStore.hasStoredState();
        if (cancelled) return;
        if (!present) {
          setDojo(summarizeDojoForInventory(null));
          return;
        }
        const state = await dojoStore.load();
        if (cancelled) return;
        setDojo(summarizeDojoForInventory(state));
      } catch {
        if (!cancelled) setDojo(summarizeDojoForInventory(null));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!runtimeConfig.allowDiagnostics)
    return (
      <Screen>
        <Title>Unavailable.</Title>
        <Body>Diagnostics are not included in production.</Body>
      </Screen>
    );
  return (
    <Screen>
      <Eyebrow>NON-SENSITIVE DIAGNOSTICS</Eyebrow>
      <Title>Build context.</Title>
      <Body>Environment: {runtimeConfig.environment}</Body>
      <Body>App version: 0.1.0</Body>
      <Body muted>
        No profiles, identifiers, consent data, tokens, keys, notes, or session
        content appear here.
      </Body>

      <Card>
        <Body>Exorcism Dojo (device-local, not a product metric)</Body>
        <Body muted>
          Core v{DOJO_CORE_VERSION} · storage litmo.dojo.state.v1 · wipe clears
          this key · export never includes urge free-text
        </Body>
        {dojo ? (
          <>
            <Body muted>
              State present: {dojo.present ? "yes" : "no"} · artifact ack:{" "}
              {dojo.acknowledged_artifact ? "yes" : "no"} · inventory seen:{" "}
              {dojo.seen_inventory ? "yes" : "no"}
            </Body>
            <Body muted>
              Urges: {dojo.urge_count} (chose not to build:{" "}
              {dojo.chose_not_to_build_count}) · burn gates:{" "}
              {dojo.burn_gates_checked}/{dojo.burn_gates_total}
            </Body>
          </>
        ) : (
          <Body muted>Loading dojo flags…</Body>
        )}
        <Button
          variant="secondary"
          label="Open Exorcism Dojo"
          onPress={() => router.push("/dojo" as never)}
        />
      </Card>
    </Screen>
  );
}
