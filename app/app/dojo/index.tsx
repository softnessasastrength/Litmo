/**
 * In-app Exorcism Dojo surface — see defenses, log urges, track burn gates.
 * THIS IS A PRIVATE EXORCISM ARTIFACT, NOT A PRODUCT.
 */
import { useCallback, useEffect, useState } from "react";
import { ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import {
  BURN_GATES,
  DEFENSE_INVENTORY,
  DOJO_COPY,
  appendUrge,
  burnReadinessScore,
  defaultDojoState,
  setBurnGate,
  shouldPreferNotToBuild,
  type DefenseId,
  type DojoLocalState,
} from "../../lib/dojoCore";
import { dojoStore } from "../../services/dojoStore";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

export default function DojoScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [state, setState] = useState<DojoLocalState>(defaultDojoState());
  const [ready, setReady] = useState(false);
  const [fear, setFear] = useState("");
  const [defensePick, setDefensePick] = useState<DefenseId | "unknown">("D01");
  const [advice, setAdvice] = useState("");

  const persist = useCallback(async (next: DojoLocalState) => {
    setState(next);
    await dojoStore.save(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void dojoStore.load().then((s) => {
      if (cancelled) return;
      setState(s);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const score = burnReadinessScore(state);

  if (!ready) {
    return (
      <Screen>
        <Body muted>Loading dojo state…</Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>EXORCISM DOJO</Eyebrow>
        <Title>{DOJO_COPY.title}</Title>
        <Card>
          <Text style={styles.banner}>{DOJO_COPY.banner}</Text>
          <Body muted>{DOJO_COPY.subtitle}</Body>
        </Card>

        <Card>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Body>{DOJO_COPY.acknowledge}</Body>
            </View>
            <Switch
              accessibilityLabel="Acknowledge artifact not product"
              value={state.acknowledgedArtifact}
              onValueChange={(v) =>
                void persist({ ...state, acknowledgedArtifact: v })
              }
              trackColor={{ false: colors.line, true: colors.mossSoft }}
              thumbColor={
                state.acknowledgedArtifact ? colors.moss : colors.white
              }
            />
          </View>
        </Card>

        <Card>
          <Text style={styles.section}>Burn readiness</Text>
          <Body muted>
            {score.checked}/{score.total} gates ·{" "}
            {score.readyEnough
              ? "majority ready — see BURN_PROTOCOL when you choose"
              : "not a deadline; a door"}
          </Body>
          {BURN_GATES.map((g) => (
            <View key={g.id} style={styles.row}>
              <View style={{ flex: 1 }}>
                <Body>
                  {g.id}: {g.label}
                </Body>
              </View>
              <Switch
                accessibilityLabel={g.label}
                value={state.burnGates[g.id] === true}
                onValueChange={(v) =>
                  void persist(setBurnGate(state, g.id, v))
                }
                trackColor={{ false: colors.line, true: colors.mossSoft }}
                thumbColor={
                  state.burnGates[g.id] ? colors.moss : colors.white
                }
              />
            </View>
          ))}
          <Body muted>{DOJO_COPY.burnHint}</Body>
        </Card>

        <Card>
          <Text style={styles.section}>Urge before build</Text>
          <Body muted>{DOJO_COPY.urgePrompt}</Body>
          <TextInput
            accessibilityLabel="Fear sentence"
            value={fear}
            onChangeText={setFear}
            placeholder="If this stays ambiguous, I am afraid that…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            maxLength={500}
          />
          <Body muted>
            Defense: {defensePick} — tap cycle to walk D01–D24
          </Body>
          <Button
            variant="secondary"
            label={`Linked defense: ${defensePick}`}
            onPress={() => {
              const ids = DEFENSE_INVENTORY.map((d) => d.id);
              const i = ids.indexOf(
                defensePick === "unknown" ? "D01" : defensePick,
              );
              const next = ids[(i + 1) % ids.length] ?? "D01";
              setDefensePick(next);
              const adviceResult = shouldPreferNotToBuild({
                defenseId: next,
                fearAlreadyNamedInLog: state.urgeLog.some(
                  (u) => u.defenseId === next,
                ),
                isSoftSignalOrStopPath: next === "D03",
              });
              setAdvice(adviceResult.reason);
            }}
          />
          {advice ? <Body muted>{advice}</Body> : null}
          <Button
            label={DOJO_COPY.choseNotToBuild}
            onPress={() => {
              if (fear.trim().length < 1) return;
              void persist(
                appendUrge(state, {
                  fearSentence: fear,
                  defenseId: defensePick,
                  choseNotToBuild: true,
                  note: advice,
                }),
              );
              setFear("");
            }}
          />
          <Button
            variant="secondary"
            label={DOJO_COPY.choseToBuild}
            onPress={() => {
              if (fear.trim().length < 1) return;
              void persist(
                appendUrge(state, {
                  fearSentence: fear,
                  defenseId: defensePick,
                  choseNotToBuild: false,
                  note: advice,
                }),
              );
              setFear("");
            }}
          />
        </Card>

        <Card>
          <Text style={styles.section}>Defense inventory</Text>
          <Body muted>{DOJO_COPY.inventoryHint}</Body>
          <Button
            variant="secondary"
            label={
              state.seenInventory
                ? "Inventory marked seen"
                : "Mark inventory as seen"
            }
            onPress={() => void persist({ ...state, seenInventory: true })}
          />
          {DEFENSE_INVENTORY.map((d) => (
            <View key={d.id} style={styles.defRow}>
              <Body>
                <Text style={styles.defId}>{d.id}</Text> {d.system}
              </Body>
              <Body muted>Fear: {d.fear}</Body>
            </View>
          ))}
        </Card>

        <Card>
          <Text style={styles.section}>Recent urges</Text>
          {state.urgeLog.length === 0 ? (
            <Body muted>No urges logged yet. Naming is progress.</Body>
          ) : (
            state.urgeLog.slice(0, 8).map((u) => (
              <View key={u.id} style={styles.defRow}>
                <Body muted>
                  {u.defenseId} ·{" "}
                  {u.choseNotToBuild ? "did not build" : "chose to build"}
                </Body>
                <Body>{u.fearSentence}</Body>
              </View>
            ))
          )}
        </Card>

        <Button
          variant="secondary"
          label="Soft Signal practice"
          onPress={() => router.push("/soft-signal/practice" as never)}
          accessibilityHint="Stop remains free. Sacred exit path."
        />
        <Button
          variant="secondary"
          label="Back to Settings"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 14, paddingBottom: 40 },
    banner: {
      color: colors.signal,
      fontWeight: "800" as const,
      fontSize: 13,
      marginBottom: 8,
    },
    section: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 16,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      marginTop: 10,
    },
    input: {
      minHeight: 80,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      padding: 14,
      color: colors.ink,
      textAlignVertical: "top" as const,
      backgroundColor: colors.cream,
      marginTop: 10,
    },
    defRow: {
      borderTopWidth: 1,
      borderTopColor: colors.line,
      paddingTop: 8,
      marginTop: 8,
      gap: 2,
    },
    defId: { fontWeight: "800" as const, color: colors.moss },
  };
}
