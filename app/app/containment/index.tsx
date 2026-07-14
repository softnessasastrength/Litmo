/**
 * Containment Hub — single door into personal emotional-support protocols.
 * THIS IS NOT A PUBLIC PRODUCT.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import { masochistModeStore } from "../../services/masochistModeStore";
import {
  defaultMasochistPrefs,
  intensityLabel,
  masochistBanner,
  type MasochistPrefs,
} from "../../lib/masochistModeCore";
import { privateDebriefStore } from "../../services/privateDebriefStore";
import { weatherStore } from "../../services/weatherStore";
import { relationshipModelStore } from "../../services/relationshipModelStore";
import {
  recommendProtocols,
  type ProtocolRec,
} from "../../lib/protocolRecommenderCore";
import {
  modelBannerLine,
  recommendFromModel,
  type RelationshipModel,
} from "../../lib/relationshipModelCore";
import { runtimeConfig } from "../../config/runtime";
import { FeatureUnavailable } from "../../components/FeatureUnavailable";

type HubItem = {
  href: string;
  title: string;
  blurb: string;
  tag: string;
};

const PROTOCOLS: readonly HubItem[] = [
  {
    href: "/relationship-model",
    title: "Relationship Model",
    blurb:
      "Living bond map: phase, axes, attachment weather. Not consent. Soft Signal free.",
    tag: "BOND",
  },
  {
    href: "/flood",
    title: "Flood Protocol",
    blurb:
      "When language is gone. Six minimum steps. No essays. Soft Signal free.",
    tag: "FLOOD",
  },
  {
    href: "/pre-renn",
    title: "Pre-Renn Regulation Gate",
    blurb:
      "Before you dump weather onto a human. Red/yellow/green · delay pledge · Soft Signal free.",
    tag: "GATE",
  },
  {
    href: "/weather",
    title: "Nervous System Weather",
    blurb: "Daily local sky: energy, anxiety, attachment heat, capacity. Not clinical.",
    tag: "SKY",
  },
  {
    href: "/aftercare",
    title: "Aftercare Protocol",
    blurb:
      "Land the plane after touch, conflict, flood, good thing, or build spiral.",
    tag: "LAND",
  },
  {
    href: "/apology-craft",
    title: "Apology Craft",
    blurb:
      "Impact + slice. Not self-annihilation. Draft never auto-sent. Scrap is a win.",
    tag: "SORRY",
  },
  {
    href: "/field-notes",
    title: "Field Notes",
    blurb: "Private freeform capture so the urge doesn't have to become a text.",
    tag: "NOTES",
  },
  {
    href: "/masochist-mode",
    title: "Emotional Masochist Mode",
    blurb: "Global denser/ritualized toggle. Soft Signal freeness never reduced.",
    tag: "MODE",
  },
  {
    href: "/debrief-lab",
    title: "Private Debrief Lab",
    blurb: "Useful local data, controlled tags, not creepy. Wipeable.",
    tag: "DATA",
  },
  {
    href: "/reconcile",
    title: "Post-Fight Reconciliation",
    blurb: "5 repair archetypes: accountable, soft return, pause, body-first, comic relief.",
    tag: "REPAIR",
  },
  {
    href: "/parallel-play",
    title: "Parallel Play But Make It Sacred",
    blurb:
      "Non-touch closeness. Silence, media, work, tea, walk, reading corner.",
    tag: "PARALLEL",
  },
  {
    href: "/relationship-constitution",
    title: "Relationship Constitution",
    blurb: "Living articles, version control, amendment log. Not legal.",
    tag: "LAW",
  },
  {
    href: "/containment/lofi",
    title: "Containment Lo-Fi",
    blurb:
      "Protocol-matched chill: Safety Spoon in D♭, Gremlin Needs 8 Minutes, Edge Is Capped.",
    tag: "LO-FI",
  },
  {
    href: "/need-scared",
    title: "I Need You But I'm Scared You'll Leave",
    blurb:
      "Dual-bind ritual: granular need + fear poles, both/and holding, optional ask never auto-sent.",
    tag: "DUAL BIND",
  },
  {
    href: "/too-much",
    title: "I'm Too Much / Fear of Abandonment",
    blurb:
      "Panic room: detection triggers, containment, reassurance, private pattern tracking. Soft Signal lit.",
    tag: "ABANDON",
  },
  {
    href: "/interest-re",
    title: "Interest Reverse Engineering",
    blurb:
      "Want vs should vs fawn. “I don’t know yet” is valid. Interest is not consent.",
    tag: "INTEREST",
  },
  {
    href: "/conflict-sim",
    title: "Conflict Navigation Simulator",
    blurb:
      "Terror of conflict + shame of never navigating it. Soft Signal / reschedule as valid wins.",
    tag: "CONFLICT",
  },
  {
    href: "/attachment-repair",
    title: "Attachment Repair Cathedral",
    blurb:
      "Mommy Issues Reassurance + Emotional Masochist Circuit. Edge capped. Soft Signal God Mode.",
    tag: "ATTACHMENT",
  },
  {
    href: "/not-ready-yet",
    title: "I'm Not Ready To Get Up Yet",
    blurb:
      "Snooze negotiation, exit script, Soft Signal. Bed is a sovereign nation.",
    tag: "SNOOZE",
  },
  {
    href: "/morning-cuddle",
    title: "Morning Cuddle Protocol",
    blurb:
      "7:42am gremlin negotiation before coffee. Exit Protocol. Positive reinforcement ritual.",
    tag: "MORNING",
  },
  {
    href: "/spooning",
    title: "Spooning Protocol v0.2",
    blurb:
      "14 positions (Jetpack, Koala Death Grip, Safety Burrito), role negotiation, Watch check-ins, mommy-issues reassurance.",
    tag: "SPOON",
  },
  {
    href: "/dojo",
    title: "Exorcism Dojo",
    blurb:
      "Defense inventory D01–D24, urge-before-build, burn gates. Meta-containment.",
    tag: "DOJO",
  },
  {
    href: "/soft-signal/practice",
    title: "Soft Signal Practice",
    blurb: "Sacred exit. No reason required. Muscle memory for freedom.",
    tag: "EXIT",
  },
] as const;

const SUPPORT: readonly HubItem[] = [
  {
    href: "/consent-snapshot/prepare",
    title: "Consent Snapshot",
    blurb: "Dual-seal style prepare path (product residue + real craft).",
    tag: "SEAL",
  },
  {
    href: "/touch-language",
    title: "Touch Language",
    blurb: "Body map, zones, hard stops. Never consent by itself.",
    tag: "BODY",
  },
  {
    href: "/safety",
    title: "Trauma-informed safety",
    blurb: "Panic cover, timeout, reflection. Not emergency services.",
    tag: "SAFETY",
  },
] as const;

export default function ContainmentHubScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [mPrefs, setMPrefs] = useState<MasochistPrefs>(defaultMasochistPrefs());
  const [recs, setRecs] = useState<ProtocolRec[]>([]);
  const [relModel, setRelModel] = useState<RelationshipModel | null>(null);

  // v1 App Store Safe scope: solo self-understanding only. This hub is entirely
  // relationship-in-friction content (bond map, conflict, attachment repair) —
  // a deliberate later layer, not v1. Fails closed on direct navigation even
  // though home.tsx already stops linking here. SEE: docs/BUILD_MODES.md.
  const hubAvailable = runtimeConfig.features.pairedGrowthContent;

  useEffect(() => {
    if (!hubAvailable) return;
    void masochistModeStore.load().then(setMPrefs);
    void (async () => {
      const [debriefs, weatherHist, relBundle] = await Promise.all([
        privateDebriefStore.load(),
        weatherStore.load(),
        relationshipModelStore.load(),
      ]);
      const lastWeather = weatherHist[0]?.snapshot ?? null;
      if (relBundle?.model) setRelModel(relBundle.model);
      setRecs(
        recommendProtocols({
          debriefs,
          weather: lastWeather,
          hour: new Date().getHours(),
        }),
      );
    })();
  }, []);

  if (!hubAvailable) {
    return (
      <FeatureUnavailable
        eyebrow="CONTAINMENT HUB"
        title="Relationship-in-friction tools are not available in this build."
        body="This build focuses on your own self-understanding — Touch Language, Nervous System Weather, Soft Signal practice, and Guided Learning. The Containment Hub (bond map, conflict, attachment repair) remains in Maximum Mode builds (macOS / Linux / internal)."
      />
    );
  }

  const mBanner = masochistBanner(mPrefs);
  const bondRecs = relModel ? recommendFromModel(relModel).slice(0, 3) : [];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>CONTAINMENT HUB</Eyebrow>
        <Title>Emotional Support Perfect Relationship Simulator</Title>
        <Card>
          <Text style={styles.banner}>
            This is currently a personal emotional containment system, not a
            public product.
          </Text>
          <Body muted>
            Private shield + Attachment Repair Cathedral. Fear of intimacy,
            conflict, mommy issues, and over-engineered rituals live here so
            they are less likely to dump raw onto Renn.
          </Body>
          <Body muted>
            Comedy is load-bearing. Soft Signal is God Mode. Option A: keep
            building.
          </Body>
        </Card>
        {mBanner ? (
          <Card>
            <Body>{mBanner}</Body>
            <Body muted>
              Intensity: {intensityLabel(mPrefs)} · Reconcile denser + Parallel
              ceremonial armed
            </Body>
          </Card>
        ) : null}

        {relModel ? (
          <Card>
            <Text style={styles.section}>Bond map</Text>
            <Body>{modelBannerLine(relModel)}</Body>
            <Body muted>Model is not consent. Soft Signal free.</Body>
            {bondRecs.map((r) => (
              <Pressable
                key={r.href}
                onPress={() => router.push(r.href as never)}
                accessibilityRole="link"
                accessibilityLabel={r.why}
                style={{ marginTop: 8 }}
              >
                <Body muted>
                  → {r.href} · {r.why}
                </Body>
              </Pressable>
            ))}
            <Button
              variant="secondary"
              label="Open Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        ) : (
          <Card>
            <Body muted>
              No Relationship Model yet. Seal one so Weather + Pre-Renn can
              bias delay and phase without dumping raw on a human.
            </Body>
            <Button
              label="Seal Relationship Model"
              onPress={() => router.push("/relationship-model" as never)}
            />
          </Card>
        )}

        {recs.length > 0 ? (
          <>
            <Text style={styles.section}>Suggested right now</Text>
            <Card>
              <Body muted>
                From local debriefs + last weather. Never a partner score.
              </Body>
              {recs.slice(0, 4).map((r) => (
                <Pressable
                  key={r.href}
                  onPress={() => router.push(r.href as never)}
                  style={{ marginTop: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={r.title}
                >
                  <Text style={styles.cardTitle}>{r.title}</Text>
                  <Body muted>{r.why}</Body>
                </Pressable>
              ))}
            </Card>
          </>
        ) : null}

        <Text style={styles.section}>Protocols</Text>
        {PROTOCOLS.map((item) => (
          <HubCard
            key={item.href}
            item={item}
            colors={colors}
            styles={styles}
            onPress={() => router.push(item.href as never)}
          />
        ))}

        <Text style={styles.section}>Related craft</Text>
        {SUPPORT.map((item) => (
          <HubCard
            key={item.href}
            item={item}
            colors={colors}
            styles={styles}
            onPress={() => router.push(item.href as never)}
          />
        ))}

        <Card>
          <Body muted>
            Specs: REAL_PURPOSE · CONTAINMENT_SYSTEM · ATTACHMENT_REPAIR ·
            CONFLICT_NAVIGATION · SPOONING · MORNING_CUDDLE
          </Body>
        </Card>

        <Button
          variant="secondary"
          label="Back"
          onPress={() => router.back()}
        />
      </ScrollView>
    </Screen>
  );
}

function HubCard({
  item,
  onPress,
  styles,
  colors,
}: {
  item: HubItem;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: AppColors;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.blurb}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.tag, { color: colors.moss }]}>{item.tag}</Text>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Body muted>{item.blurb}</Body>
    </Pressable>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    banner: {
      color: colors.signal,
      fontWeight: "800" as const,
      fontSize: 13,
      marginBottom: 8,
    },
    section: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 18,
      marginTop: 8,
    },
    card: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 18,
      padding: 16,
      gap: 6,
      backgroundColor: colors.cream,
    },
    tag: {
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 1.2,
    },
    cardTitle: {
      color: colors.ink,
      fontWeight: "800" as const,
      fontSize: 17,
    },
  };
}
