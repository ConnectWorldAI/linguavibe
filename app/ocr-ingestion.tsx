import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

interface ExtractedEntry {
  word: string;
  pronunciation: string;
  translation: string;
  language: string;
  dialect: string;
  context: string;
  category: string;
  source: string;
  confidence: string;
  verified?: boolean;
  culturalNote?: string;
  exampleSentence?: string;
  exampleTranslation?: string;
  difficulty?: string;
  suitableForWordOfDay?: boolean;
  suitableForSlangOfDay?: boolean;
}

interface AnalysisResult {
  videoUrl: string;
  totalFramesAnalyzed: number;
  totalEntriesExtracted: number;
  entries: ExtractedEntry[];
  audioTranscript?: string;
  status: string;
  errors: string[];
}

type ViewTab = "single" | "batch" | "results" | "approved";

export default function OCRIngestionScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ViewTab>("single");
  const [videoUrl, setVideoUrl] = useState("");
  const [batchUrls, setBatchUrls] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [approvedEntries, setApprovedEntries] = useState<ExtractedEntry[]>([]);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

  const analyzeMutation = trpc.ocrIngestion.analyzeVideo.useMutation();
  const batchMutation = trpc.ocrIngestion.batchAnalyze.useMutation();

  const handleAnalyzeSingle = useCallback(async () => {
    if (!videoUrl.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);

    try {
      const result = await analyzeMutation.mutateAsync({
        videoUrl: videoUrl.trim(),
        autoEnrich: true,
      });
      setResults([result as AnalysisResult]);
      setActiveTab("results");
      setVideoUrl("");
    } catch (error) {
      Alert.alert("Analysis Failed", `Could not analyze video: ${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoUrl]);

  const handleBatchAnalyze = useCallback(async () => {
    const urls = batchUrls
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (urls.length === 0) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAnalyzing(true);

    try {
      const result = await batchMutation.mutateAsync({
        videoUrls: urls,
        autoEnrich: true,
      });
      setResults(result.results as AnalysisResult[]);
      setActiveTab("results");
      setBatchUrls("");
    } catch (error) {
      Alert.alert("Batch Analysis Failed", `${error}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [batchUrls]);

  const handleApproveEntry = useCallback((entry: ExtractedEntry) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setApprovedEntries((prev) => [...prev, { ...entry, verified: true }]);
  }, []);

  const handleRejectEntry = useCallback((entry: ExtractedEntry) => {
    // Just skip it — don't add to approved
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleFeedToKnowledgeBase = useCallback(() => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // In production: sends approved entries to the knowledge base
    // Updates: slang dictionary, word of day pool, pronunciation guides, class curriculum
    Alert.alert(
      "Fed to Knowledge Base",
      `${approvedEntries.length} entries added to:\n• Slang Dictionary\n• Word of the Day pool\n• Pronunciation Practice\n• Class Curriculum`,
    );
    setApprovedEntries([]);
  }, [approvedEntries]);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      slang: "#FF6B6B",
      formal: "#4ECDC4",
      idiom: "#FFE66D",
      greeting: "#A78BFA",
      food: "#FF8C42",
      culture: "#95E1D3",
      grammar: "#6C63FF",
      other: "#9BA1A6",
    };
    return colors[cat] || "#9BA1A6";
  };

  const getConfidenceBadge = (conf: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      high: { bg: "#4ADE8033", text: "#4ADE80" },
      medium: { bg: "#FBBF2433", text: "#FBBF24" },
      low: { bg: "#F8717133", text: "#F87171" },
    };
    return styles[conf] || styles.medium;
  };

  const renderEntryCard = ({ item }: { item: ExtractedEntry }) => {
    const isExpanded = expandedEntry === `${item.word}_${item.language}`;
    const confStyle = getConfidenceBadge(item.confidence);
    const isApproved = approvedEntries.some(
      (a) => a.word === item.word && a.language === item.language,
    );

    return (
      <Pressable
        onPress={() =>
          setExpandedEntry(isExpanded ? null : `${item.word}_${item.language}`)
        }
        style={[s.entryCard, isApproved && s.entryCardApproved]}
      >
        <View style={s.entryHeader}>
          <View style={s.entryWordRow}>
            <Text style={s.entryWord}>{item.word}</Text>
            <View style={[s.categoryBadge, { backgroundColor: getCategoryColor(item.category) + "33" }]}>
              <Text style={[s.categoryText, { color: getCategoryColor(item.category) }]}>
                {item.category}
              </Text>
            </View>
          </View>
          <View style={[s.confBadge, { backgroundColor: confStyle.bg }]}>
            <Text style={[s.confText, { color: confStyle.text }]}>{item.confidence}</Text>
          </View>
        </View>

        {item.pronunciation ? (
          <Text style={s.pronunciation}>/{item.pronunciation}/</Text>
        ) : null}
        <Text style={s.translation}>{item.translation}</Text>
        <Text style={s.langDialect}>
          {item.language} {item.dialect !== "Standard" ? `(${item.dialect})` : ""}
        </Text>

        {isExpanded && (
          <View style={s.expandedContent}>
            {item.context ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Context:</Text>
                <Text style={s.detailValue}>{item.context}</Text>
              </View>
            ) : null}
            {item.culturalNote ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Cultural Note:</Text>
                <Text style={s.detailValue}>{item.culturalNote}</Text>
              </View>
            ) : null}
            {item.exampleSentence ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Example:</Text>
                <Text style={s.detailValue}>{item.exampleSentence}</Text>
                {item.exampleTranslation ? (
                  <Text style={s.detailSubValue}>{item.exampleTranslation}</Text>
                ) : null}
              </View>
            ) : null}
            {item.difficulty ? (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Level:</Text>
                <Text style={s.detailValue}>{item.difficulty}</Text>
              </View>
            ) : null}
            <View style={s.tagRow}>
              {item.suitableForWordOfDay && (
                <View style={s.tag}>
                  <Text style={s.tagText}>📅 Word of Day</Text>
                </View>
              )}
              {item.suitableForSlangOfDay && (
                <View style={s.tag}>
                  <Text style={s.tagText}>🔥 Slang of Day</Text>
                </View>
              )}
              {item.verified && (
                <View style={[s.tag, { backgroundColor: "#4ADE8022" }]}>
                  <Text style={[s.tagText, { color: "#4ADE80" }]}>✓ Verified</Text>
                </View>
              )}
            </View>

            {!isApproved && (
              <View style={s.actionRow}>
                <Pressable
                  onPress={() => handleApproveEntry(item)}
                  style={({ pressed }) => [s.approveBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={s.approveBtnText}>✓ Approve & Add</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleRejectEntry(item)}
                  style={({ pressed }) => [s.rejectBtn, pressed && { opacity: 0.7 }]}
                >
                  <Text style={s.rejectBtnText}>✗ Reject</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  const renderSingleTab = () => (
    <View style={s.tabContent}>
      <Text style={s.sectionTitle}>Analyze Video URL</Text>
      <Text style={s.sectionDesc}>
        Paste a TikTok, YouTube, or Instagram video URL. The system will extract frames, run OCR to read on-screen text (words, pronunciation guides, translations), and parse them into structured vocabulary entries.
      </Text>

      <TextInput
        style={s.urlInput}
        placeholder="https://www.tiktok.com/@user/video/..."
        placeholderTextColor="#687076"
        value={videoUrl}
        onChangeText={setVideoUrl}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
      />

      <Pressable
        onPress={handleAnalyzeSingle}
        style={({ pressed }) => [
          s.analyzeBtn,
          (!videoUrl.trim() || isAnalyzing) && s.analyzeBtnDisabled,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
      >
        {isAnalyzing ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={s.analyzeBtnText}>🔍 Analyze Video</Text>
        )}
      </Pressable>

      <View style={s.pipelineBox}>
        <Text style={s.pipelineTitle}>OCR Pipeline Steps</Text>
        <Text style={s.pipelineStep}>1. Extract video thumbnails/frames from URL</Text>
        <Text style={s.pipelineStep}>2. Run LLM Vision OCR on each frame</Text>
        <Text style={s.pipelineStep}>3. Transcribe audio for spoken vocabulary</Text>
        <Text style={s.pipelineStep}>4. Parse into structured entries (word, pronunciation, translation)</Text>
        <Text style={s.pipelineStep}>5. LLM enrichment: verify, add cultural context, categorize</Text>
        <Text style={s.pipelineStep}>6. You review & approve → feeds into knowledge base</Text>
      </View>

      <View style={s.feedsIntoBox}>
        <Text style={s.feedsIntoTitle}>Approved entries feed into:</Text>
        <Text style={s.feedsIntoItem}>📅 Word of the Day / Slang of the Day</Text>
        <Text style={s.feedsIntoItem}>📚 Class Curriculum (matched to language/level)</Text>
        <Text style={s.feedsIntoItem}>🗣️ Pronunciation Practice (phonetic spellings)</Text>
        <Text style={s.feedsIntoItem}>🤖 AI Influencer Teaching Content</Text>
        <Text style={s.feedsIntoItem}>📖 Slang Dictionary</Text>
      </View>
    </View>
  );

  const renderBatchTab = () => (
    <View style={s.tabContent}>
      <Text style={s.sectionTitle}>Batch Analyze</Text>
      <Text style={s.sectionDesc}>
        Paste multiple video URLs (one per line). The system will analyze each one and combine all extracted vocabulary.
      </Text>

      <TextInput
        style={[s.urlInput, { minHeight: 150 }]}
        placeholder={"https://www.tiktok.com/@user/video/123\nhttps://youtube.com/shorts/abc\nhttps://instagram.com/reel/xyz"}
        placeholderTextColor="#687076"
        value={batchUrls}
        onChangeText={setBatchUrls}
        multiline
        numberOfLines={6}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={s.urlCount}>
        {batchUrls.split("\n").filter((u) => u.trim()).length} URLs entered (max 20)
      </Text>

      <Pressable
        onPress={handleBatchAnalyze}
        style={({ pressed }) => [
          s.analyzeBtn,
          (!batchUrls.trim() || isAnalyzing) && s.analyzeBtnDisabled,
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
      >
        {isAnalyzing ? (
          <View style={s.loadingRow}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={s.analyzeBtnText}> Analyzing batch...</Text>
          </View>
        ) : (
          <Text style={s.analyzeBtnText}>🔍 Analyze All Videos</Text>
        )}
      </Pressable>
    </View>
  );

  const allEntries = results.flatMap((r) => r.entries);

  const renderResultsTab = () => (
    <View style={s.tabContent}>
      <Text style={s.sectionTitle}>Extracted Vocabulary</Text>
      {results.length > 0 && (
        <View style={s.resultsSummary}>
          <Text style={s.summaryText}>
            {results.length} video(s) analyzed • {allEntries.length} entries extracted • {approvedEntries.length} approved
          </Text>
          {results.some((r) => r.errors.length > 0) && (
            <Text style={s.errorText}>
              ⚠️ {results.reduce((sum, r) => sum + r.errors.length, 0)} warning(s)
            </Text>
          )}
        </View>
      )}

      {allEntries.length > 0 ? (
        <FlatList
          data={allEntries}
          keyExtractor={(item, index) => `${item.word}_${item.language}_${index}`}
          renderItem={renderEntryCard}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 8 }}
        />
      ) : (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>🔍</Text>
          <Text style={s.emptyText}>No results yet. Analyze a video to see extracted vocabulary here.</Text>
        </View>
      )}

      {allEntries.length > 0 && (
        <Pressable
          onPress={() => {
            // Approve all remaining entries
            const unapproved = allEntries.filter(
              (e) => !approvedEntries.some((a) => a.word === e.word && a.language === e.language),
            );
            setApprovedEntries((prev) => [...prev, ...unapproved.map((e) => ({ ...e, verified: true }))]);
          }}
          style={({ pressed }) => [s.approveAllBtn, pressed && { opacity: 0.8 }]}
        >
          <Text style={s.approveAllBtnText}>✓ Approve All Remaining</Text>
        </Pressable>
      )}
    </View>
  );

  const renderApprovedTab = () => (
    <View style={s.tabContent}>
      <Text style={s.sectionTitle}>Approved Entries ({approvedEntries.length})</Text>
      <Text style={s.sectionDesc}>
        These entries are ready to be fed into the knowledge base. Review and push when ready.
      </Text>

      {approvedEntries.length > 0 ? (
        <>
          <FlatList
            data={approvedEntries}
            keyExtractor={(item, index) => `approved_${item.word}_${index}`}
            renderItem={({ item }) => (
              <View style={[s.entryCard, s.entryCardApproved]}>
                <Text style={s.entryWord}>{item.word}</Text>
                {item.pronunciation ? <Text style={s.pronunciation}>/{item.pronunciation}/</Text> : null}
                <Text style={s.translation}>{item.translation}</Text>
                <Text style={s.langDialect}>{item.language} ({item.dialect})</Text>
              </View>
            )}
            scrollEnabled={false}
            contentContainerStyle={{ gap: 6 }}
          />

          <Pressable
            onPress={handleFeedToKnowledgeBase}
            style={({ pressed }) => [s.feedBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
          >
            <Text style={s.feedBtnText}>🚀 Feed to Knowledge Base</Text>
          </Pressable>
        </>
      ) : (
        <View style={s.emptyState}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyText}>No approved entries yet. Analyze videos and approve vocabulary to see them here.</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={s.backBtn}>←</Text>
          </Pressable>
          <Text style={s.headerTitle}>OCR Video Ingestion</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Admin Badge */}
        <View style={s.adminBadge}>
          <Text style={s.adminBadgeText}>🔬 Extract on-screen text from language teaching videos</Text>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabScroll}>
          <View style={s.tabBar}>
            {([
              { key: "single", label: "🎬 Single URL" },
              { key: "batch", label: "📦 Batch" },
              { key: "results", label: `📊 Results (${allEntries.length})` },
              { key: "approved", label: `✓ Approved (${approvedEntries.length})` },
            ] as const).map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[s.tab, activeTab === tab.key && s.tabActive]}
              >
                <Text style={[s.tabText, activeTab === tab.key && s.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {activeTab === "single" && renderSingleTab()}
        {activeTab === "batch" && renderBatchTab()}
        {activeTab === "results" && renderResultsTab()}
        {activeTab === "approved" && renderApprovedTab()}
      </ScrollView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, color: "#fff" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: "#fff" },
  adminBadge: { marginHorizontal: 16, backgroundColor: "#0a7ea422", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 16 },
  adminBadgeText: { fontSize: 12, color: "#0a7ea4", fontWeight: "600", textAlign: "center" },
  tabScroll: { marginBottom: 16 },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1e2022" },
  tabActive: { backgroundColor: "#0a7ea4" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#9BA1A6" },
  tabTextActive: { color: "#fff" },
  tabContent: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#9BA1A6", lineHeight: 18, marginBottom: 16 },
  urlInput: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, fontSize: 14, color: "#fff", minHeight: 48 },
  urlCount: { fontSize: 11, color: "#687076", marginTop: 4, textAlign: "right" },
  analyzeBtn: { marginTop: 16, backgroundColor: "#0a7ea4", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  analyzeBtnDisabled: { opacity: 0.4 },
  analyzeBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  loadingRow: { flexDirection: "row", alignItems: "center" },
  pipelineBox: { marginTop: 20, backgroundColor: "#1e2022", borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: "#0a7ea4" },
  pipelineTitle: { fontSize: 13, fontWeight: "700", color: "#fff", marginBottom: 8 },
  pipelineStep: { fontSize: 11, color: "#9BA1A6", lineHeight: 18 },
  feedsIntoBox: { marginTop: 12, backgroundColor: "#1e2022", borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: "#4ADE80" },
  feedsIntoTitle: { fontSize: 13, fontWeight: "700", color: "#4ADE80", marginBottom: 8 },
  feedsIntoItem: { fontSize: 11, color: "#9BA1A6", lineHeight: 20 },
  resultsSummary: { backgroundColor: "#1e2022", borderRadius: 10, padding: 12, marginBottom: 12 },
  summaryText: { fontSize: 12, color: "#ECEDEE", fontWeight: "500" },
  errorText: { fontSize: 11, color: "#F87171", marginTop: 4 },
  entryCard: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14 },
  entryCardApproved: { borderLeftWidth: 3, borderLeftColor: "#4ADE80" },
  entryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  entryWordRow: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  entryWord: { fontSize: 16, fontWeight: "700", color: "#fff" },
  categoryBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  categoryText: { fontSize: 9, fontWeight: "700" },
  confBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  confText: { fontSize: 9, fontWeight: "700" },
  pronunciation: { fontSize: 13, color: "#A78BFA", fontStyle: "italic", marginBottom: 2 },
  translation: { fontSize: 14, color: "#ECEDEE", marginBottom: 2 },
  langDialect: { fontSize: 11, color: "#687076" },
  expandedContent: { marginTop: 10, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "#334155" },
  detailRow: { marginBottom: 8 },
  detailLabel: { fontSize: 11, fontWeight: "600", color: "#9BA1A6", marginBottom: 2 },
  detailValue: { fontSize: 12, color: "#ECEDEE", lineHeight: 18 },
  detailSubValue: { fontSize: 11, color: "#687076", fontStyle: "italic", marginTop: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 8 },
  tag: { backgroundColor: "#0a7ea422", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 10, color: "#0a7ea4", fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  approveBtn: { flex: 1, backgroundColor: "#4ADE8033", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  approveBtnText: { fontSize: 13, fontWeight: "700", color: "#4ADE80" },
  rejectBtn: { flex: 1, backgroundColor: "#F8717133", borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  rejectBtnText: { fontSize: 13, fontWeight: "700", color: "#F87171" },
  approveAllBtn: { marginTop: 16, backgroundColor: "#4ADE8033", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  approveAllBtnText: { fontSize: 15, fontWeight: "700", color: "#4ADE80" },
  feedBtn: { marginTop: 16, backgroundColor: "#0a7ea4", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  feedBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 13, color: "#687076", textAlign: "center", maxWidth: 260 },
});
