/**
 * Relationship Model — living private bond map.
 * Not consent. Not a score. Soft Signal free.
 */
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Share,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import {
  ATTACHMENT_WEATHERS,
  CLOSENESS_STYLES,
  PHASES,
  canSealModel,
  createModel,
  defaultDraft,
  exportModelText,
  findPhase,
  linkConstitution,
  modelSummaryLine,
  recommendFromModel,
  setPhase,
  unlinkConstitution,
  updateAxes,
  type RelationshipAxes,
  type RelationshipEvent,
  type RelationshipModel,
  type RelationshipModelDraft,
  type RelationshipPhase,
  type AttachmentWeather,
  type ClosenessStyle,
} from "../../lib/relationshipModelCore";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import { relationshipConstitutionStore } from "../../services/relationshipConstitutionStore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";

export default function RelationshipModelScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [model, setModel] = useState<RelationshipModel | null>(null);
  const [events, setEvents] = useState<RelationshipEvent[]>([]);
  const [draft, setDraft] = useState<RelationshipModelDraft>(defaultDraft());
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    const b = await relationshipModelStore.load();
    if (b) {
      setModel(b.model);
      setEvents(b.events);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const persist = async (
    next: RelationshipModel,
    nextEvents: RelationshipEvent[],
  ) => {
    setModel(next);
    setEvents(nextEvents);
    await relationshipModelStore.saveModel(next, nextEvents);
  };

  const seal = async () => {
    const m = createModel(draft);
    if (!m) return;
    const ev: RelationshipEvent = {
      id: `evt-${Date.now()}`,
      at: m.createdAt,
      kind: "created",
      summary: `Created · ${m.label}`,
      phaseAfter: m.phase,
    };
    await persist(m, [ev]);
  };

  const changePhase = async (phase: RelationshipPhase) => {
    if (!model) return;
    const { model: next, event } = setPhase(model, phase);
    await persist(next, [event, ...events].slice(0, 100));
  };

  const bumpAxis = async (key: keyof RelationshipAxes, value: 1 | 2 | 3 | 4 | 5) => {
    if (!model) return;
    const { model: next, event } = updateAxes(model, { [key]: value });
    await persist(next, [event, ...events].slice(0, 100));
  };

  const linkCurrentConstitution = async () => {
    if (!model) return;
    const doc = await relationshipConstitutionStore.load();
    const { model: next, event } = linkConstitution(model, {
      id: doc.id,
      title: doc.title,
      version: doc.version,
    });
    await persist(next, [event, ...events].slice(0, 100));
  };

  const unlinkCurrentConstitution = async () => {
    if (!model) return;
    const { model: next, event } = unlinkConstitution(model);
    await persist(next, [event, ...events].slice(0, 100));
  };

  if (!loaded) {
    return (
      <Screen>
        <Body muted>Loading relationship model…</Body>
      </Screen>
    );
  }

  if (model) {
    const phase = findPhase(model.phase);
    const recs = recommendFromModel(model);
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Eyebrow>RELATIONSHIP MODEL</Eyebrow>
          <Title>{model.label}</Title>
          <Body muted>{modelSummaryLine(model)}</Body>
          <Card>
            <Body>
              This map is private containment infrastructure. It is{" "}
              <Text style={styles.bold}>not consent</Text>, not a partner score,
              not legal. Soft Signal freeness is law.
            </Body>
          </Card>

          <Text style={styles.h}>Operating phase</Text>
          {PHASES.filter((p) => p.id !== "unknown").map((p) => (
            <Pressable
              key={p.id}
              onPress={() => void changePhase(p.id)}
              style={[
                styles.card,
                model.phase === p.id && { borderColor: colors.moss },
              ]}
              accessibilityRole="button"
              accessibilityLabel={p.label}
            >
              <Text style={styles.cardTitle}>{p.label}</Text>
              <Body muted>{p.blurb}</Body>
            </Pressable>
          ))}

          <Card>
            <Text style={styles.h}>Axes (bond climate, not a person grade)</Text>
            {(
              [
                ["capacity", "Capacity"],
                ["conflictClimate", "Conflict climate"],
                ["closenessEase", "Closeness ease"],
                ["softSignalCulture", "Soft Signal culture"],
              ] as const
            ).map(([key, label]) => (
              <View key={key} style={{ marginTop: 10 }}>
                <Body>
                  {label}: {model.axes[key]}/5
                </Body>
                <View style={styles.row}>
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => void bumpAxis(key, n)}
                      style={[
                        styles.chip,
                        model.axes[key] === n && {
                          borderColor: colors.moss,
                          backgroundColor: colors.mossSoft,
                        },
                      ]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: model.axes[key] === n }}
                      accessibilityLabel={`${label} ${n}`}
                      hitSlop={6}
                    >
                      <Text style={{ color: colors.ink }}>{n}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </Card>

          <Card>
            <Body muted>
              Closeness: {model.closenessStyle} · Weather:{" "}
              {model.attachmentWeather}
            </Body>
            {model.operatingNotes ? (
              <Body muted>Notes: {model.operatingNotes}</Body>
            ) : null}
            <Body muted>Phase blurb: {phase.blurb}</Body>
          </Card>

          <Card>
            <Text style={styles.h}>Constitution link</Text>
            <Body muted>
              {model.constitutionRef
                ? `Linked: ${model.constitutionRef}`
                : "Not linked. Optional — reference only, never pulls articles into this map."}
            </Body>
            <Button
              variant="secondary"
              label={model.constitutionRef ? "Re-link current version" : "Link current constitution"}
              onPress={() => void linkCurrentConstitution()}
            />
            {model.constitutionRef ? (
              <Button
                variant="secondary"
                label="Unlink"
                onPress={() => void unlinkCurrentConstitution()}
              />
            ) : null}
          </Card>

          <Text style={styles.h}>Suggested protocols</Text>
          {recs.map((r) => (
            <Button
              key={r.href}
              variant="secondary"
              label={`${r.href} — ${r.why}`}
              onPress={() => router.push(r.href as never)}
            />
          ))}

          <Button
            variant="secondary"
            label="Relationship Constitution"
            onPress={() => router.push("/relationship-constitution" as never)}
          />
          <Button
            label="Export text"
            onPress={() => void Share.share({ message: exportModelText(model) })}
          />
          <Button
            variant="secondary"
            label="Reset model (local)"
            onPress={() => {
              void (async () => {
                await relationshipModelStore.clear();
                setModel(null);
                setEvents([]);
                setDraft(defaultDraft());
              })();
            }}
          />
          <Card>
            <Text style={styles.h}>Recent events</Text>
            {events.length === 0 ? (
              <Body muted>None yet.</Body>
            ) : (
              events.slice(0, 8).map((e) => (
                <Body key={e.id} muted>
                  {e.at.slice(0, 16).replace("T", " ")} · {e.summary}
                </Body>
              ))
            )}
          </Card>
          <Button
            variant="secondary"
            label="Hub"
            onPress={() => router.push("/containment" as never)}
          />
        </ScrollView>
      </Screen>
    );
  }

  const gate = canSealModel(draft);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>RELATIONSHIP MODEL v0.1</Eyebrow>
        <Title>Map the bond. Not a score.</Title>
        <Body muted>
          Living private model: phase, closeness language, attachment weather,
          climate axes. Soft Signal freeness required. Model is never consent.
        </Body>
        <TextInput
          style={styles.input}
          value={draft.label}
          onChangeText={(t) => setDraft({ ...draft, label: t })}
          placeholder="Bond label (e.g. me + Renn)"
          placeholderTextColor={colors.muted}
          accessibilityLabel="Bond label"
        />
        <Text style={styles.h}>Phase</Text>
        {PHASES.filter((p) => p.id !== "unknown").map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setDraft({ ...draft, phase: p.id })}
            accessibilityRole="radio"
            accessibilityState={{ selected: draft.phase === p.id }}
            accessibilityLabel={`${p.label}. ${p.blurb}`}
            style={[
              styles.card,
              draft.phase === p.id && { borderColor: colors.moss },
            ]}
          >
            <Text style={styles.cardTitle}>{p.label}</Text>
            <Body muted>{p.blurb}</Body>
          </Pressable>
        ))}
        <Text style={styles.h}>Closeness style</Text>
        {CLOSENESS_STYLES.filter((c) => c.id !== "undecided").map((c) => (
          <Pressable
            key={c.id}
            onPress={() =>
              setDraft({ ...draft, closenessStyle: c.id as ClosenessStyle })
            }
            accessibilityRole="radio"
            accessibilityState={{ selected: draft.closenessStyle === c.id }}
            accessibilityLabel={`${c.label}. ${c.blurb}`}
            style={[
              styles.card,
              draft.closenessStyle === c.id && { borderColor: colors.moss },
            ]}
          >
            <Text style={styles.cardTitle}>{c.label}</Text>
            <Body muted>{c.blurb}</Body>
          </Pressable>
        ))}
        <Text style={styles.h}>Attachment weather</Text>
        {ATTACHMENT_WEATHERS.filter((a) => a.id !== "unknown").map((a) => (
          <Pressable
            key={a.id}
            onPress={() =>
              setDraft({
                ...draft,
                attachmentWeather: a.id as AttachmentWeather,
              })
            }
            accessibilityRole="radio"
            accessibilityState={{ selected: draft.attachmentWeather === a.id }}
            accessibilityLabel={`${a.label}. ${a.blurb}`}
            style={[
              styles.card,
              draft.attachmentWeather === a.id && { borderColor: colors.moss },
            ]}
          >
            <Text style={styles.cardTitle}>{a.label}</Text>
            <Body muted>{a.blurb}</Body>
          </Pressable>
        ))}
        <TextInput
          style={[styles.input, { minHeight: 80 }]}
          multiline
          value={draft.operatingNotes}
          onChangeText={(t) => setDraft({ ...draft, operatingNotes: t })}
          placeholder="Operating notes (never auto-sent)"
          placeholderTextColor={colors.muted}
        />
        <View style={styles.rowBetween}>
          <Body>Soft Signal free (required)</Body>
          <Switch
            value={draft.softSignalAcknowledged}
            onValueChange={(v) =>
              setDraft({ ...draft, softSignalAcknowledged: v })
            }
          />
        </View>
        {!gate.ok ? <Body muted>{gate.reason}</Body> : null}
        <Button label="Seal relationship model" onPress={() => void seal()} disabled={!gate.ok} />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 48 },
    h: {
      fontWeight: "800" as const,
      color: colors.ink,
      fontSize: 16,
      marginTop: 4,
    },
    bold: { fontWeight: "800" as const, color: colors.ink },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 12,
      backgroundColor: colors.cream,
      gap: 4,
    },
    cardTitle: { fontWeight: "800" as const, color: colors.ink, fontSize: 15 },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
    },
    row: { flexDirection: "row" as const, gap: 8, marginTop: 6, flexWrap: "wrap" as const },
    rowBetween: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
    },
    chip: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cream,
    },
  };
}
