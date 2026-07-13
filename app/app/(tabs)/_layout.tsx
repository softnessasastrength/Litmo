import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { Pressable, Text } from "react-native";
import { fonts, type AppColors } from "../../theme";
import { useThemedStyles } from "../../hooks/useThemedStyles";
import { useColors } from "../../context/ThemeContext";

function makeChromeStyles(colors: AppColors) {
  return {
    headerButton: { paddingHorizontal: 16 },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.plumSoft,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: 16,
    },
    avatarText: {
      color: colors.plum,
      fontFamily: fonts.wordmark,
      fontSize: 22,
    },
  };
}

function SettingsButton() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeChromeStyles);
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
  const styles = useThemedStyles(makeChromeStyles);
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
  const colors = useColors();
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
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.line,
        },
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
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quizzes"
        options={{
          title: "Quizzes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
