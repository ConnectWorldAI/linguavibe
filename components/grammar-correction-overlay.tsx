/**
 * Grammar Correction Overlay Component
 * 
 * Displays inline grammar corrections in conversation messages.
 * When the AI detects grammar mistakes, corrections appear as highlighted
 * inline badges that can be tapped to expand with full explanations.
 * 
 * Usage:
 * <GrammarCorrectionOverlay corrections={parsedCorrections} />
 */
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { ParsedCorrection } from "@/lib/grammar-correction-parser";

// Enable LayoutAnimation on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  corrections: ParsedCorrection[];
  compact?: boolean; // Show compact inline badges vs full cards
}

export function GrammarCorrectionOverlay({ corrections, compact = true }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!corrections || corrections.length === 0) return null;

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.correctionHeader}>
          <Ionicons name="school-outline" size={12} color="#F59E0B" />
          <Text style={styles.correctionHeaderText}>
            {corrections.length} correction{corrections.length > 1 ? "s" : ""} detected
          </Text>
        </View>
        {corrections.map((correction, index) => (
          <View key={index}>
            <TouchableOpacity
              style={styles.compactBadge}
              onPress={() => toggleExpand(index)}
              activeOpacity={0.7}
            >
              <View style={styles.correctionInline}>
                {correction.original && (
                  <Text style={styles.originalText}>{correction.original}</Text>
                )}
                <Ionicons name="arrow-forward" size={10} color="#22C55E" />
                <Text style={styles.correctedText}>{correction.corrected}</Text>
              </View>
              <Ionicons
                name={expandedIndex === index ? "chevron-up" : "chevron-down"}
                size={12}
                color="#9BA1A6"
              />
            </TouchableOpacity>

            {expandedIndex === index && (
              <View style={styles.expandedCard}>
                <View style={styles.categoryRow}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{correction.grammarTopic}</Text>
                  </View>
                </View>
                <Text style={styles.explanationText}>
                  {correction.explanation.length > 200
                    ? correction.explanation.slice(0, 200) + "..."
                    : correction.explanation}
                </Text>
                <View style={styles.tipRow}>
                  <Ionicons name="bulb-outline" size={12} color="#F59E0B" />
                  <Text style={styles.tipText}>
                    Tap to dismiss. This correction is saved to your Grammar Notebook.
                  </Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  }

  // Full card mode (for detailed view)
  return (
    <View style={styles.fullContainer}>
      <View style={styles.fullHeader}>
        <Ionicons name="school" size={16} color="#F59E0B" />
        <Text style={styles.fullHeaderText}>Grammar Corrections</Text>
      </View>
      {corrections.map((correction, index) => (
        <View key={index} style={styles.fullCard}>
          <View style={styles.fullCorrectionRow}>
            <View style={styles.fullOriginal}>
              <Ionicons name="close-circle" size={14} color="#EF4444" />
              <Text style={styles.fullOriginalText}>{correction.original}</Text>
            </View>
            <View style={styles.fullCorrected}>
              <Ionicons name="checkmark-circle" size={14} color="#22C55E" />
              <Text style={styles.fullCorrectedText}>{correction.corrected}</Text>
            </View>
          </View>
          <View style={styles.fullCategoryRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{correction.grammarTopic}</Text>
            </View>
          </View>
          <Text style={styles.fullExplanation}>{correction.explanation}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact mode
  compactContainer: {
    marginTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(245, 158, 11, 0.3)",
    paddingTop: 6,
  },
  correctionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  correctionHeaderText: {
    fontSize: 10,
    color: "#F59E0B",
    fontWeight: "600",
  },
  compactBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 3,
    borderWidth: 0.5,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  correctionInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  originalText: {
    fontSize: 12,
    color: "#EF4444",
    textDecorationLine: "line-through",
    fontStyle: "italic",
  },
  correctedText: {
    fontSize: 12,
    color: "#22C55E",
    fontWeight: "600",
  },
  expandedCard: {
    backgroundColor: "rgba(30, 58, 95, 0.4)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "rgba(245, 158, 11, 0.15)",
  },
  categoryRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  categoryBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryText: {
    fontSize: 10,
    color: "#F59E0B",
    fontWeight: "600",
  },
  explanationText: {
    fontSize: 11,
    color: "#C9D1D9",
    lineHeight: 16,
    marginBottom: 6,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tipText: {
    fontSize: 9,
    color: "#8B949E",
    fontStyle: "italic",
  },

  // Full card mode
  fullContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(30, 58, 95, 0.3)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  fullHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  fullHeaderText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F59E0B",
  },
  fullCard: {
    backgroundColor: "rgba(13, 27, 42, 0.6)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "rgba(245, 158, 11, 0.15)",
  },
  fullCorrectionRow: {
    gap: 4,
    marginBottom: 6,
  },
  fullOriginal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fullOriginalText: {
    fontSize: 13,
    color: "#EF4444",
    textDecorationLine: "line-through",
  },
  fullCorrected: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fullCorrectedText: {
    fontSize: 13,
    color: "#22C55E",
    fontWeight: "600",
  },
  fullCategoryRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  fullExplanation: {
    fontSize: 11,
    color: "#C9D1D9",
    lineHeight: 16,
  },
});
