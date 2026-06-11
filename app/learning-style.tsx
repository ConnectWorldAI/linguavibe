import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  getLearningStyleProfile,
  getRecommendedContentMix,
  getStyleDescription,
  getSuggestedActivities,
  hasEnoughData,
  type LearningStyleProfile,
  type ContentMix,
} from "@/lib/learning-style-detection";

const MODALITY_ICONS: Record<string, string> = {
  visual: "👁️",
  auditory: "👂",
  reading: "📖",
  kinesthetic: "✋",
};

const MODALITY_COLORS: Record<string, string> = {
  visual: "#8B5CF6",
  auditory: "#3B82F6",
  reading: "#22C55E",
  kinesthetic: "#F59E0B",
};

export default function LearningStyleScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<LearningStyleProfile | null>(null);
  const [contentMix, setContentMix] = useState<ContentMix | null>(null);
  const [description, setDescription] = useState<any>(null);
  const [activities, setActivities] = useState<string[]>([]);
  const [enoughData, setEnoughData] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [p, mix, desc, acts, enough] = await Promise.all([
        getLearningStyleProfile(),
        getRecommendedContentMix(),
        getStyleDescription(),
        getSuggestedActivities(6),
        hasEnoughData(),
      ]);
      setProfile(p);
      setContentMix(mix);
      setDescription(desc);
      setActivities(acts);
      setEnoughData(enough);
    } catch (e) {
      console.error("Failed to load learning style:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Learning Style", headerShown: true }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Learning Style", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Style Detection Status */}
        {!enoughData && (
          <View style={[styles.infoCard, { backgroundColor: "#3B82F620", borderColor: "#3B82F640" }]}>
            <Text style={[styles.infoText, { color: colors.foreground }]}>
              🔬 Still detecting your learning style. Complete more activities for a more accurate profile.
              ({profile?.styleConfidence || 0}% confidence)
            </Text>
          </View>
        )}

        {/* Primary Style Card */}
        {profile && description && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.styleHeader}>
              <Text style={{ fontSize: 40 }}>{MODALITY_ICONS[profile.primaryStyle]}</Text>
              <View style={styles.styleInfo}>
                <Text style={[styles.styleTitle, { color: colors.foreground }]}>
                  {description.primary} Learner
                </Text>
                <Text style={[styles.styleConfidence, { color: colors.muted }]}>
                  {profile.styleConfidence}% confidence
                </Text>
              </View>
            </View>
            <Text style={[styles.styleDescription, { color: colors.foreground }]}>
              {description.description}
            </Text>
            <Text style={[styles.secondaryLabel, { color: colors.muted }]}>
              Secondary: {description.secondary} {MODALITY_ICONS[profile.secondaryStyle]}
            </Text>
          </View>
        )}

        {/* Modality Scores */}
        {profile && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Modality Effectiveness</Text>
            {(Object.entries(profile.modalityScores) as [string, number][]).sort((a, b) => b[1] - a[1]).map(([modality, score]) => (
              <View key={modality} style={styles.barRow}>
                <Text style={styles.barIcon}>{MODALITY_ICONS[modality]}</Text>
                <Text style={[styles.barLabel, { color: colors.foreground }]}>
                  {modality.charAt(0).toUpperCase() + modality.slice(1)}
                </Text>
                <View style={[styles.barTrack, { backgroundColor: colors.border }]}>
                  <View style={[styles.barFill, { width: `${score}%`, backgroundColor: MODALITY_COLORS[modality] }]} />
                </View>
                <Text style={[styles.barValue, { color: colors.foreground }]}>{score}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Content Mix Recommendation */}
        {contentMix && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Recommended Lesson Mix</Text>
            <Text style={[styles.mixDescription, { color: colors.muted }]}>
              Based on your learning style, here's the ideal content balance:
            </Text>
            <View style={styles.mixBar}>
              <View style={[styles.mixSegment, { flex: contentMix.visual, backgroundColor: MODALITY_COLORS.visual }]} />
              <View style={[styles.mixSegment, { flex: contentMix.auditory, backgroundColor: MODALITY_COLORS.auditory }]} />
              <View style={[styles.mixSegment, { flex: contentMix.reading, backgroundColor: MODALITY_COLORS.reading }]} />
              <View style={[styles.mixSegment, { flex: contentMix.kinesthetic, backgroundColor: MODALITY_COLORS.kinesthetic }]} />
            </View>
            <View style={styles.mixLegend}>
              {Object.entries(contentMix).map(([mod, pct]) => (
                <View key={mod} style={styles.mixLegendItem}>
                  <View style={[styles.mixDot, { backgroundColor: MODALITY_COLORS[mod] }]} />
                  <Text style={[styles.mixLegendText, { color: colors.muted }]}>
                    {mod.charAt(0).toUpperCase() + mod.slice(1)} {Math.round((pct as number) * 100)}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tips */}
        {description && description.tips.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>💡 Tips for {description.primary} Learners</Text>
            {description.tips.map((tip: string, i: number) => (
              <View key={i} style={styles.tipRow}>
                <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
                <Text style={[styles.tipText, { color: colors.foreground }]}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Suggested Activities */}
        {activities.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>🎯 Suggested Activities</Text>
            <View style={styles.activityGrid}>
              {activities.map((act, i) => (
                <View key={i} style={[styles.activityChip, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.activityText, { color: colors.primary }]}>
                    {act.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Performance History */}
        {profile && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>📊 Performance by Modality</Text>
            {(Object.values(profile.performances)).filter(p => p.totalAttempts > 0).map((perf) => (
              <View key={perf.modality} style={[styles.perfRow, { borderBottomColor: colors.border }]}>
                <Text style={styles.perfIcon}>{MODALITY_ICONS[perf.modality]}</Text>
                <View style={styles.perfInfo}>
                  <Text style={[styles.perfName, { color: colors.foreground }]}>
                    {perf.modality.charAt(0).toUpperCase() + perf.modality.slice(1)}
                  </Text>
                  <Text style={[styles.perfStats, { color: colors.muted }]}>
                    {perf.totalAttempts} attempts · {perf.averageScore}% avg · {perf.engagementMinutes} min total
                  </Text>
                </View>
              </View>
            ))}
            {Object.values(profile.performances).every(p => p.totalAttempts === 0) && (
              <Text style={[styles.emptyPerf, { color: colors.muted }]}>
                Complete some activities to see your performance breakdown here.
              </Text>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 16, paddingBottom: 40 },
  infoCard: { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  infoText: { fontSize: 13, lineHeight: 20 },
  card: { borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 10 },
  styleHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  styleInfo: { flex: 1 },
  styleTitle: { fontSize: 20, fontWeight: "700" },
  styleConfidence: { fontSize: 12, marginTop: 4 },
  styleDescription: { fontSize: 14, lineHeight: 22, marginBottom: 10 },
  secondaryLabel: { fontSize: 12 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
  barIcon: { fontSize: 18, width: 24 },
  barLabel: { width: 80, fontSize: 12 },
  barTrack: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barValue: { width: 36, textAlign: "right", fontSize: 12, fontWeight: "600" },
  mixDescription: { fontSize: 12, marginBottom: 12, lineHeight: 18 },
  mixBar: { flexDirection: "row", height: 16, borderRadius: 8, overflow: "hidden", marginBottom: 12 },
  mixSegment: { height: "100%" },
  mixLegend: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  mixLegendItem: { flexDirection: "row", alignItems: "center" },
  mixDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  mixLegendText: { fontSize: 11 },
  tipRow: { flexDirection: "row", marginBottom: 8 },
  tipBullet: { fontSize: 16, marginRight: 8 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
  activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  activityChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  activityText: { fontSize: 12, fontWeight: "500" },
  perfRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5 },
  perfIcon: { fontSize: 20, marginRight: 12 },
  perfInfo: { flex: 1 },
  perfName: { fontSize: 14, fontWeight: "500" },
  perfStats: { fontSize: 11, marginTop: 2 },
  emptyPerf: { fontSize: 13, textAlign: "center", paddingVertical: 12 },
});
