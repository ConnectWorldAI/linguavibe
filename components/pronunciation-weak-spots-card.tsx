/**
 * Pronunciation Weak Spots Card
 * 
 * Shows the user's top 2-3 pronunciation categories that need work,
 * with quick access to targeted drills.
 */
import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";

interface WeakSpot {
  category: string;
  label: string;
  icon: string;
  color: string;
  errorCount: number;
  trend: "improving" | "stable" | "declining";
}

export function PronunciationWeakSpotsCard() {
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeakSpots();
  }, []);

  const loadWeakSpots = async () => {
    try {
      const { getPronunciationStats, PRONUNCIATION_CATEGORIES } = await import(
        "@/lib/pronunciation-error-categorization"
      );
      const stats = await getPronunciationStats();
      
      if (stats.totalErrors === 0) {
        setWeakSpots([]);
        setLoading(false);
        return;
      }

      // Get top 3 categories by error count
      const sorted = Object.entries(stats.errorsByCategory)
        .filter(([_, count]) => count > 0)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

      const spots: WeakSpot[] = sorted.map(([catId, count]) => {
        const catInfo = PRONUNCIATION_CATEGORIES.find(c => c.id === catId);
        return {
          category: catId,
          label: catInfo?.label || catId,
          icon: catInfo?.icon || "alert-circle",
          color: catInfo?.color || Colors.error,
          errorCount: count,
          trend: stats.recentTrend,
        };
      });

      setWeakSpots(spots);
    } catch {
      setWeakSpots([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || weakSpots.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="mic-outline" size={18} color={Colors.error} />
          <Text style={styles.title}>Pronunciation Weak Spots</Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/pronunciation-drills" as any)}
          style={styles.drillButton}
        >
          <Text style={styles.drillButtonText}>Practice</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.spotsContainer}>
        {weakSpots.map((spot, idx) => (
          <View key={spot.category} style={styles.spotRow}>
            <View style={[styles.spotIcon, { backgroundColor: spot.color + "20" }]}>
              <Ionicons name={spot.icon as any} size={16} color={spot.color} />
            </View>
            <View style={styles.spotInfo}>
              <Text style={styles.spotLabel}>{spot.label}</Text>
              <Text style={styles.spotCount}>{spot.errorCount} error{spot.errorCount !== 1 ? "s" : ""} logged</Text>
            </View>
            <View style={styles.trendBadge}>
              {spot.trend === "improving" ? (
                <Ionicons name="trending-down" size={14} color={Colors.success} />
              ) : spot.trend === "declining" ? (
                <Ionicons name="trending-up" size={14} color={Colors.error} />
              ) : (
                <Ionicons name="remove" size={14} color={Colors.textSecondary} />
              )}
            </View>
            {idx === 0 && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>#1</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.ctaButton}
        onPress={() => router.push("/pronunciation-drills" as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="fitness" size={16} color="#fff" />
        <Text style={styles.ctaText}>Start Targeted Drill</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.timelineLink}
        onPress={() => router.push("/pronunciation-timeline" as any)}
        activeOpacity={0.7}
      >
        <Ionicons name="analytics" size={14} color={Colors.secondary} />
        <Text style={styles.timelineLinkText}>View Progress Timeline</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error + "30",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  drillButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  drillButtonText: {
    fontSize: 12,
    color: Colors.secondary,
    fontWeight: "600",
  },
  spotsContainer: {
    gap: 10,
  },
  spotRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  spotIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  spotInfo: {
    flex: 1,
  },
  spotLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  spotCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.border + "40",
    justifyContent: "center",
    alignItems: "center",
  },
  priorityBadge: {
    backgroundColor: Colors.error + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.error,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.error,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  timelineLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 6,
  },
  timelineLinkText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.secondary,
  },
});
