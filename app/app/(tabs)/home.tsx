import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { sessionRepository } from "../../services/sessionRepository";
import { colors, fonts } from "../../theme";

export default function HomeTabScreen() {
  const router = useRouter();
  const { status, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !user) {
      setPendingCount(0);
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      try {
        const requests = await sessionRepository.listIncomingRequests();
        if (!cancelled) setPendingCount(requests.length);
      } catch {
        // Fail closed for the badge only — the requests screen owns errors.
        if (!cancelled) setPendingCount(0);
      }
    };
    void refresh();
    const unsubscribe = sessionRepository.subscribeToIncomingRequests(
      user.id,
      () => void refresh(),
    );
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [status, user]);

  return (
    <Screen>
      <Eyebrow>{status === "demo" ? "DEMO MODE" : "HOME"}</Eyebrow>
      <Title>Good to see you.</Title>
      <Body muted>
        A quiet landing spot. Discovery and trust history live in their own
        tabs; this is where session activity will surface as Litmo grows.
      </Body>
      <Card>
        <Text style={styles.cardTitle}>
          {status === "authenticated" && pendingCount > 0
            ? pendingCount === 1
              ? "1 session request waiting"
              : `${pendingCount} session requests waiting`
            : "Nothing active right now"}
        </Text>
        <Body muted>
          {status === "authenticated" && pendingCount > 0
            ? "Accepting only begins consent review. It never grants consent by itself."
            : "When you request or confirm a session, its status will show up here."}
        </Body>
        {status === "authenticated" && pendingCount > 0 ? (
          <View style={styles.cardAction}>
            <Button
              label="Review session requests"
              onPress={() => router.push("/requests")}
              accessibilityHint="Opens the list of people who have requested a session with you"
            />
          </View>
        ) : null}
      </Card>
      <Button
        variant="secondary"
        label="Meet the mock community"
        onPress={() => router.push("/discover")}
      />
      {status === "authenticated" ? (
        <Button
          variant="secondary"
          label={
            pendingCount > 0
              ? `Session requests (${pendingCount})`
              : "Session requests"
          }
          onPress={() => router.push("/requests")}
          accessibilityHint="Opens incoming session requests. The list updates live when a new request arrives."
        />
      ) : null}
      <Button
        variant="secondary"
        label="View private trust history"
        onPress={() => router.push("/profile/trust-ledger")}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  cardTitle: {
    color: colors.ink,
    fontFamily: fonts.headline,
    fontSize: 22,
    marginBottom: 6,
  },
  cardAction: { marginTop: 12 },
});
