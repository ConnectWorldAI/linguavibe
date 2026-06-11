import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize } from "@/constants/Colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface DialectVariant {
  region: string;
  flag: string;
  term: string;
  usage: string;
}

export interface DialectComparisonData {
  word: string;
  variants: DialectVariant[];
}

interface DialectComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  comparison: DialectComparisonData | null;
  userDialect?: string;
}

export function DialectComparisonModal({
  visible,
  onClose,
  comparison,
  userDialect,
}: DialectComparisonModalProps) {
  if (!comparison) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="git-compare" size={20} color={Colors.secondary} />
              <Text style={styles.headerTitle}>Dialect Comparison</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Word being compared */}
          <View style={styles.wordSection}>
            <Text style={styles.wordLabel}>Comparing</Text>
            <Text style={styles.wordValue}>"{comparison.word}"</Text>
            <Text style={styles.wordSubtext}>
              How this word/phrase differs across Spanish-speaking regions
            </Text>
          </View>

          {/* Variants list */}
          <ScrollView
            style={styles.variantsList}
            showsVerticalScrollIndicator={false}
          >
            {comparison.variants.map((variant, index) => {
              const isUserDialect =
                userDialect &&
                variant.region.toLowerCase().includes(userDialect.toLowerCase());

              return (
                <View
                  key={index}
                  style={[
                    styles.variantCard,
                    isUserDialect && styles.variantCardHighlight,
                  ]}
                >
                  <View style={styles.variantHeader}>
                    <View style={styles.variantRegion}>
                      <Text style={styles.variantFlag}>{variant.flag}</Text>
                      <Text style={styles.variantRegionText}>
                        {variant.region}
                      </Text>
                    </View>
                    {isUserDialect && (
                      <View style={styles.yourDialectBadge}>
                        <Text style={styles.yourDialectText}>Your dialect</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.variantTerm}>{variant.term}</Text>
                  <Text style={styles.variantUsage}>{variant.usage}</Text>
                </View>
              );
            })}

            {/* Educational note */}
            <View style={styles.educationalNote}>
              <Ionicons name="bulb" size={16} color={Colors.gold} />
              <Text style={styles.educationalNoteText}>
                Understanding regional differences helps you communicate naturally
                with speakers from different countries. The same idea can be
                expressed very differently depending on the region!
              </Text>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── MOCK DATA FOR TESTING ───────────────────────────────────────────────────

export const MOCK_COMPARISONS: DialectComparisonData[] = [
  {
    word: "Despacito",
    variants: [
      {
        region: "Puerto Rico",
        flag: "🇵🇷",
        term: "Despacito",
        usage: "Very common diminutive, used affectionately. 'Hazlo despacito' = do it slowly/gently. The -ito adds warmth.",
      },
      {
        region: "Dominican Republic",
        flag: "🇩🇴",
        term: "Suavecito / Despacio",
        usage: "Dominicans more often say 'suavecito' for the same intimate feel, or just 'despacio' without the diminutive.",
      },
      {
        region: "Mexico",
        flag: "🇲🇽",
        term: "Despacio / Lentamente",
        usage: "Mexicans typically use 'despacio' or 'lentamente' in conversation. The -ito form exists but is less common in this context.",
      },
      {
        region: "Colombia",
        flag: "🇨🇴",
        term: "Despacito / Pasito",
        usage: "Colombians use 'despacito' similarly to Puerto Ricans. In salsa/cumbia contexts, 'pasito' (little step) is more common.",
      },
      {
        region: "Argentina",
        flag: "🇦🇷",
        term: "Despacio / Despacito",
        usage: "Argentines use both forms but with different intonation. The Rioplatense accent gives it a distinct sound.",
      },
    ],
  },
  {
    word: "Pegadito",
    variants: [
      {
        region: "Puerto Rico",
        flag: "🇵🇷",
        term: "Pegadito",
        usage: "Dancing very close together, body-to-body. Common in reggaetón culture.",
      },
      {
        region: "Dominican Republic",
        flag: "🇩🇴",
        term: "Pegao / Agarrao",
        usage: "Dominicans drop the 'd' sound: 'pegao' instead of 'pegado'. 'Agarrao' (grabbed/held close) is also used in bachata.",
      },
      {
        region: "Mexico",
        flag: "🇲🇽",
        term: "Pegadito / Juntitos",
        usage: "Mexicans understand 'pegadito' but might more naturally say 'juntitos' (close together) in romantic contexts.",
      },
      {
        region: "Colombia",
        flag: "🇨🇴",
        term: "Pegadito / Arrimadito",
        usage: "Both work in Colombia. 'Arrimadito' (snuggled up) is a costeño (coastal) variant for dancing close.",
      },
    ],
  },
];

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: Colors.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: FontSize.lg,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  wordSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  wordLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  wordValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.secondary,
    marginBottom: 6,
  },
  wordSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  variantsList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  variantCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  variantCardHighlight: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + "10",
  },
  variantHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  variantRegion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  variantFlag: {
    fontSize: 22,
  },
  variantRegionText: {
    fontSize: FontSize.md,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  yourDialectBadge: {
    backgroundColor: Colors.secondary + "20",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.secondary + "40",
  },
  yourDialectText: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.secondary,
  },
  variantTerm: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.gold,
    marginBottom: 4,
  },
  variantUsage: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  educationalNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    backgroundColor: Colors.goldGlow,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
  },
  educationalNoteText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
