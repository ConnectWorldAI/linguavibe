import { Tabs } from "expo-router";
import { Platform, View, Text, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { HapticTab } from "@/components/haptic-tab";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/lib/i18n";
import { useNotificationBadges } from "@/lib/notification-badges";
import { useTabOrder } from "@/lib/tab-order-context";
import { ScreenErrorBoundary } from "@/components/error-boundary";

// Glowing active indicator dot
function ActiveDot({ focused, color }: { focused: boolean; color: string }) {
  if (!focused) return null;
  return (
    <View
      style={{
        position: "absolute",
        bottom: -8,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: color,
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 4,
      }}
    />
  );
}

// Notification badge dot (red circle with count)
function BadgeDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View
      style={{
        position: "absolute",
        top: -4,
        right: -8,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: "#EF4444",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 3,
        borderWidth: 1.5,
        borderColor: "#040810",
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 4,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: "800",
          color: "#fff",
          textAlign: "center",
        }}
      >
        {count > 99 ? "99+" : count}
      </Text>
    </View>
  );
}

// Tab icon renderer for each tab by name
function TabIcon({
  name,
  color,
  focused,
  neonBlue,
  badges,
  t,
}: {
  name: string;
  color: string;
  focused: boolean;
  neonBlue: string;
  badges: any;
  t: any;
}) {
  switch (name) {
    case "index":
      return (
        <View style={{ alignItems: "center" }}>
          <View style={{ position: "relative" }}>
            <Ionicons name={focused ? "globe" : "globe-outline"} size={24} color={color} />
            <BadgeDot count={badges.notifications} />
          </View>
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
    case "explore":
      return (
        <View style={{ alignItems: "center" }}>
          <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} />
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
    case "tv":
      return (
        <View style={{ alignItems: "center" }}>
          <Ionicons name={focused ? "tv" : "tv-outline"} size={24} color={color} />
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
    case "calendar":
      return (
        <View style={{ alignItems: "center" }}>
          <View style={{ position: "relative" }}>
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
            <BadgeDot count={badges.assignments} />
          </View>
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
    case "translate":
      return (
        <View style={{ alignItems: "center" }}>
          <IconSymbol size={24} name="translate" color={color} />
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
    case "teacher":
      return (
        <View style={{ alignItems: "center" }}>
          <View style={{ position: "relative" }}>
            <IconSymbol size={24} name="book.fill" color={color} />
            <BadgeDot count={badges.connections} />
          </View>
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
    case "profile":
      return (
        <View style={{ alignItems: "center" }}>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              borderWidth: focused ? 2 : 1.5,
              borderColor: focused ? neonBlue : color,
              backgroundColor: "#0A1628",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              shadowColor: focused ? neonBlue : "transparent",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: focused ? 0.8 : 0,
              shadowRadius: 6,
              elevation: focused ? 6 : 0,
            }}
          >
            <Ionicons name="person" size={14} color={color} />
          </View>
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
    default:
      return (
        <View style={{ alignItems: "center" }}>
          <Ionicons name="ellipsis-horizontal" size={24} color={color} />
          <ActiveDot focused={focused} color={neonBlue} />
        </View>
      );
  }
}

// Tab title for each tab by name
function getTabTitle(name: string, t: any): string {
  switch (name) {
    case "index": return t.home;
    case "explore": return t.explore;
    case "tv": return "TV";
    case "calendar": return "Schedule";
    case "translate": return t.translate;
    case "teacher": return t.learn;
    case "profile": return t.profile;
    default: return name;
  }
}

export default function TabLayout() {
  const colors = useColors();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 62 + bottomPadding;
  const { badges } = useNotificationBadges();
  const { tabOrder } = useTabOrder();

  // Logo-derived colors
  const neonBlue = "#00AAFF";
  const deepNavy = "#040810";
  const navyBorder = "rgba(0, 170, 255, 0.20)";

  // All tab names that exist as files (visible + hidden)
  const ALL_TAB_NAMES = ["index", "explore", "tv", "calendar", "translate", "teacher", "profile", "messages", "calls", "songs"];
  // Hidden tabs (not in the reorderable set)
  const HIDDEN_TABS = ["messages", "calls", "songs"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: neonBlue,
        tabBarInactiveTintColor: "#3D5A7A",
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: deepNavy,
          borderTopWidth: 1,
          borderTopColor: navyBorder,
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          // Subtle top glow
          shadowColor: neonBlue,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
          elevation: 12,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
      }}
    >
      {/* Render visible tabs in user-defined order */}
      {tabOrder.map((tabName) => (
        <Tabs.Screen
          key={tabName}
          name={tabName}
          options={{
            title: getTabTitle(tabName, t),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name={tabName}
                color={color}
                focused={focused}
                neonBlue={neonBlue}
                badges={badges}
                t={t}
              />
            ),
          }}
        />
      ))}

      {/* Hidden tabs (still routable, not shown in tab bar) */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <View style={{ position: "relative" }}>
                <Ionicons
                  name={focused ? "chatbubbles" : "chatbubbles-outline"}
                  size={24}
                  color={color}
                />
                <BadgeDot count={badges.messages} />
              </View>
              <ActiveDot focused={focused} color={neonBlue} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calls"
        options={{
          href: null, // Hide from tab bar - accessible via floating button
        }}
      />
      <Tabs.Screen
        name="songs"
        options={{
          href: null, // Hide from tab bar - accessible via floating button
        }}
      />
    </Tabs>
  );
}
