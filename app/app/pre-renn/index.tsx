/** Pre-Renn Regulation Gate — before you dump weather onto a human. */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import { SoftSignalButton } from "../../components/SoftSignalButton";
import {
  canSealPreRenn,
  defaultPreRennDraft,
  sealPreRenn,
  summarizePreRenn,
  verdictCopy,
  type PreRennDraft,
  type PreRennSnapshot,
} from "../../lib/preRennGateCore";
import { preRennGateStore } from "../../services/preRennGateStore";
import { modeCopy } from "../../config/copy";
import { softSignalService } from "../../services/softSignalService";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import {
  modelBannerLine,
  preRennBiasFromModel,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function PreRennGateScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [draft, setDraft] = useState<PreRennDraft>(defaultPreRennDraft());
  const [snap, setSnap] = useState<PreRennSnapshot | null>(null);
  const [soft, setSoft] = useState<"idle" | "stopping" | "stopped">("idle");
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);
  const [delayPrimed, setDelayPrimed] = useState(false);
  const [summary, setSummary] = useState({
    total: 0,
    red: 0,
    yellow: 0,
    green: 0,
    honored_delay: 0,
  });

  useEffect(() => {
    void preRennGateStore.load().then((h) => setSummary(summarizePreRenn(h)));
    void relationshipModelStore.load().then((b) => {
      if (!b?.model) return;
      setRelModel(b.model);
      if (!delayPrimed) {
        const bias = preRennBiasFromModel(b.model);
        setDraft((d) => ({
          ...d,
          delayPledgeMinutes: bias.suggestedDelayMinutes,
        }));
        setDelayPrimed(true);
      }
    });
  }, [snap, delayPrimed]);

  const gate = canSealPreRenn(draft);
  const modelBias = relModel ? preRennBiasFromModel(relModel) : null;

  const seal = () => {
    const bias = modelBias
      ? {
          minVerdict: (modelBias.floodProtect
            ? "yellow"
            : undefined) as "yellow" | undefined,
          extraReasons: modelBias.extraReasons,
          extraHrefs: modelBias.extraHrefs,
        }
      : undefined;
    // Capacity ≤1 or flood_protect + high urge → floor can go red via flood body
    const s = sealPreRenn(draft, bias);
    if (!s) return;
    setSnap(s);
  };

  const finish = async (
    endReason:
      | "completed"
      | "soft_signal"
      | "honored_delay"
      | "engaged_anyway"
      | "abandoned",
  ) => {
    if (!snap) return;
    await preRennGateStore.append({
      snapshot: snap,
      endedAt: new Date().toISOString(),
      endReason,
      note: "",
    });
    setSnap(null);
    setDraft(defaultPreRennDraft());
  };

  if (snap) {
    const copy = verdictCopy(snap.verdict, modeCopy.partnerName);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>PRE-RENN GATE · {snap.verdict.toUpperCase()}</Eyebrow>
          <Title>{copy.title}</Title>
          <Card>
            <Body>{copy.body}</Body>
            {snap.reasons.map((r) => (
              <Body key={r} muted>
                · {r}
              </Body>
            ))}
            <Body muted>
              Flood {snap.bodyFlood}/5 · Urge {snap.urgeToText}/5 · delay pledge{" "}
              {snap.delayPledgeMinutes}m
            </Body>
            {snap.purpose ? <Body muted>Purpose: {snap.purpose}</Body> : null}
          </Card>
          <Text style={styles.h}>Suggested protocols</Text>
          {snap.recommendedHrefs.map((href) => (
            <Button
              key={href}
              variant="secondary"
              label={href}
              onPress={() => router.push(href as never)}
            />
          ))}
          <SoftSignalButton
            state={soft}
            onPress={async () => {
              setSoft("stopping");
              await softSignalService.practice();
              setSoft("stopped");
              await finish("soft_signal");
            }}
          />
          {snap.delayPledgeMinutes > 0 ? (
            <Button
              label={`Honor ${snap.delayPledgeMinutes}m delay (win)`}
              onPress={() => void finish("honored_delay")}
            />
          ) : null}
          {snap.verdict !== "red" ? (
            <Button
              variant="secondary"
              label="I engaged carefully"
              onPress={() => void finish("engaged_anyway")}
            />
          ) : (
            <Button
              variant="secondary"
              label="I engaged anyway (honest log)"
              onPress={() => void finish("engaged_anyway")}
            />
          )}
          <Button
            variant="secondary"
            label="Done · no reach"
            onPress={() => void finish("completed")}
          />
          <Button
            variant="secondary"
            label="Hub"
            onPress={() => router.push("/containment" as never)}
          />
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>PRE-RENN REGULATION GATE</Eyebrow>
        <Title>Before you dump on a human.</Title>
        <Body muted>
          Renn is not a fire extinguisher. Soft Signal free. {summary.total}{" "}
          gates · red {summary.red} · yellow {summary.yellow} · green{" "}
          {summary.green} · delays honored {summary.honored_delay}
        </Body>
        {relModel ? (
          <Card>
            <Body>Bond map: {modelBannerLine(relModel)}</Body>
            <Body muted>
              Delay primed to {modelBias?.suggestedDelayMinutes ?? 15}m from
              model. Soft Signal freeness unchanged.
            </Body>
            <Button
              variant="secondary"
              label="Open Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        ) : (
          <Card>
            <Body muted>
              No Relationship Model yet — map the bond so Pre-Renn can bias
              delay (still Soft Signal free).
            </Body>
            <Button
              variant="secondary"
              label="Seal Relationship Model first"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        )}
        <Card>
          <Body>Body flood (1 calm → 5 flooded)</Body>
          <View style={styles.row}>
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => setDraft({ ...draft, bodyFlood: n })}
                style={[
                  styles.chip,
                  draft.bodyFlood === n && {
                    borderColor: colors.moss,
                    backgroundColor: colors.mossSoft,
                  },
                ]}
                accessibilityLabel={`Body flood ${n}`}
              >
                <Text style={{ color: colors.ink }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <Body>Urge to text / reach (1–5)</Body>
          <View style={styles.row}>
            {([1, 2, 3, 4, 5] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => setDraft({ ...draft, urgeToText: n })}
                style={[
                  styles.chip,
                  draft.urgeToText === n && {
                    borderColor: colors.moss,
                    backgroundColor: colors.mossSoft,
                  },
                ]}
                accessibilityLabel={`Urge ${n}`}
              >
                <Text style={{ color: colors.ink }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            placeholder="Purpose of reach (even messy)"
            placeholderTextColor={colors.muted}
            value={draft.purpose}
            onChangeText={(t) => setDraft({ ...draft, purpose: t })}
            accessibilityLabel="Purpose of reach"
          />
          <Body muted>Delay pledge (minutes)</Body>
          <View style={styles.row}>
            {([0, 5, 15, 30, 60] as const).map((n) => (
              <Pressable
                key={n}
                onPress={() => setDraft({ ...draft, delayPledgeMinutes: n })}
                style={[
                  styles.chip,
                  draft.delayPledgeMinutes === n && {
                    borderColor: colors.moss,
                    backgroundColor: colors.mossSoft,
                  },
                ]}
              >
                <Text style={{ color: colors.ink }}>{n}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.rowBetween}>
            <Body>Soft Signal free</Body>
            <Switch
              value={draft.softSignalAcknowledged}
              onValueChange={(v) =>
                setDraft({ ...draft, softSignalAcknowledged: v })
              }
            />
          </View>
        </Card>
        {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
        <Button label="Run gate" onPress={seal} disabled={!gate.ok} />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    h: { fontWeight: "800" as const, color: colors.ink, fontSize: 16 },
    row: { flexDirection: "row" as const, gap: 8, marginVertical: 8, flexWrap: "wrap" as const },
    rowBetween: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginTop: 10,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cream,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      marginTop: 8,
    },
  };
}
