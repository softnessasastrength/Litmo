import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import {
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Body,
  Button,
  Choice,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { TouchLanguageMap } from "../../components/TouchLanguageMap";
import {
  BODY_ZONES,
  BOUNDARY_STATUS_OPTIONS,
  DURATION_OPTIONS,
  ENVIRONMENT_OPTIONS,
  HARD_LIMIT_PRESETS,
  HOLD_TYPE_OPTIONS,
  PRESSURE_OPTIONS,
  SOFT_LIMIT_PRESETS,
  SPEED_OPTIONS,
  ZONE_GROUPS,
  type BoundaryStatusId,
  type HoldTypeId,
  type ZoneId,
} from "../../data/touchLanguageCatalog";
import {
  completenessOf,
  createDefaultTouchLanguage,
  setAllUnsetZones,
  setZone,
  toggleEnvironment,
  toggleHoldType,
  toggleListItem,
  type TouchLanguageDocument,
} from "../../lib/touchLanguageCore";
import { touchLanguageStore } from "../../services/touchLanguageStore";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

type EditorStep =
  | "basics"
  | "holds"
  | "zones"
  | "limits"
  | "notes"
  | "review";

const STEPS: EditorStep[] = [
  "basics",
  "holds",
  "zones",
  "limits",
  "notes",
  "review",
];

/**
 * Full Touch Language editor — multi-step, visual, local save.
 */
export default function TouchLanguageEditScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [doc, setDoc] = useState<TouchLanguageDocument>(
    createDefaultTouchLanguage(),
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedZone, setSelectedZone] = useState<ZoneId | null>("hands");
  const [customHard, setCustomHard] = useState("");
  const [customSoft, setCustomSoft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const step = STEPS[stepIndex] ?? "basics";
  const complete = useMemo(() => completenessOf(doc), [doc]);

  useEffect(() => {
    void touchLanguageStore.loadOrDefault().then(setDoc);
  }, []);

  const patch = useCallback((fn: (d: TouchLanguageDocument) => TouchLanguageDocument) => {
    setDoc((d) => fn(d));
    setSavedFlash(false);
  }, []);

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const next = await touchLanguageStore.save(doc);
      setDoc(next);
      setSavedFlash(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save Touch Language locally.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Eyebrow>EDIT · TOUCH LANGUAGE</Eyebrow>
      <Text style={styles.progress}>
        Step {stepIndex + 1} of {STEPS.length} · {complete.zonesNamed}/
        {complete.zonesTotal} zones
      </Text>

      {step === "basics" ? (
        <>
          <Title>Pressure, speed, and duration</Title>
          <Body muted>
            These are overall defaults. Individual body zones can override
            pressure. Nothing here is consent.
          </Body>
          <Text style={styles.section}>Pressure</Text>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {PRESSURE_OPTIONS.map((opt) => (
              <Choice
                key={opt.id}
                label={opt.label}
                detail={opt.detail}
                selected={doc.pressure === opt.id}
                onPress={() =>
                  patch((d) => ({
                    ...d,
                    pressure: opt.id,
                    updatedAt: new Date().toISOString(),
                  }))
                }
              />
            ))}
          </View>
          <Text style={styles.section}>Speed / tempo</Text>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {SPEED_OPTIONS.map((opt) => (
              <Choice
                key={opt.id}
                label={opt.label}
                detail={opt.detail}
                selected={doc.speed === opt.id}
                onPress={() =>
                  patch((d) => ({
                    ...d,
                    speed: opt.id,
                    updatedAt: new Date().toISOString(),
                  }))
                }
              />
            ))}
          </View>
          <Text style={styles.section}>Duration</Text>
          <View accessibilityRole="radiogroup" style={styles.choices}>
            {DURATION_OPTIONS.map((opt) => (
              <Choice
                key={opt.id}
                label={opt.label}
                detail={opt.detail}
                selected={doc.duration === opt.id}
                onPress={() =>
                  patch((d) => ({
                    ...d,
                    duration: opt.id,
                    updatedAt: new Date().toISOString(),
                  }))
                }
              />
            ))}
          </View>
          <Text style={styles.section}>Environments (multi-select)</Text>
          <View style={styles.chipRow}>
            {ENVIRONMENT_OPTIONS.map((opt) => {
              const on = doc.environments.includes(opt.id);
              return (
                <Pressable
                  key={opt.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => patch((d) => toggleEnvironment(d, opt.id))}
                  style={[styles.chip, on && styles.chipOn]}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>
                    {on ? "✓ " : ""}
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}

      {step === "holds" ? (
        <>
          <Title>Preferred hold types</Title>
          <Body muted>
            Choose the shapes of contact that tend to feel okay. You can select
            several. “No holds” is a valid preference.
          </Body>
          <View style={styles.choices}>
            {HOLD_TYPE_OPTIONS.map((opt) => {
              const on = doc.holdTypes.includes(opt.id as HoldTypeId);
              return (
                <Choice
                  key={opt.id}
                  label={opt.label}
                  detail={opt.detail}
                  selected={on}
                  onPress={() =>
                    patch((d) => toggleHoldType(d, opt.id as HoldTypeId))
                  }
                />
              );
            })}
          </View>
        </>
      ) : null}

      {step === "zones" ? (
        <>
          <Title>Preferred areas</Title>
          <Body muted>
            Tap a zone on the map, then set welcomed / ask first / soft limit /
            hard limit. Unset zones stay off limits.
          </Body>
          <TouchLanguageMap
            document={doc}
            selectedZoneId={selectedZone}
            onSelectZone={setSelectedZone}
          />
          {selectedZone ? (
            <View style={styles.zoneEditor}>
              <Text style={styles.section}>
                {BODY_ZONES.find((z) => z.id === selectedZone)?.label}
              </Text>
              <Text style={styles.zoneDetail}>
                {BODY_ZONES.find((z) => z.id === selectedZone)?.detail}
              </Text>
              <View accessibilityRole="radiogroup" style={styles.choices}>
                {BOUNDARY_STATUS_OPTIONS.map((opt) => (
                  <Choice
                    key={opt.id}
                    label={opt.label}
                    detail={opt.detail}
                    selected={
                      (doc.zones[selectedZone]?.status ?? "off_limits") ===
                      opt.id
                    }
                    onPress={() =>
                      patch((d) =>
                        setZone(d, selectedZone, opt.id as BoundaryStatusId),
                      )
                    }
                  />
                ))}
              </View>
              {(doc.zones[selectedZone]?.status ?? "off_limits") !==
                "off_limits" && (
                <>
                  <Text style={styles.section}>Pressure for this zone</Text>
                  <View accessibilityRole="radiogroup" style={styles.choices}>
                    {PRESSURE_OPTIONS.map((opt) => (
                      <Choice
                        key={opt.id}
                        label={opt.label}
                        selected={
                          doc.zones[selectedZone]?.pressure === opt.id
                        }
                        onPress={() =>
                          patch((d) =>
                            setZone(
                              d,
                              selectedZone,
                              d.zones[selectedZone]?.status ?? "ask_first",
                              opt.id,
                            ),
                          )
                        }
                      />
                    ))}
                  </View>
                </>
              )}
            </View>
          ) : null}
          <Button
            variant="secondary"
            label="Mark remaining zones ask first"
            onPress={() => patch((d) => setAllUnsetZones(d, "ask_first"))}
          />
          {ZONE_GROUPS.map((g) => (
            <Text key={g.id} style={styles.groupHint}>
              {g.title}: {g.summary}
            </Text>
          ))}
        </>
      ) : null}

      {step === "limits" ? (
        <>
          <Title>Hard limits and soft limits</Title>
          <Body muted>
            Hard limits must never happen. Soft limits mean “usually avoid —
            only with extra care and an easy out.”
          </Body>
          <Text style={styles.section}>Hard limits</Text>
          <View style={styles.chipRow}>
            {HARD_LIMIT_PRESETS.map((item) => {
              const on = doc.hardLimits.includes(item);
              return (
                <Pressable
                  key={item}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() =>
                    patch((d) => ({
                      ...d,
                      hardLimits: toggleListItem(d.hardLimits, item),
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  style={[styles.chip, on && styles.chipHard]}
                >
                  <Text style={styles.chipText}>
                    {on ? "✓ " : ""}
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={customHard}
            onChangeText={setCustomHard}
            placeholder="Add a custom hard limit…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            onSubmitEditing={() => {
              if (!customHard.trim()) return;
              patch((d) => ({
                ...d,
                hardLimits: toggleListItem(d.hardLimits, customHard),
                updatedAt: new Date().toISOString(),
              }));
              setCustomHard("");
            }}
          />
          <Button
            variant="secondary"
            label="Add hard limit"
            onPress={() => {
              if (!customHard.trim()) return;
              patch((d) => ({
                ...d,
                hardLimits: toggleListItem(d.hardLimits, customHard),
                updatedAt: new Date().toISOString(),
              }));
              setCustomHard("");
            }}
          />

          <Text style={styles.section}>Soft limits</Text>
          <View style={styles.chipRow}>
            {SOFT_LIMIT_PRESETS.map((item) => {
              const on = doc.softLimits.includes(item);
              return (
                <Pressable
                  key={item}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() =>
                    patch((d) => ({
                      ...d,
                      softLimits: toggleListItem(d.softLimits, item),
                      updatedAt: new Date().toISOString(),
                    }))
                  }
                  style={[styles.chip, on && styles.chipSoft]}
                >
                  <Text style={styles.chipText}>
                    {on ? "✓ " : ""}
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={customSoft}
            onChangeText={setCustomSoft}
            placeholder="Add a custom soft limit…"
            placeholderTextColor={colors.muted}
            style={styles.input}
          />
          <Button
            variant="secondary"
            label="Add soft limit"
            onPress={() => {
              if (!customSoft.trim()) return;
              patch((d) => ({
                ...d,
                softLimits: toggleListItem(d.softLimits, customSoft),
                updatedAt: new Date().toISOString(),
              }));
              setCustomSoft("");
            }}
          />
        </>
      ) : null}

      {step === "notes" ? (
        <>
          <Title>Private nervous-system notes</Title>
          <Body muted>
            Optional. Stored only on this device. Never included in partner
            shares. Examples: “I need a minute before contact,” “No from-behind
            approaches,” “I freeze when rushed.”
          </Body>
          <TextInput
            value={doc.privateNotes ?? ""}
            onChangeText={(text) =>
              patch((d) => ({
                ...d,
                privateNotes: text.slice(0, 1000) || null,
                updatedAt: new Date().toISOString(),
              }))
            }
            multiline
            style={styles.noteInput}
            placeholder="Optional private note…"
            placeholderTextColor={colors.muted}
            maxLength={1000}
            accessibilityLabel="Private nervous system notes"
          />
          <Text style={styles.charCount}>
            {(doc.privateNotes ?? "").length}/1000
          </Text>
          <Text style={styles.section}>Share label (optional)</Text>
          <Body muted>
            A short name shown on your share package — not a legal name.
          </Body>
          <TextInput
            value={doc.displayLabel ?? ""}
            onChangeText={(text) =>
              patch((d) => ({
                ...d,
                displayLabel: text.trim().slice(0, 80) || null,
                updatedAt: new Date().toISOString(),
              }))
            }
            style={styles.input}
            placeholder="e.g. River’s map"
            placeholderTextColor={colors.muted}
            maxLength={80}
          />
        </>
      ) : null}

      {step === "review" ? (
        <>
          <Title>Review and save</Title>
          <Body muted>
            {complete.isMinimallyComplete
              ? "Looks ready for local use and optional secure share."
              : "You can still save — unset zones stay off limits."}
          </Body>
          <TouchLanguageMap document={doc} compact />
          <View style={styles.safety}>
            <Text style={styles.safetyTitle}>Your map is not consent.</Text>
            <Text style={styles.safetyBody}>
              Saving stores preferences on this device. Real sessions still need
              mutual Consent Snapshot confirmation. Soft Signal ends anything.
            </Text>
          </View>
          <Button
            label={busy ? "Saving…" : "Save Touch Language on this device"}
            disabled={busy}
            onPress={() => void save()}
          />
          {savedFlash ? (
            <Text style={styles.saved} accessibilityLiveRegion="polite">
              Saved privately on this device.
            </Text>
          ) : null}
          <Button
            variant="secondary"
            label="Secure share with a partner"
            onPress={async () => {
              await save();
              router.push("/touch-language/share" as never);
            }}
          />
        </>
      ) : null}

      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}

      <View style={styles.nav}>
        {stepIndex > 0 ? (
          <Button
            variant="secondary"
            label="Back"
            onPress={() => setStepIndex((i) => i - 1)}
          />
        ) : (
          <Button
            variant="secondary"
            label="Close"
            onPress={() => router.back()}
          />
        )}
        {stepIndex < STEPS.length - 1 ? (
          <Button
            label="Continue"
            onPress={() => setStepIndex((i) => i + 1)}
          />
        ) : (
          <Button
            label="Done"
            onPress={() => router.replace("/touch-language" as never)}
          />
        )}
      </View>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    progress: {
      color: colors.moss,
      fontSize: 12,
      fontWeight: "700" as const,
      marginBottom: 6,
    },
    section: {
      fontFamily: fonts.headline,
      fontSize: 22,
      color: colors.ink,
      marginTop: 16,
      marginBottom: 8,
    },
    choices: { gap: 9 },
    chipRow: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: 8,
    },
    chip: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    chipOn: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    chipHard: {
      borderColor: colors.signal,
      backgroundColor: colors.signalSoft,
    },
    chipSoft: {
      borderColor: colors.plum,
      backgroundColor: colors.plumSoft,
    },
    chipText: { color: colors.ink, fontSize: 14, fontWeight: "600" as const },
    chipTextOn: { color: colors.moss },
    input: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      padding: 12,
      color: colors.ink,
      fontSize: 16,
      marginTop: 8,
    },
    noteInput: {
      minHeight: 120,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.paper,
      padding: 14,
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      textAlignVertical: "top" as const,
      marginTop: 10,
    },
    charCount: {
      color: colors.muted,
      fontSize: 12,
      alignSelf: "flex-end" as const,
    },
    zoneEditor: {
      marginTop: 12,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      gap: 6,
    },
    zoneDetail: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    groupHint: { color: colors.muted, fontSize: 12, lineHeight: 17 },
    safety: {
      backgroundColor: colors.plumSoft,
      borderRadius: 18,
      padding: 18,
      gap: 5,
      marginTop: 8,
    },
    safetyTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" as const },
    safetyBody: { color: colors.muted, lineHeight: 21 },
    nav: { marginTop: 16, gap: 10 },
    error: { color: colors.signal, marginTop: 8 },
    saved: { color: colors.moss, fontWeight: "700" as const, marginTop: 8 },
  };
}
