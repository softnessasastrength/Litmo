import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, Text, TextInput, View } from "react-native";
import {
  Body,
  Button,
  Card,
  Eyebrow,
  Screen,
  Title,
} from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { encryptedCloudBackupService } from "../../services/encryptedCloudBackupService";
import { privateHistoryStore } from "../../services/privateHistoryStore";
import type { PrivateHistoryEntry } from "../../lib/localFirstCore";
import { fonts, radius, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";

type Status = Awaited<ReturnType<typeof encryptedCloudBackupService.status>>;

export default function LocalFirstScreen() {
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const { status: authStatus } = useAuth();
  const [status, setStatus] = useState<Status | null>(null);
  const [history, setHistory] = useState<PrivateHistoryEntry[]>([]);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [installDraft, setInstallDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void encryptedCloudBackupService.status().then(setStatus);
    void privateHistoryStore.load().then((doc) => setHistory(doc.entries));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const enableBackup = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const { recoveryCode: code } = await encryptedCloudBackupService.enable();
      setRecoveryCode(code);
      setMessage(
        "Encrypted backup enabled. Save your recovery code offline — Litmo cannot recover it.",
      );
      refresh();
    } catch {
      setMessage("Could not enable backup. Your local data is still safe.");
    } finally {
      setBusy(false);
    }
  };

  const disableBackup = async () => {
    setBusy(true);
    try {
      await encryptedCloudBackupService.disable({ wipeCloud: true });
      setRecoveryCode(null);
      setMessage("Cloud backup off. Local vault unchanged.");
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const runBackup = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const results = await encryptedCloudBackupService.backupAll();
      const ok = results.filter((r) => r.ok).length;
      setMessage(
        `Backup finished: ${ok}/${results.length} domains ok. Offline local vault remains authoritative.`,
      );
      refresh();
    } catch {
      setMessage("Backup failed. Local data is still on this device.");
    } finally {
      setBusy(false);
    }
  };

  const runRestore = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const results = await encryptedCloudBackupService.restoreAll();
      const restored = results.filter((r) => r.restored).length;
      setMessage(
        restored > 0
          ? `Restored ${restored} domain(s) into the local vault.`
          : "No cloud domains restored (empty or wrong recovery key).",
      );
      refresh();
    } catch {
      setMessage("Restore failed. Local data left as-is.");
    } finally {
      setBusy(false);
    }
  };

  const showRecovery = async () => {
    const code = await encryptedCloudBackupService.exportRecoveryCodeNow();
    if (!code) {
      setMessage(
        "No recovery code on this device. Enable backup first, or install a code from another device.",
      );
      return;
    }
    setRecoveryCode(code);
    await encryptedCloudBackupService.acknowledgeRecoveryCode();
    refresh();
  };

  const installCode = async () => {
    const value = installDraft.trim();
    if (!value) {
      setMessage("Paste a recovery code first.");
      return;
    }
    const ok = await encryptedCloudBackupService.installRecoveryCode(value);
    setMessage(
      ok
        ? "Recovery code installed. Run Restore when online and signed in."
        : "Invalid recovery code.",
    );
    if (ok) setInstallDraft("");
    refresh();
  };

  return (
    <Screen>
      <Eyebrow>LOCAL-FIRST</Eyebrow>
      <Title>Your data lives here first.</Title>
      <Body muted>
        Litmo works fully offline for personal data: Touch Language, Consent
        Snapshots, Soft Signal history, learning progress, and private history.
        Optional encrypted cloud backup is off by default. Completing backup
        never proves safety or replaces real consent.
      </Body>

      <Card>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Offline vault
        </Text>
        <Body muted>
          Status: always offline-ready. Domains on this device:{" "}
          {status?.domainsPresent.join(", ") || "none yet"}.
        </Body>
        <Body muted>
          {authStatus === "demo"
            ? "Demo mode: local vault only (no cloud)."
            : status?.authenticated
              ? "Signed in: optional backup available when you enable it."
              : "Not signed in: full offline personal vault."}
        </Body>
      </Card>

      <Card>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Encrypted cloud backup
        </Text>
        <Body muted>
          {status?.enabled
            ? `On · last backup ${status.lastBackupAt ?? "not yet"}`
            : "Off (default). Server would only receive opaque ciphertext."}
        </Body>
        {status?.lastErrorCode ? (
          <Body muted>Last issue: {status.lastErrorCode} (local data OK).</Body>
        ) : null}
        {!status?.enabled ? (
          <Button
            label={busy ? "Working…" : "Enable encrypted backup"}
            onPress={() => void enableBackup()}
            disabled={busy}
            accessibilityHint="Creates a local master key and turns on optional cloud ciphertext backup"
          />
        ) : (
          <>
            <Button
              label={busy ? "Working…" : "Back up now"}
              onPress={() => void runBackup()}
              disabled={busy}
            />
            <Button
              variant="secondary"
              label={busy ? "Working…" : "Restore from cloud"}
              onPress={() => void runRestore()}
              disabled={busy}
            />
            <Button
              variant="secondary"
              label="Show recovery code"
              onPress={() => void showRecovery()}
            />
            <Button
              variant="secondary"
              label="Turn backup off"
              onPress={() => void disableBackup()}
              disabled={busy}
            />
          </>
        )}
        <Body muted>
          New device? Paste recovery code, then Restore (requires sign-in).
        </Body>
        <TextInput
          value={installDraft}
          onChangeText={setInstallDraft}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Paste recovery code"
          placeholderTextColor={styles.placeholder.color}
          style={styles.input}
          accessibilityLabel="Recovery code to install"
        />
        <Button
          variant="secondary"
          label="Install recovery code"
          onPress={() => void installCode()}
        />
        {recoveryCode ? (
          <View style={styles.codeBox} accessible>
            <Text style={styles.codeLabel}>RECOVERY CODE — SAVE OFFLINE</Text>
            <Text selectable style={styles.code}>
              {recoveryCode}
            </Text>
            <Body muted>
              Anyone with this code and your account can decrypt backups. Litmo
              staff cannot. This is not a password for sign-in.
            </Body>
          </View>
        ) : null}
      </Card>

      {message ? (
        <Card>
          <Body>{message}</Body>
        </Card>
      ) : null}

      <Card>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Private history (this device)
        </Text>
        <Body muted>
          Soft Signal, snapshots, and wrap notes you chose to keep. Not a score.
          Not shared.
        </Body>
        {history.length === 0 ? (
          <Body muted>No private history entries yet.</Body>
        ) : (
          history.slice(0, 12).map((entry) => (
            <Pressable
              key={entry.id}
              style={styles.historyRow}
              accessibilityRole="text"
              accessibilityLabel={`${entry.summary}. ${entry.occurredAt}`}
            >
              <Text style={styles.historySummary}>{entry.summary}</Text>
              <Text style={styles.historyMeta}>
                {entry.kind} · {entry.occurredAt.slice(0, 16).replace("T", " ")}
              </Text>
            </Pressable>
          ))
        )}
      </Card>

      <Button
        variant="secondary"
        label="Data protection & rights"
        onPress={() => router.push("/privacy/data-protection" as never)}
      />
      <Button variant="secondary" label="Back" onPress={() => router.back()} />
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    sectionTitle: {
      color: colors.ink,
      fontFamily: fonts.headline,
      fontSize: 22,
      marginBottom: 8,
    },
    codeBox: {
      marginTop: 12,
      padding: 14,
      borderRadius: radius.md,
      backgroundColor: colors.mossSoft,
      gap: 8,
    },
    codeLabel: {
      color: colors.moss,
      fontSize: 11,
      fontWeight: "800" as const,
      letterSpacing: 1,
    },
    code: {
      color: colors.ink,
      fontSize: 13,
      lineHeight: 18,
    },
    historyRow: {
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      gap: 4,
    },
    historySummary: {
      color: colors.ink,
      fontSize: 15,
      fontWeight: "600" as const,
    },
    historyMeta: {
      color: colors.muted,
      fontSize: 12,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      marginTop: 8,
      marginBottom: 8,
      color: colors.ink,
      backgroundColor: colors.paper,
      fontSize: 14,
    },
    placeholder: { color: colors.muted },
  };
}
