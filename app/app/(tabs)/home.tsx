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
import { colors, fonts } from "../../theme";

export default function HomeTabScreen() {
  const router = useRouter();
  const { status } = useAuth();
  return (
    <Screen>
      <Eyebrow>{status === "demo" ? "DEMO MODE" : "HOME"}</Eyebrow>
      <Title>Good to see you.</Title>
      <Body muted>
        A quiet landing spot. Discovery and trust history live in their own
        tabs; this is where session activity will surface as Litmo grows.
      </Body>
      <Card>
        <Text style={styles.cardTitle}>Nothing active right now</Text>
        <Body muted>
          When you request or confirm a session, its status will show up here.
        </Body>
      </Card>
      <Button
        variant="secondary"
        label="Meet the mock community"
        onPress={() => router.push("/discover")}
      />
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
});
