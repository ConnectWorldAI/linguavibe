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
  getSkillTree,
  analyzeGaps,
  getLearningPriorities,
  getDomainSummary,
  type SkillTree,
  type GapAnalysis,
  type LearningPriority,
  type SkillDomain,
  type SkillNode,
  type MasteryLevel,
} from "@/lib/knowledge-gap-map";

const DOMAIN_ICONS: Record<SkillDomain, string> = {
  grammar: "📐",
  vocabulary: "📚",
  pronunciation: "🗣️",
  comprehension: "👂",
  writing: "✍️",
  culture: "🌍",
};

const DOMAIN_LABELS: Record<SkillDomain, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  pronunciation: "Pronunciation",
  comprehension: "Comprehension",
  writing: "Writing",
  culture: "Culture",
};

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  unknown: "#9CA3AF",
  introduced: "#F59E0B",
  practicing: "#3B82F6",
  familiar: "#8B5CF6",
  mastered: "#22C55E",
};

export default function KnowledgeGapMapScreen() {
  const colors = useColors();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<SkillTree | null>(null);
  const [gaps, setGaps] = useState<GapAnalysis | null>(null);
  const [priorities, setPriorities] = useState<LearningPriority[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<SkillDomain | null>(null);
  const [domainSkills, setDomainSkills] = useState<SkillNode[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [t, g, p] = await Promise.all([
        getSkillTree(),
        analyzeGaps(),
        getLearningPriorities(5),
      ]);
      setTree(t);
      setGaps(g);
      setPriorities(p);
    } catch (e) {
      console.error("Failed to load knowledge gap map:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const selectDomain = useCallback(async (domain: SkillDomain) => {
    setSelectedDomain(domain);
    const summary = await getDomainSummary(domain);
    const t = await getSkillTree();
    setDomainSkills(t.domains[domain]);
  }, []);

  if (loading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Knowledge Map", headerShown: true }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Analyzing your skills...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ title: "Knowledge Map", headerShown: true }} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Overall Progress */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Overall Mastery</Text>
          <View style={styles.progressRow}>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[styles.progressFill, { width: `${tree?.overallMastery || 0}%`, backgroundColor: colors.primary }]}
              />
            </View>
            <Text style={[styles.progressText, { color: colors.foreground }]}>{tree?.overallMastery || 0}%</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: "#22C55E" }]}>{tree?.masteredSkills || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>Mastered</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: "#3B82F6" }]}>{tree?.inProgressSkills || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>In Progress</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: "#9CA3AF" }]}>{tree?.unknownSkills || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>To Learn</Text>
            </View>
          </View>
        </View>

        {/* Domain Grid */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Skill Domains</Text>
        <View style={styles.domainGrid}>
          {(Object.keys(DOMAIN_ICONS) as SkillDomain[]).map((domain) => {
            const skills = tree?.domains[domain] || [];
            const mastered = skills.filter(s => s.mastery === "mastered").length;
            const total = skills.length;
            const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
            const isSelected = selectedDomain === domain;
            
            return (
              <TouchableOpacity
                key={domain}
                style={[
                  styles.domainCard,
                  { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
                ]}
                onPress={() => selectDomain(domain)}
              >
                <Text style={styles.domainIcon}>{DOMAIN_ICONS[domain]}</Text>
                <Text style={[styles.domainName, { color: colors.foreground }]}>{DOMAIN_LABELS[domain]}</Text>
                <Text style={[styles.domainPct, { color: colors.primary }]}>{pct}%</Text>
                <Text style={[styles.domainCount, { color: colors.muted }]}>{mastered}/{total}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected Domain Skills */}
        {selectedDomain && domainSkills.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {DOMAIN_ICONS[selectedDomain]} {DOMAIN_LABELS[selectedDomain]} Skills
            </Text>
            {domainSkills.map((skill) => (
              <View key={skill.id} style={[styles.skillRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.masteryDot, { backgroundColor: MASTERY_COLORS[skill.mastery] }]} />
                <View style={styles.skillInfo}>
                  <Text style={[styles.skillName, { color: colors.foreground }]}>{skill.name}</Text>
                  <Text style={[styles.skillLevel, { color: colors.muted }]}>{skill.level} · {skill.mastery}</Text>
                </View>
                <Text style={[styles.skillScore, { color: colors.foreground }]}>{skill.masteryScore}%</Text>
              </View>
            ))}
          </View>
        )}

        {/* Learning Priorities */}
        {priorities.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>What to Learn Next</Text>
            {priorities.map((p, i) => (
              <View key={p.skillId} style={[styles.priorityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.priorityHeader}>
                  <View style={[styles.priorityBadge, { backgroundColor: p.priority >= 8 ? "#EF4444" : p.priority >= 6 ? "#F59E0B" : "#3B82F6" }]}>
                    <Text style={styles.priorityBadgeText}>P{i + 1}</Text>
                  </View>
                  <View style={styles.priorityInfo}>
                    <Text style={[styles.priorityName, { color: colors.foreground }]}>{p.skillName}</Text>
                    <Text style={[styles.priorityDomain, { color: colors.muted }]}>{DOMAIN_LABELS[p.domain]} · ~{p.estimatedMinutes} min</Text>
                  </View>
                </View>
                <Text style={[styles.priorityReason, { color: colors.muted }]}>{p.reason}</Text>
              </View>
            ))}
          </>
        )}

        {/* Gap Analysis */}
        {gaps && (
          <>
            {gaps.strengthAreas.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>💪 Your Strengths</Text>
                <View style={styles.tagRow}>
                  {gaps.strengthAreas.map(d => (
                    <View key={d} style={[styles.tag, { backgroundColor: "#22C55E20" }]}>
                      <Text style={[styles.tagText, { color: "#22C55E" }]}>{DOMAIN_ICONS[d]} {DOMAIN_LABELS[d]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {gaps.weakAreas.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>🎯 Focus Areas</Text>
                <View style={styles.tagRow}>
                  {gaps.weakAreas.map(d => (
                    <View key={d} style={[styles.tag, { backgroundColor: "#EF444420" }]}>
                      <Text style={[styles.tagText, { color: "#EF4444" }]}>{DOMAIN_ICONS[d]} {DOMAIN_LABELS[d]}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}

        {/* Mastery Legend */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Mastery Levels</Text>
          {(Object.entries(MASTERY_COLORS) as [MasteryLevel, string][]).map(([level, color]) => (
            <View key={level} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <Text style={[styles.legendText, { color: colors.foreground }]}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, fontSize: 14 },
  content: { padding: 16, paddingBottom: 40 },
  card: { borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBar: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 16, fontWeight: "700", width: 44, textAlign: "right" },
  statsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 16 },
  stat: { alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  domainGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  domainCard: { width: "47%", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1.5 },
  domainIcon: { fontSize: 28, marginBottom: 6 },
  domainName: { fontSize: 13, fontWeight: "600" },
  domainPct: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  domainCount: { fontSize: 11, marginTop: 2 },
  skillRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5 },
  masteryDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 14, fontWeight: "500" },
  skillLevel: { fontSize: 11, marginTop: 2 },
  skillScore: { fontSize: 14, fontWeight: "600" },
  priorityCard: { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  priorityHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  priorityBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", marginRight: 10 },
  priorityBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  priorityInfo: { flex: 1 },
  priorityName: { fontSize: 14, fontWeight: "600" },
  priorityDomain: { fontSize: 12, marginTop: 2 },
  priorityReason: { fontSize: 12, lineHeight: 18 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tagText: { fontSize: 12, fontWeight: "600" },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  legendText: { fontSize: 13 },
});
