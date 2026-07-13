import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Body, Button, Eyebrow, Screen, Title } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { profileRepository } from "../../services/profileRepository";
import { authFormStyles } from "../auth/sign-in";
import { useThemedStyles } from "../../hooks/useThemedStyles";
export default function EditProfileScreen() {
  const styles = useThemedStyles(authFormStyles);
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [bio, setBio] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    if (!user) return;
    profileRepository
      .getOwnProfile(user.id)
      .then((profile) => {
        setName(profile.displayName);
        setPronouns(profile.pronouns ?? "");
        setBio(profile.bio ?? "");
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setBusy(false));
  }, [user?.id]);
  const save = async () => {
    if (!user) return;
    setBusy(true);
    setMessage("");
    try {
      const current = await profileRepository.getOwnProfile(user.id);
      await profileRepository.updateGeneralProfile(user.id, {
        ...current,
        displayName: name,
        pronouns: pronouns || null,
        bio: bio || null,
      });
      setMessage("Profile saved.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Profile could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  if (!user)
    return (
      <Screen>
        <Eyebrow>YOUR GENERAL PROFILE</Eyebrow>
        <Title>Demo mode has no account to edit.</Title>
        <Body muted>
          Sign in with a real account to edit a general profile. Nothing here is
          saved in demo mode.
        </Body>
        <Button label="Back" onPress={() => router.back()} />
      </Screen>
    );
  return (
    <Screen>
      <Eyebrow>YOUR GENERAL PROFILE</Eyebrow>
      <Title>Edit what others may know.</Title>
      <Body muted>
        Private nervous-system notes and consent boundaries are stored
        separately and never appear here.
      </Body>
      <View style={styles.form}>
        <Text style={styles.label}>Display name</Text>
        <TextInput
          accessibilityLabel="Display name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <Text style={styles.label}>Pronouns · optional</Text>
        <TextInput
          accessibilityLabel="Pronouns"
          value={pronouns}
          onChangeText={setPronouns}
          style={styles.input}
        />
        <Text style={styles.label}>Short introduction · optional</Text>
        <TextInput
          accessibilityLabel="Short introduction"
          multiline
          maxLength={280}
          value={bio}
          onChangeText={setBio}
          style={styles.input}
        />
        {message ? (
          <Text
            accessibilityRole="alert"
            style={message === "Profile saved." ? styles.label : styles.error}
          >
            {message}
          </Text>
        ) : null}
        <Button
          label={busy ? "Saving…" : "Save profile"}
          disabled={busy || !name.trim()}
          onPress={() => void save()}
        />
      </View>
    </Screen>
  );
}
