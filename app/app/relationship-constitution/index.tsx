/** Relationship Constitution living document + amendments. v0.2 */
import { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, Share, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Card, Eyebrow, Screen, Title } from "../../components/ui";
import {
  addArticle,
  amendArticle,
  exportConstitutionText,
  ratifyProposal,
  setPendingProposal,
  type ConstitutionDoc,
} from "../../lib/relationshipConstitutionCore";
import { relationshipConstitutionStore } from "../../services/relationshipConstitutionStore";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";
import type { AppColors } from "../../theme";
import { runtimeConfig } from "../../config/runtime";
import { FeatureUnavailable } from "../../components/FeatureUnavailable";

export default function RelationshipConstitutionScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const router = useRouter();
  const [doc, setDoc] = useState<ConstitutionDoc | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [proposal, setProposal] = useState("");

  const load = useCallback(async () => {
    setDoc(await relationshipConstitutionStore.load());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!doc) {
    return (
      <Screen>
        <Body muted>Loading constitution…</Body>
      </Screen>
    );
  }

  const save = async (next: ConstitutionDoc) => {
    await relationshipConstitutionStore.save(next);
    setDoc(next);
    setEditId(null);
  };

  const shareExport = async () => {
    try {
      await Share.share({ message: exportConstitutionText(doc) });
    } catch {
      Alert.alert("Export ready", "Copy failed or cancelled.");
    }
  };

  if (!runtimeConfig.features.pairedGrowthContent) {
    return (
      <FeatureUnavailable
        eyebrow="RELATIONSHIP TOOLS"
        title="This tool is not available in this build."
        body="This build focuses on your own self-understanding. Relationship-in-friction tools (bond map, conflict, attachment repair) remain in Maximum Mode builds (macOS / Linux / internal)."
      />
    );
  }
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Eyebrow>RELATIONSHIP CONSTITUTION v0.2</Eyebrow>
        <Title>{doc.title}</Title>
        <Body muted>
          Living document · v{doc.version} · Soft Signal free · not legal ·
          silence ≠ consent to amendments
        </Body>
        <Card>
          <Body muted>{doc.preamble}</Body>
        </Card>
        {doc.articles.map((a) => (
          <Card key={a.id}>
            <Text style={styles.h}>
              {a.id}: {a.title}
            </Text>
            <Body>{a.body}</Body>
            <Button
              variant="secondary"
              label="Amend"
              onPress={() => {
                setEditId(a.id);
                setEditBody(a.body);
                setEditSummary("");
              }}
            />
          </Card>
        ))}
        {editId ? (
          <Card>
            <Text style={styles.h}>Amendment (bumps version)</Text>
            <TextInput
              style={styles.input}
              value={editSummary}
              onChangeText={setEditSummary}
              placeholder="Summary of change"
              placeholderTextColor={colors.muted}
              accessibilityLabel="Amendment summary"
            />
            <TextInput
              style={[styles.input, { minHeight: 100 }]}
              value={editBody}
              onChangeText={setEditBody}
              multiline
              placeholderTextColor={colors.muted}
              accessibilityLabel="Amendment body"
            />
            <Button
              label="Commit amendment (+version)"
              onPress={() =>
                void save(
                  amendArticle(
                    doc,
                    editId,
                    editSummary || "amendment",
                    editBody,
                  ),
                )
              }
            />
            <Button
              variant="secondary"
              label="Cancel"
              onPress={() => setEditId(null)}
            />
          </Card>
        ) : null}
        <Card>
          <Text style={styles.h}>Add article</Text>
          <TextInput
            style={styles.input}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Title"
            placeholderTextColor={colors.muted}
          />
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={newBody}
            onChangeText={setNewBody}
            multiline
            placeholder="Body"
            placeholderTextColor={colors.muted}
          />
          <Button
            label="Add article (+version)"
            onPress={() => {
              if (newTitle.trim() && newBody.trim()) {
                void save(addArticle(doc, newTitle, newBody));
                setNewTitle("");
                setNewBody("");
              }
            }}
          />
        </Card>
        <Card>
          <Text style={styles.h}>Proposal → ratify</Text>
          <Body muted>
            Draft a shared agreement. Ratify logs it and bumps version. Soft
            Signal free to never send.
          </Body>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            value={proposal}
            onChangeText={setProposal}
            multiline
            placeholder="Pending proposal…"
            placeholderTextColor={colors.muted}
          />
          <Button
            variant="secondary"
            label="Save as pending proposal"
            onPress={() => {
              void save(setPendingProposal(doc, proposal));
            }}
          />
          {doc.pendingProposal ? (
            <>
              <Body muted>Pending: {doc.pendingProposal}</Body>
              <Button
                label="Ratify proposal (+version)"
                onPress={() => void save(ratifyProposal(doc))}
              />
            </>
          ) : null}
        </Card>
        <Card>
          <Text style={styles.h}>Amendment log</Text>
          {doc.amendments.length === 0 ? (
            <Body muted>No amendments yet.</Body>
          ) : (
            doc.amendments.slice(0, 16).map((m) => (
              <Body key={m.id} muted>
                v{m.versionAfter ?? "?"} · {m.kind ?? "amend"} · {m.summary} ·{" "}
                {m.at.slice(0, 10)}
              </Body>
            ))
          )}
        </Card>
        <Button label="Export / share text" onPress={() => void shareExport()} />
        <Button variant="secondary" label="Back" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function makeStyles(colors: AppColors) {
  return {
    scroll: { gap: 12, paddingBottom: 40 },
    h: {
      fontWeight: "800" as const,
      color: colors.ink,
      fontSize: 16,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.line,
      borderRadius: 16,
      padding: 14,
      color: colors.ink,
      backgroundColor: colors.cream,
      marginTop: 8,
    },
  };
}
