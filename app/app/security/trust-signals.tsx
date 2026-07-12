import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import {
  EmptyState,
  FailureState,
  LoadingState,
} from "../../components/AsyncState";
import { useAuth } from "../../context/AuthContext";
import {
  trustSignalsService,
  type MyTrustSignals,
} from "../../services/trustSignalsService";
import {
  matchingAccessService,
  type MatchingAccess,
} from "../../services/matchingAccessService";
import { type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function TrustSignalsScreen() {
  return (
    <SensitiveAccessGate>
      <TrustSignalsContent />
    </SensitiveAccessGate>
  );
}

function TrustSignalsContent() {
  const styles = useThemedStyles(makeStyles);
  const { status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; signals: MyTrustSignals; access: MatchingAccess }
  >({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const [signals, access] = await Promise.all([
        trustSignalsService.myTrustSignals(),
        matchingAccessService.myMatchingAccess(),
      ]);
      setState({ kind: "ready", signals, access });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Your private signals could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [load, status]);

  if (status !== "authenticated") {
    return (
      <Screen>
        <Eyebrow>YOUR SIGNALS</Eyebrow>
        <Title>Sign in to view.</Title>
        <Body muted>
          These are private facts about your own account — never a safety score
          for someone else.
        </Body>
      </Screen>
    );
  }

  if (state.kind === "loading") {
    return <LoadingState label="Loading your private signals…" />;
  }
  if (state.kind === "error") {
    return (
      <FailureState
        title="Signals unavailable"
        message={state.message}
        onRetry={() => void load()}
      />
    );
  }

  const s = state.signals;
  const access = state.access;

  return (
    <Screen>
      <Eyebrow>YOUR SIGNALS</Eyebrow>
      <Title>Specific facts, not a score.</Title>
      <Body muted>
        Litmo never reduces a person to a single safety rating. What follows is
        only about your account, for your awareness.
      </Body>
      <Card>
        <Text style={styles.rowLabel}>Matching access</Text>
        <Text style={styles.rowValue}>
          {access.matchingAllowed ? "Open" : "Paused"}
        </Text>
        {!access.matchingAllowed ? (
          <Body muted>
            {access.restrictionKind === "permanent_ban"
              ? "Matching is closed on this account. Contact support if you believe this is a mistake."
              : access.endsAt
                ? `Matching is paused until ${new Date(access.endsAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.`
                : "Matching is paused on this account while a review is active."}
          </Body>
        ) : null}
      </Card>
      <Card>
        <Text style={styles.rowLabel}>Account age</Text>
        <Text style={styles.rowValue}>
          {s.accountAgeDays === 0
            ? "Created today"
            : `${s.accountAgeDays} day${s.accountAgeDays === 1 ? "" : "s"}`}
        </Text>
      </Card>
      <Card>
        <Text style={styles.rowLabel}>Profile complete</Text>
        <Text style={styles.rowValue}>
          {s.profileComplete ? "Yes" : "Not yet"}
        </Text>
      </Card>
      <Card>
        <Text style={styles.rowLabel}>Adult confirmation</Text>
        <Text style={styles.rowValue}>
          {s.adultEligible ? "Recorded" : "Not recorded"}
        </Text>
      </Card>
      <Card>
        <Text style={styles.rowLabel}>Completed sessions</Text>
        <Text style={styles.rowValue}>{String(s.completedSessions)}</Text>
        <Body muted>
          Soft Signal endings: {s.softSignaledSessions}. Safety endings:{" "}
          {s.safetyEndedSessions}. Counts never prove someone is safe.
        </Body>
      </Card>
      <Card>
        <Text style={styles.rowLabel}>What peers may see</Text>
        <Body muted>
          Discovery may show account age in days and completed session count as
          separate facts — never a star rating or universal safety score.
          Matching holds you appeal are reviewed by a person.
        </Body>
      </Card>
      <EmptyState
        title="Mostly private"
        message="This full screen is for you. Positive history never overrides current consent."
      />
      <Button variant="secondary" label="Refresh" onPress={() => void load()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    rowLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
      marginBottom: 4,
    },
    rowValue: {
      color: colors.ink,
      fontSize: 20,
      fontWeight: "800",
    },
  };
}
