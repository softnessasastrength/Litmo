import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CampfireFlame } from "../components/CampfireFlame";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../components/ui";
import { useColors } from "../context/ThemeContext";
import { useThemedStyles } from "../hooks/useThemedStyles";
import {
  campfireProgress,
  canStartCircle,
  createCircleSeats,
  formatCampfireTime,
  resizeCircleSeats,
  toggleCircleSeat,
  type CircleSeat,
} from "../lib/campfireCore";
import { fonts, radius, type AppColors } from "../theme";

type CampfireView = "hub" | "circle" | "quiet" | "digital";

export default function CampfireScreen() {
  const [view, setView] = useState<CampfireView>("hub");
  if (view === "circle")
    return <CircleCampfire onBack={() => setView("hub")} />;
  if (view === "quiet") return <QuietCampfire onBack={() => setView("hub")} />;
  if (view === "digital")
    return <DigitalCampfire onBack={() => setView("hub")} />;
  return <CampfireHub onChoose={setView} />;
}

function CampfireHub({
  onChoose,
}: {
  onChoose: (view: Exclude<CampfireView, "hub">) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const modes = [
    {
      id: "circle" as const,
      icon: "people-outline" as const,
      title: "Circle campfire",
      detail:
        "A device-local group ritual. Every person opts in separately; anyone can pause it.",
    },
    {
      id: "quiet" as const,
      icon: "flame-outline" as const,
      title: "Quiet co-regulation",
      detail:
        "Share unstructured silence beside a gentle fire. No timer pressure and no activity record.",
    },
    {
      id: "digital" as const,
      icon: "hourglass-outline" as const,
      title: "Digital campfire",
      detail:
        "A calm, timed focus fire: visible progress without scores, streaks, or productivity surveillance.",
    },
  ];
  return (
    <Screen>
      <Eyebrow>CAMPFIRE MODE</Eyebrow>
      <Title>Gather without performing.</Title>
      <Body muted>
        Three local practices for presence. Campfire does not match people,
        record participation, grant consent, or prove anyone is safe.
      </Body>
      <CampfireFlame />
      {modes.map((mode) => (
        <Pressable
          key={mode.id}
          accessibilityRole="button"
          accessibilityLabel={`${mode.title}. ${mode.detail}`}
          onPress={() => onChoose(mode.id)}
          style={({ pressed }) => [styles.modeCard, pressed && styles.pressed]}
        >
          <View style={styles.modeIcon}>
            <Ionicons name={mode.icon} size={25} color={colors.moss} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.modeTitle}>{mode.title}</Text>
            <Text style={styles.modeDetail}>{mode.detail}</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.muted} />
        </Pressable>
      ))}
      <Card>
        <Text style={styles.cardHeading}>Local by design</Text>
        <Body muted>
          Campfire uses no camera, microphone, contacts, location, account
          sharing, or analytics. Closing the screen clears the ritual.
        </Body>
      </Card>
    </Screen>
  );
}

