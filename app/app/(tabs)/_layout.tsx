import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts } from "../../theme";

function SettingsButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      hitSlop={10}
      onPress={() => router.push("/settings")}
      style={styles.headerButton}
    >
      <Ionicons name="settings-outline" size={20} color={colors.muted} />
    </Pressable>
  );
}
function ProfileButton() {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Your profile"
      hitSlop={10}
      onPress={() => router.push("/profile/edit")}
      style={styles.avatar}
    >
      <Text style={styles.avatarText}>L</Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerLeft: () => <SettingsButton />,
        headerRight: () => <ProfileButton />,
        headerTitle: "",
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.moss,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper },
      }}
    >
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "People",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
const styles = StyleSheet.create({
  headerButton: { paddingHorizontal: 16 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.plumSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { color: colors.plum, fontFamily: fonts.wordmark, fontSize: 22 },
});
