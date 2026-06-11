import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

const { width } = Dimensions.get("window");

const DESTINATIONS = [
  {
    id: "dr",
    country: "Dominican Republic",
    flag: "🇩🇴",
    city: "Santo Domingo",
    language: "Spanish (Dominican)",
    difficulty: "Beginner",
    scenarios: 12,
    unlocked: true,
    progress: 45,
    image: "🏝️",
  },
  {
    id: "col",
    country: "Colombia",
    flag: "🇨🇴",
    city: "Medellín",
    language: "Spanish (Colombian)",
    difficulty: "Intermediate",
    scenarios: 15,
    unlocked: true,
    progress: 20,
    image: "🌄",
  },
  {
    id: "fr",
    country: "France",
    flag: "🇫🇷",
    city: "Paris",
    language: "French (Parisian)",
    difficulty: "Beginner",
    scenarios: 14,
    unlocked: true,
    progress: 0,
    image: "🗼",
  },
  {
    id: "jp",
    country: "Japan",
    flag: "🇯🇵",
    city: "Tokyo",
    language: "Japanese",
    difficulty: "Intermediate",
    scenarios: 16,
    unlocked: false,
    progress: 0,
    image: "⛩️",
  },
  {
    id: "ng",
    country: "Nigeria",
    flag: "🇳🇬",
    city: "Lagos",
    language: "Yoruba / Pidgin English",
    difficulty: "Beginner",
    scenarios: 10,
    unlocked: false,
    progress: 0,
    image: "🌍",
  },
  {
    id: "kr",
    country: "South Korea",
    flag: "🇰🇷",
    city: "Seoul",
    language: "Korean",
    difficulty: "Intermediate",
    scenarios: 14,
    unlocked: false,
    progress: 0,
    image: "🏯",
  },
];

const SCENARIOS_DR = [
  { id: "1", title: "Landing at the Airport", icon: "✈️", completed: true, xp: 50 },
  { id: "2", title: "Taxi to the Hotel", icon: "🚕", completed: true, xp: 40 },
  { id: "3", title: "Checking Into Your Hotel", icon: "🏨", completed: true, xp: 60 },
  { id: "4", title: "Ordering at a Colmado", icon: "🏪", completed: true, xp: 45 },
  { id: "5", title: "Asking for Directions", icon: "🗺️", completed: true, xp: 55 },
  { id: "6", title: "Ordering Mangú for Breakfast", icon: "🍳", completed: false, xp: 50, current: true },
  { id: "7", title: "Haggling at the Market", icon: "🛒", completed: false, xp: 70 },
  { id: "8", title: "Making Friends at the Beach", icon: "🏖️", completed: false, xp: 65 },
  { id: "9", title: "Dancing Bachata at a Club", icon: "💃", completed: false, xp: 80 },
  { id: "10", title: "Arguing with a Guagua Driver", icon: "🚌", completed: false, xp: 75 },
  { id: "11", title: "Visiting a Doctor", icon: "🏥", completed: false, xp: 60 },
  { id: "12", title: "Saying Goodbye at the Airport", icon: "👋", completed: false, xp: 50 },
];