function CircleCampfire({ onBack }: { onBack: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const [seats, setSeats] = useState<CircleSeat[]>(() => createCircleSeats(3));
  const [phase, setPhase] = useState<"setup" | "active" | "paused">("setup");
  const allReady = canStartCircle(seats);

  if (phase === "active") {
    return (
      <Screen>
        <Eyebrow>CIRCLE CAMPFIRE</Eyebrow>
        <Title>The circle is present.</Title>
        <CampfireFlame label="The shared circle campfire is glowing" />
        <Card>
          <Text style={styles.cardHeading}>What is true right now</Text>
          <Body>
            Everyone opted in to this gathering. That does not grant permission
            for touch, disclosure, advice, or staying longer.
          </Body>
        </Card>
        <Button
          variant="signal"
          label="Anyone: pause the circle now"
          accessibilityHint="Immediately ends this local circle without asking for a reason"
          onPress={() => setPhase("paused")}
        />
        <Body muted center>
          No explanation is required. Stopping does not lower trust or create a
          record.
        </Body>
      </Screen>
    );
  }

  if (phase === "paused") {
    return (
      <Screen>
        <Eyebrow>CIRCLE PAUSED</Eyebrow>
        <Title>The circle stopped.</Title>
        <CampfireFlame active={false} label="The circle campfire is resting" />
        <Body>
          Someone asked to pause. Make space, check in verbally, and do not
          restart unless every person freely opts in again.
        </Body>
        <Button
          label="Set up a new circle"
          onPress={() => {
            setSeats(createCircleSeats(seats.length));
            setPhase("setup");
          }}
        />
        <Button variant="secondary" label="Back to Campfire" onPress={onBack} />
      </Screen>
    );
  }

  return (
    <Screen>
      <BackControl onPress={onBack} />
      <Eyebrow>CIRCLE CAMPFIRE</Eyebrow>
      <Title>Every voice enters separately.</Title>
      <Body muted>
        Pass the phone around. Each person taps only their own seat. Readiness
        means “join this gathering,” not permission for touch or disclosure.
      </Body>
      <View style={styles.counter}>
        <Button
          variant="secondary"
          label="Remove a seat"
          disabled={seats.length <= 2}
          onPress={() =>
            setSeats((current) =>
              resizeCircleSeats(current, current.length - 1),
            )
          }
        />
        <Text accessibilityLiveRegion="polite" style={styles.counterText}>
          {seats.length} people
        </Text>
        <Button
          variant="secondary"
          label="Add a seat"
          disabled={seats.length >= 8}
          onPress={() =>
            setSeats((current) =>
              resizeCircleSeats(current, current.length + 1),
            )
          }
        />
      </View>
      <View style={styles.seatList}>
        {seats.map((seat) => (
          <Pressable
            key={seat.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: seat.ready }}
            accessibilityLabel={`${seat.label}: ${seat.ready ? "ready" : "not ready"}`}
            accessibilityHint="Each person should change only their own seat"
            onPress={() =>
              setSeats((current) => toggleCircleSeat(current, seat.id))
            }
            style={({ pressed }) => [
              styles.seat,
              seat.ready && styles.seatReady,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={seat.ready ? "checkmark-circle" : "ellipse-outline"}
              size={26}
              color={
                seat.ready ? styles.readyColor.color : styles.restColor.color
              }
            />
            <View style={styles.flex}>
              <Text style={styles.seatTitle}>{seat.label}</Text>
              <Text style={styles.seatDetail}>
                {seat.ready ? "Ready to gather" : "Tap when freely ready"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Button
        label={allReady ? "Begin the circle" : "Waiting for every person"}
        disabled={!allReady}
        onPress={() => setPhase("active")}
      />
      <Body muted center>
        The circle starts only when every seat is ready. Any uncertainty means
        wait.
      </Body>
    </Screen>
  );
}

function QuietCampfire({ onBack }: { onBack: () => void }) {
  const [active, setActive] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setElapsedSeconds((seconds) => seconds + 1),
      1000,
    );
    return () => clearInterval(id);
  }, [active]);

  return (
    <Screen>
      <BackControl onPress={onBack} />
      <Eyebrow>QUIET CO-REGULATION</Eyebrow>
      <Title>Nothing to accomplish.</Title>
      <Body muted>
        Sit together or alone. The flame offers a shared point of attention.
        Silence, movement, distance, and leaving are all allowed.
      </Body>
      <CampfireFlame
        active={active}
        label={
          active
            ? "The quiet campfire is glowing"
            : "The quiet campfire is waiting"
        }
      />
      <Body center>{formatCampfireTime(elapsedSeconds)} present</Body>
      <Button
        label={
          active
            ? "Pause the flame"
            : elapsedSeconds
              ? "Continue quietly"
              : "Light the flame"
        }
        onPress={() => setActive((value) => !value)}
      />
      {elapsedSeconds > 0 ? (
        <Button
          variant="secondary"
          label="End without saving"
          onPress={() => {
            setActive(false);
            setElapsedSeconds(0);
          }}
        />
      ) : null}
      <Body muted center>
        Time is visible only for orientation. It is not a goal and is never
        saved.
      </Body>
    </Screen>
  );
}

const digitalStages = [
  "Arrive. Let the device become boring.",
  "Settle. Nothing needs an immediate response.",
  "Stay. Attention can wander and return.",
  "Close. Carry the quiet away from the screen.",
];

function DigitalCampfire({ onBack }: { onBack: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const [minutes, setMinutes] = useState(10);
  const [remaining, setRemaining] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const deadline = useRef<number | null>(null);
  const total = minutes * 60;
  const progress = campfireProgress(remaining, total);
  const progressWidth = `${Math.round(progress * 100)}%` as `${number}%`;
  const stageIndex = Math.min(
    digitalStages.length - 1,
    Math.floor(progress * digitalStages.length),
  );

  useEffect(() => {
    if (!running) return;
    const update = () => {
      if (deadline.current === null) return;
      const next = Math.max(
        0,
        Math.ceil((deadline.current - Date.now()) / 1000),
      );
      setRemaining(next);
      if (next === 0) {
        setRunning(false);
        setComplete(true);
        deadline.current = null;
      }
    };
    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [running]);

  const chooseMinutes = (next: number) => {
    setMinutes(next);
    setRemaining(next * 60);
    setComplete(false);
    setRunning(false);
    deadline.current = null;
  };

  const toggle = () => {
    if (running) {
      if (deadline.current !== null) {
        setRemaining(
          Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)),
        );
      }
      deadline.current = null;
      setRunning(false);
      return;
    }
    deadline.current = Date.now() + remaining * 1000;
    setRunning(true);
    setComplete(false);
  };

  return (
    <Screen>
      <BackControl onPress={onBack} />
      <Eyebrow>DIGITAL CAMPFIRE</Eyebrow>
      <Title>Watch time become warmth.</Title>
      <Body muted>
        A visible, finite focus period. No task list, notifications, scoring,
        streaks, or record of what you did.
      </Body>
      <View style={styles.durationRow}>
        {[5, 10, 20].map((value) => (
          <Button
            key={value}
            variant={minutes === value ? "primary" : "secondary"}
            label={`${value} min`}
            disabled={running}
            onPress={() => chooseMinutes(value)}
          />
        ))}
      </View>
      <CampfireFlame
        active={running}
        label={
          running
            ? "The digital focus campfire is glowing"
            : "The digital focus campfire is resting"
        }
      />
      <Text
        accessibilityLiveRegion="polite"
        accessibilityLabel={`${formatCampfireTime(remaining)} remaining`}
        style={styles.timer}
      >
        {formatCampfireTime(remaining)}
      </Text>
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: 100,
          now: Math.round(progress * 100),
        }}
        accessibilityLabel="Digital campfire progress"
        style={styles.progressTrack}
      >
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      <Body center>
        {complete ? "The fire is complete." : digitalStages[stageIndex]}
      </Body>
      <Button
        label={
          running
            ? "Pause"
            : remaining < total && !complete
              ? "Continue"
              : complete
                ? "Light again"
                : "Light the fire"
        }
        onPress={() => {
          if (complete) {
            setRemaining(total);
            deadline.current = Date.now() + total * 1000;
            setComplete(false);
            setRunning(true);
          } else {
            toggle();
          }
        }}
      />
      {remaining < total || complete ? (
        <Button
          variant="secondary"
          label="End without saving"
          onPress={() => chooseMinutes(minutes)}
        />
      ) : null}
    </Screen>
  );
}

function BackControl({ onPress }: { onPress: () => void }) {
  return (
    <Button variant="secondary" label="Back to Campfire" onPress={onPress} />
  );
}

function makeStyles(colors: AppColors, shadow: Record<string, unknown> = {}) {
  return {
    flex: { flex: 1 },
    pressed: { opacity: 0.76 },
    modeCard: {
      minHeight: 104,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 14,
      padding: 18,
      borderRadius: radius.md,
      backgroundColor: colors.paper,
      borderWidth: 1,
      borderColor: colors.line,
      ...shadow,
    },
    modeIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.apricotSoft,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    modeTitle: { color: colors.ink, fontSize: 19, fontWeight: "800" as const },
    modeDetail: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 4,
    },
    cardHeading: {
      color: colors.ink,
      fontSize: 18,
      fontWeight: "800" as const,
      marginBottom: 8,
    },
    counter: { gap: 10 },
    counterText: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 28,
      textAlign: "center" as const,
    },
    seatList: { gap: 10 },
    seat: {
      minHeight: 72,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 12,
      padding: 16,
      borderRadius: radius.md,
      backgroundColor: colors.paper,
      borderWidth: 1.5,
      borderColor: colors.line,
    },
    seatReady: {
      borderColor: colors.moss,
      backgroundColor: colors.mossSoft,
    },
    seatTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" as const },
    seatDetail: { color: colors.muted, fontSize: 14, marginTop: 3 },
    readyColor: { color: colors.moss },
    restColor: { color: colors.muted },
    durationRow: { gap: 8 },
    timer: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 52,
      textAlign: "center" as const,
    },
    progressTrack: {
      height: 12,
      borderRadius: radius.pill,
      overflow: "hidden" as const,
      backgroundColor: colors.line,
    },
    progressFill: {
      height: 12,
      borderRadius: radius.pill,
      backgroundColor: colors.apricot,
    },
  };
}
