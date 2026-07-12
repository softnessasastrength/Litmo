import { useCallback, useEffect, useState } from "react";
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
import { SensitiveAccessGate } from "../../components/SensitiveAccessGate";
import {
  EmptyState,
  FailureState,
  LoadingState,
} from "../../components/AsyncState";
import { blockService } from "../../services/blockService";
import { supabase } from "../../services/supabase";
import { colors } from "../../theme";

type BlockedRow = {
  blockedId: string;
  displayName: string;
  createdAt: string;
};

export default function BlockedAccountsScreen() {
  return (
    <SensitiveAccessGate>
      <BlockedAccountsContent />
    </SensitiveAccessGate>
  );
}

function BlockedAccountsContent() {
  const { status } = useAuth();
  const [state, setState] = useState<
    | { kind: "loading" }
    | { kind: "error"; message: string }
    | { kind: "ready"; rows: BlockedRow[] }
  >({ kind: "loading" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const blocked = await blockService.listBlockedUsers();
      const { data: profiles } = await supabase.rpc("discovery_profiles");
      // Blocked users are hidden from discovery; names may only come from the
      // blocker's local knowledge. Show a private label without implying the
      // other person knows about the block.
      const nameById = new Map<string, string>(
        (profiles ?? []).map(
          (row: { user_id: string; display_name: string }) => [
            row.user_id,
            row.display_name,
          ],
        ),
      );
      setState({
        kind: "ready",
        rows: blocked.map((row) => ({
          ...row,
          displayName: nameById.get(row.blockedId) ?? "Blocked account",
        })),
      });
    } catch (caught) {
      setState({
        kind: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Blocked accounts could not be loaded.",
      });
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") void load();
  }, [status, load]);

  if (status !== "authenticated") {
    return (
      <Screen scroll={false} style={styles.center}>
        <Title center>Blocked accounts</Title>
        <Body center muted>
          Sign in to manage blocks. Demo mode has no real accounts to block.
        </Body>
      </Screen>
    );
  }
  if (state.kind === "loading")
    return <LoadingState label="Loading blocked accounts…" />;
  if (state.kind === "error")
    return <FailureState message={state.message} onRetry={() => void load()} />;

  return (
    <Screen>
      <Eyebrow>PRIVATE · BLOCKS</Eyebrow>
      <Title>People you have blocked</Title>
      <Body muted>
        Blocking is immediate and private. They are not told who blocked them.
        You will not see each other in discovery or session requests.
      </Body>
      {state.rows.length === 0 ? (
        <EmptyState
          title="No blocks yet"
          message="When you block someone from a profile, they appear here."
        />
      ) : (
        <View style={styles.list}>
          {state.rows.map((row) => (
            <Card key={row.blockedId}>
              <Text style={styles.name}>{row.displayName}</Text>
              <Body muted>
                Blocked{" "}
                {new Date(row.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Body>
              <Button
                variant="secondary"
                label={busyId === row.blockedId ? "…" : "Unblock"}
                disabled={busyId === row.blockedId}
                onPress={() => {
                  setBusyId(row.blockedId);
                  void blockService
                    .unblockUser(row.blockedId)
                    .then(() => load())
                    .catch(() => load())
                    .finally(() => setBusyId(null));
                }}
                accessibilityHint="Removes this block. They are not notified."
              />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: "center", gap: 18 },
  list: { gap: 14 },
  name: { color: colors.ink, fontWeight: "800", fontSize: 17, marginBottom: 6 },
});