export default function VacationModeScreen() {
  const [view, setView] = useState<"destinations" | "scenarios">("destinations");
  const [selectedDest, setSelectedDest] = useState(DESTINATIONS[0]);

  const handleSelectDestination = (dest: typeof DESTINATIONS[0]) => {
    if (dest.unlocked) {
      setSelectedDest(dest);
      setView("scenarios");
    }
  };

  const renderDestinations = () => (
    <>
      {/* Passport Header */}
      <View style={styles.passportHeader}>
        <Text style={styles.passportTitle}>Your Passport</Text>
        <View style={styles.stampsCount}>
          <Text style={styles.stampsEmoji}>🛂</Text>
          <Text style={styles.stampsText}>2 stamps</Text>
        </View>
      </View>

      {/* Destinations */}
      <Text style={styles.sectionTitle}>Choose Your Destination</Text>
      {DESTINATIONS.map((dest) => (
        <TouchableOpacity
          key={dest.id}
          style={[styles.destCard, !dest.unlocked && styles.destCardLocked]}
          onPress={() => handleSelectDestination(dest)}
          activeOpacity={dest.unlocked ? 0.7 : 1}
        >
          <Text style={styles.destImage}>{dest.image}</Text>
          <View style={styles.destInfo}>
            <View style={styles.destNameRow}>
              <Text style={styles.destFlag}>{dest.flag}</Text>
              <Text style={styles.destCountry}>{dest.country}</Text>
            </View>
            <Text style={styles.destCity}>{dest.city} • {dest.language}</Text>
            <Text style={styles.destScenarios}>
              {dest.scenarios} scenarios • {dest.difficulty}
            </Text>
            {dest.progress > 0 && (
              <View style={styles.destProgressBar}>
                <View style={[styles.destProgressFill, { width: `${dest.progress}%` }]} />
              </View>
            )}
          </View>
          {!dest.unlocked && (
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={16} color={Colors.textSecondary} />
            </View>
          )}
          {dest.unlocked && dest.progress > 0 && (
            <Text style={styles.destProgressText}>{dest.progress}%</Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Unlock More */}
      <View style={styles.unlockInfo}>
        <Ionicons name="information-circle" size={18} color={Colors.textSecondary} />
        <Text style={styles.unlockInfoText}>
          Complete lessons to unlock new destinations and earn passport stamps!
        </Text>
      </View>
    </>
  );

  const renderScenarios = () => (
    <>
      {/* Destination Header */}
      <View style={styles.scenarioHeader}>
        <Text style={styles.scenarioDestEmoji}>{selectedDest.image}</Text>
        <View>
          <Text style={styles.scenarioDestName}>
            {selectedDest.flag} {selectedDest.country}
          </Text>
          <Text style={styles.scenarioDestCity}>
            {selectedDest.city} • {selectedDest.language}
          </Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.tripProgress}>
        <Text style={styles.tripProgressLabel}>Trip Progress</Text>
        <View style={styles.tripProgressBar}>
          <View style={[styles.tripProgressFill, { width: `${selectedDest.progress}%` }]} />
        </View>
        <Text style={styles.tripProgressText}>
          {SCENARIOS_DR.filter(s => s.completed).length}/{SCENARIOS_DR.length} scenarios completed
        </Text>
      </View>

      {/* Scenario List */}
      <Text style={styles.sectionTitle}>Your Journey</Text>
      {SCENARIOS_DR.map((scenario, index) => (
        <TouchableOpacity
          key={scenario.id}
          style={[
            styles.scenarioCard,
            scenario.current && styles.scenarioCardCurrent,
            scenario.completed && styles.scenarioCardCompleted,
          ]}
          onPress={() => {
            if (scenario.current || scenario.completed) {
              router.push({ pathname: "/hume-call", params: { mode: "cloudwave", persona: "cloudwave" } } as any);
            }
          }}
        >
          <View style={styles.scenarioLeft}>
            <View style={[
              styles.scenarioNumber,
              scenario.completed && styles.scenarioNumberDone,
              scenario.current && styles.scenarioNumberCurrent,
            ]}>
              {scenario.completed ? (
                <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />
              ) : (
                <Text style={styles.scenarioNumberText}>{index + 1}</Text>
              )}
            </View>
            {index < SCENARIOS_DR.length - 1 && (
              <View style={[
                styles.scenarioLine,
                scenario.completed && styles.scenarioLineDone,
              ]} />
            )}
          </View>
          <View style={styles.scenarioContent}>
            <Text style={styles.scenarioIcon}>{scenario.icon}</Text>
            <View style={styles.scenarioInfo}>
              <Text style={[
                styles.scenarioTitle,
                !scenario.completed && !scenario.current && styles.scenarioTitleLocked,
              ]}>
                {scenario.title}
              </Text>
              <Text style={styles.scenarioXp}>+{scenario.xp} XP</Text>
            </View>
            {scenario.current && (
              <View style={styles.playButton}>
                <Ionicons name="play" size={16} color={Colors.textPrimary} />
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (view === "scenarios") setView("destinations");
          else router.back();
        }}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {view === "destinations" ? "Dream Vacation" : selectedDest.country}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {view === "destinations" && renderDestinations()}
        {view === "scenarios" && renderScenarios()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  passportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  passportTitle: {
    fontSize: FontSize.xxl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  stampsCount: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  stampsEmoji: {
    fontSize: 16,
  },
  stampsText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  destCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: 12,
  },
  destCardLocked: {
    opacity: 0.5,
  },
  destImage: {
    fontSize: 36,
  },
  destInfo: {
    flex: 1,
  },
  destNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  destFlag: {
    fontSize: 18,
  },
  destCountry: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  destCity: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  destScenarios: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 4,
    fontWeight: "500",
  },
  destProgressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  destProgressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  destProgressText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.success,
  },
  lockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  unlockInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
  },
  unlockInfoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  scenarioHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.lg,
  },
  scenarioDestEmoji: {
    fontSize: 48,
  },
  scenarioDestName: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  scenarioDestCity: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  tripProgress: {
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  tripProgressLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  tripProgressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  tripProgressFill: {
    height: "100%",
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  tripProgressText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  scenarioCard: {
    flexDirection: "row",
    marginBottom: 0,
  },
  scenarioCardCurrent: {},
  scenarioCardCompleted: {},
  scenarioLeft: {
    alignItems: "center",
    width: 32,
    marginRight: 12,
  },
  scenarioNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioNumberDone: {
    backgroundColor: Colors.success,
  },
  scenarioNumberCurrent: {
    backgroundColor: Colors.secondary,
  },
  scenarioNumberText: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  scenarioLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  scenarioLineDone: {
    backgroundColor: Colors.success,
  },
  scenarioContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceCard,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  scenarioIcon: {
    fontSize: 24,
  },
  scenarioInfo: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  scenarioTitleLocked: {
    color: Colors.textSecondary,
  },
  scenarioXp: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 2,
    fontWeight: "500",
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
});
