/**
 * CreatorSpotlightCard — weekly rotating creator highlight card for the home screen.
 * Shows the featured creator with their teaching style and sample exercises.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/use-colors";
import {
  getWeeklySpotlightCreator,
  isSpotlightDismissed,
  dismissSpotlight,
  SpotlightCreator,
  SampleExercise,
} from "@/lib/creator-spotlight";

export function CreatorSpotlightCard() {
  const colors = useColors();
  const router = useRouter();
  const [creator, setCreator] = useState<SpotlightCreator | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const isDismissed = await isSpotlightDismissed();
        if (!isDismissed) {
          setCreator(getWeeklySpotlightCreator());
          setDismissed(false);
        }
      })();
    }, [])
  );

  const handleDismiss = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await dismissSpotlight();
    setDismissed(true);
  };

  const handleOpenProfile = () => {
    if (creator?.profileUrl) {
      Linking.openURL(creator.profileUrl);
    }
  };

  const handleToggleExercise = (index: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedExercise(expandedExercise === index ? null : index);
  };

  if (dismissed || !creator) return null;

  const exerciseIcon = (type: SampleExercise["type"]) => {
    switch (type) {
      case "phrase": return "chatbubble-ellipses-outline";
      case "quiz": return "help-circle-outline";
      case "fill_blank": return "create-outline";
      case "listen": return "ear-outline";
      default: return "bulb-outline";
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.badge, { backgroundColor: colors.primary + "15" }]}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>Creator Spotlight</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push("/creator-directory")}
            style={({ pressed }) => [pressed && { opacity: 0.5 }]}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </Pressable>
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [styles.dismissBtn, pressed && { opacity: 0.5 }]}
          >
            <Ionicons name="close" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      {/* Creator Info */}
      <View style={styles.creatorRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Text style={styles.avatarEmoji}>{creator.avatarEmoji}</Text>
        </View>
        <View style={styles.creatorInfo}>
          <Text style={[styles.creatorName, { color: colors.foreground }]}>
            {creator.name}
          </Text>
          <Text style={[styles.creatorHandle, { color: colors.muted }]}>
            {creator.handle} • {creator.followers} followers
          </Text>
          <Text style={[styles.creatorTagline, { color: colors.muted }]}>
            {creator.tagline}
          </Text>
        </View>
      </View>

      {/* Teaching Style */}
      <View style={[styles.styleRow, { backgroundColor: colors.background }]}>
        <Ionicons name="school-outline" size={14} color={colors.primary} />
        <Text style={[styles.styleText, { color: colors.foreground }]}>
          {creator.teachingStyle}
        </Text>
      </View>

      {/* Sample Exercises */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        Try their style:
      </Text>
      {creator.sampleExercises.map((exercise, index) => (
        <Pressable
          key={index}
          onPress={() => handleToggleExercise(index)}
          style={({ pressed }) => [
            styles.exerciseRow,
            { borderColor: colors.border },
            pressed && { opacity: 0.8 },
            expandedExercise === index && { backgroundColor: colors.primary + "08" },
          ]}
        >
          <View style={styles.exerciseHeader}>
            <Ionicons
              name={exerciseIcon(exercise.type) as any}
              size={16}
              color={colors.primary}
            />
            <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>
              {exercise.title}
            </Text>
            <Ionicons
              name={expandedExercise === index ? "chevron-up" : "chevron-down"}
              size={14}
              color={colors.muted}
            />
          </View>
          <Text style={[styles.exercisePrompt, { color: colors.muted }]}>
            {exercise.prompt}
          </Text>
          {expandedExercise === index && (
            <View style={[styles.answerBox, { backgroundColor: colors.success + "15" }]}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <Text style={[styles.answerText, { color: colors.success }]}>
                {exercise.answer}
              </Text>
            </View>
          )}
        </Pressable>
      ))}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerBtns}>
          <Pressable
            onPress={() => router.push({ pathname: "/creator-exercise", params: { creatorId: creator.id } })}
            style={({ pressed }) => [
              styles.tryExerciseBtn,
              { backgroundColor: colors.success },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="flash" size={14} color="#fff" />
            <Text style={styles.profileBtnText}>Try Exercise</Text>
          </Pressable>
          <Pressable
            onPress={handleOpenProfile}
            style={({ pressed }) => [
              styles.profileBtn,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="open-outline" size={14} color="#fff" />
            <Text style={styles.profileBtnText}>Visit Profile</Text>
          </Pressable>
        </View>
        <Text style={[styles.rotationHint, { color: colors.muted }]}>
          New creator every week
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  dismissBtn: {
    padding: 4,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 24,
  },
  creatorInfo: {
    flex: 1,
  },
  creatorName: {
    fontSize: 16,
    fontWeight: "700",
  },
  creatorHandle: {
    fontSize: 12,
    marginTop: 2,
  },
  creatorTagline: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 2,
  },
  styleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  styleText: {
    fontSize: 13,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  exerciseRow: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exerciseTitle: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  exercisePrompt: {
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 24,
  },
  answerBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 24,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  answerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    gap: 8,
    marginTop: 4,
  },
  footerBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tryExerciseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  profileBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  rotationHint: {
    fontSize: 11,
    fontStyle: "italic",
  },
});
