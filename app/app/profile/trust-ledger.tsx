import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Pill,
  Screen,
  Title,
} from "../../components/ui";
import { ledgerEntries } from "../../data/mock";
import { colors } from "../../theme";
import { useAuth } from "../../context/AuthContext";

export default function TrustLedgerScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  return (
    <Screen>
      <Eyebrow>PRIVATE · SYNTHETIC HISTORY</Eyebrow>
      <Title>Your Trust Ledger</Title>
      <Body muted>
        A quiet record of your own mock interactions—not a popularity score and
        never proof that someone is safe.
      </Body>
      <Card>
        <Text style={styles.number}>3</Text>
        <Text style={styles.metric}>affirmed mock sessions</Text>
      </Card>
      <View style={styles.timeline}>
        {ledgerEntries.map((entry, index) => (
          <View key={`${entry.date}-${entry.person}`} style={styles.entry}>
            <View style={styles.rail}>
              <View style={styles.dot} />
              {index < ledgerEntries.length - 1 ? (
                <View style={styles.line} />
              ) : null}
            </View>
            <View style={styles.entryBody}>
              <Text style={styles.date}>{entry.date}</Text>
              <Text style={styles.person}>Session with {entry.person}</Text>
              <Pill>{entry.outcome}</Pill>
              <Text style={styles.detail}>{entry.detail}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Context, not certification.</Text>
        <Body muted>
          Trust is built through ongoing consensual behavior. Every future
          interaction still begins with a fresh choice.
        </Body>
      </View>
      <Button
        label="Return to the beginning"
        onPress={() => router.replace("/")}
      />
      <Button
        variant="secondary"
        label="Sign out"
        onPress={() => void signOut()}
      />
    </Screen>
  );
}
const styles = StyleSheet.create({
  number: { color: colors.moss, fontFamily: "Georgia", fontSize: 50 },
  metric: { color: colors.muted, fontSize: 15 },
  timeline: { gap: 0 },
  entry: { flexDirection: "row", minHeight: 130 },
  rail: { width: 28, alignItems: "center" },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: colors.apricot,
    borderWidth: 3,
    borderColor: colors.cream,
  },
  line: { width: 2, flex: 1, backgroundColor: colors.line },
  entryBody: { flex: 1, paddingBottom: 24, gap: 6 },
  date: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  person: { color: colors.ink, fontFamily: "Georgia", fontSize: 20 },
  detail: { color: colors.muted, fontSize: 13 },
  notice: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 18,
    gap: 5,
  },
  noticeTitle: { color: colors.ink, fontSize: 17, fontWeight: "800" },
});
