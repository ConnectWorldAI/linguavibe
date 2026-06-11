import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { getAllInfluencers, type InfluencerAvatar } from "@/lib/influencer-avatars";
import * as Haptics from "expo-haptics";
import { trpc, vanillaClient } from "@/lib/trpc";

type AdminTab = "content" | "affiliates" | "leaderboard" | "revenue" | "schedule";

interface ContentPost {
  id: string;
  influencerId: string;
  prompt: string;
  platforms: string[];
  status: "draft" | "generating" | "review" | "scheduled" | "posted";
  scheduledAt?: string;
  generatedVideoUrl?: string;
}

interface AffiliateEntry {
  id: string;
  name: string;
  type: "ai_avatar" | "tier1" | "tier2";
  referralCode: string;
  referralLink: string;
  signups: number;
  conversions: number;
  revenue: number;
  commission: number;
  parentAffiliateId?: string;
}

export default function AdminCommandCenter() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("content");
  const [selectedInfluencer, setSelectedInfluencer] = useState<InfluencerAvatar | null>(null);
  const [contentPrompt, setContentPrompt] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["tiktok", "instagram", "youtube"]);
  const [postToApp, setPostToApp] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastJobId, setLastJobId] = useState<string | null>(null);

  const influencers = getAllInfluencers();
  const generateVideoMutation = trpc.heygen.generateAvatarVideo.useMutation();
  const contentProductionMutation = trpc.contentProduction.produce.useMutation();
  const previewScriptMutation = trpc.contentProduction.previewScript.useMutation();
  const [contentStyle, setContentStyle] = useState<string>("comedy-skit");
  const [contentDifficulty, setContentDifficulty] = useState<string>("intermediate");

  // Script Preview state
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewScript, setPreviewScript] = useState<any>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [editableScript, setEditableScript] = useState("");

  // Map influencer → teacher ID for the production pipeline
  const INFLUENCER_TEACHER_MAP: Record<string, string> = {
    natasha_rd: "rafael", carlos_mx: "carlos", valentina_co: "valentina",
    thierry_fr: "jean", bianca_br: "isabela", kenji_jp: "yuki",
    soojin_kr: "jimin", omar_ar: "ahmed", mei_cn: "wei",
    marco_it: "giulia", lena_de: "hans", arjun_in: "priya",
  };

  // Real DB data for affiliates
  const [dbApplications, setDbApplications] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loadingAffiliates, setLoadingAffiliates] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardFilter, setLeaderboardFilter] = useState<"all_time" | "this_month" | "this_week">("all_time");
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [payoutAffiliateId, setPayoutAffiliateId] = useState<number | null>(null);

  // AI avatar entries (these are always your own, not from DB)
  const aiAvatarAffiliates: AffiliateEntry[] = influencers.slice(0, 5).map((inf) => ({
    id: inf.id,
    name: inf.name,
    type: "ai_avatar" as const,
    referralCode: inf.id.toUpperCase().replace("_", ""),
    referralLink: `https://connectworldai.com/ref/${inf.id}`,
    signups: 0,
    conversions: 0,
    revenue: 0,
    commission: 0,
  }));

  const loadAffiliateData = useCallback(async () => {
    setLoadingAffiliates(true);
    try {
      const [apps, stats] = await Promise.all([
        vanillaClient.affiliate.listApplications.query({ status: "all" }),
        vanillaClient.affiliate.adminStats.query(),
      ]);
      setDbApplications(apps);
      setAdminStats(stats);
    } catch (err) {
      console.error("Failed to load affiliate data:", err);
    } finally {
      setLoadingAffiliates(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "affiliates") {
      loadAffiliateData();
    }
    if (activeTab === "leaderboard") {
      loadLeaderboard();
    }
  }, [activeTab, leaderboardFilter]);

  const loadLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const result = await vanillaClient.affiliate.leaderboard.query({ timeFilter: leaderboardFilter, limit: 50 });
      setLeaderboardData(result.leaderboard || []);
    } catch (err) {
      console.error("Failed to load leaderboard:", err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [leaderboardFilter]);

  const handleAdminPayout = useCallback(async (affiliateId: number, affiliateName: string) => {
    setPayoutAffiliateId(affiliateId);
    try {
      const dashboard = await vanillaClient.affiliate.myDashboard.query({ email: "" }); // admin override
      Alert.alert(
        "Initiate Payout",
        `Send pending commissions to ${affiliateName} via Stripe Connect?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send Payout",
            onPress: async () => {
              try {
                const result = await vanillaClient.affiliate.stripeInitiatePayout.mutate({
                  affiliateId,
                  commissionIds: [],
                });
                if (result.success) {
                  Alert.alert("Payout Sent", `$${(result.amount! / 100).toFixed(2)} transferred to ${affiliateName}`);
                  loadAffiliateData();
                } else {
                  Alert.alert("Failed", result.error || "Payout failed");
                }
              } catch (err: any) {
                Alert.alert("Error", err.message);
              }
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setPayoutAffiliateId(null);
    }
  }, []);

  const handleApproveAffiliate = useCallback(async (applicationId: number) => {
    setApprovingId(applicationId);
    try {
      const result = await vanillaClient.affiliate.approveApplication.mutate({ applicationId });
      if (result.success) {
        Alert.alert("Approved!", `Referral code: ${result.referralCode}\nLink: ${result.referralLink}`);
        loadAffiliateData();
      } else {
        Alert.alert("Error", result.error || "Failed to approve");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setApprovingId(null);
    }
  }, []);

  const handleRejectAffiliate = useCallback(async (applicationId: number) => {
    try {
      await vanillaClient.affiliate.rejectApplication.mutate({ applicationId });
      loadAffiliateData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }, []);

  const handlePreviewScript = useCallback(async () => {
    if (!selectedInfluencer || !contentPrompt.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setIsPreviewing(true);
    try {
      const teacherId = INFLUENCER_TEACHER_MAP[selectedInfluencer.id] || "maria";
      const result = await previewScriptMutation.mutateAsync({
        topic: contentPrompt.trim(),
        teacherId,
        language: selectedInfluencer.language || "Spanish",
        style: contentStyle as any,
        difficulty: contentDifficulty as any,
        viralInspiration: selectedInfluencer.sampleContent?.[0]?.description,
      });

      setPreviewScript(result);
      // Format script for editing
      const formatted = result.scenes?.map((s: any, i: number) =>
        `Scene ${i + 1}: ${s.setting || ""}\n${s.dialogue?.map((d: any) => `  ${d.character}: ${d.line}`).join("\n") || s.action || ""}`
      ).join("\n\n") || JSON.stringify(result, null, 2);
      setEditableScript(formatted);
      setShowScriptModal(true);
    } catch (err: any) {
      Alert.alert("Preview Failed", err.message || "Could not generate script preview.");
    } finally {
      setIsPreviewing(false);
    }
  }, [selectedInfluencer, contentPrompt, contentStyle, contentDifficulty]);

  const handleProduceFromPreview = useCallback(async () => {
    if (!selectedInfluencer) return;
    setShowScriptModal(false);
    setIsGenerating(true);
    try {
      const teacherId = INFLUENCER_TEACHER_MAP[selectedInfluencer.id] || "maria";
      const result = await contentProductionMutation.mutateAsync({
        topic: contentPrompt.trim() || previewScript?.title || "Untitled",
        teacherId,
        language: selectedInfluencer.language || "Spanish",
        style: contentStyle as any,
        difficulty: contentDifficulty as any,
        platforms: selectedPlatforms.filter(p => p !== "in-app") as any,
        viralInspiration: editableScript.slice(0, 500),
      });
      setLastJobId(result.jobId);
      Alert.alert("Production Started", result.message);
      setContentPrompt("");
    } catch (err: any) {
      Alert.alert("Production Failed", err.message || "Failed to start production.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedInfluencer, contentPrompt, selectedPlatforms, contentStyle, contentDifficulty, editableScript, previewScript]);

  // Direct HeyGen avatar video generation (single teacher video without full pipeline)
  const handleDirectHeyGenVideo = useCallback(async () => {
    if (!selectedInfluencer || !contentPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const teacherId = INFLUENCER_TEACHER_MAP[selectedInfluencer.id] || "maria";
      const result = await generateVideoMutation.mutateAsync({
        script: contentPrompt.trim(),
        title: `${selectedInfluencer.name} - Teacher Video`,
        type: "teacher-video",
        aspectRatio: "9:16",
        teacherId,
        metadata: { influencerId: selectedInfluencer.id, influencerName: selectedInfluencer.name },
      });
      setLastJobId(result.jobId);
      if (result.demo) {
        Alert.alert("Demo Mode", `Video queued in demo mode.\nJob: ${result.jobId}`);
      } else {
        Alert.alert("Video Generation Started", `HeyGen is generating your teacher video.\nJob: ${result.jobId}`);
      }
    } catch (err: any) {
      Alert.alert("Generation Failed", err.message || "HeyGen video generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedInfluencer, contentPrompt]);

  const handleGenerateContent = useCallback(async () => {
    if (!selectedInfluencer || !contentPrompt.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setIsGenerating(true);
    try {
      // Use the full content production pipeline (Airtable slang → LLM script → Kling scenes → HeyGen teacher → ElevenLabs voices → auto-post)
      const teacherId = INFLUENCER_TEACHER_MAP[selectedInfluencer.id] || "maria";
      const result = await contentProductionMutation.mutateAsync({
        topic: contentPrompt.trim(),
        teacherId,
        language: selectedInfluencer.language || "Spanish",
        style: contentStyle as any,
        difficulty: contentDifficulty as any,
        platforms: selectedPlatforms.filter(p => p !== "in-app") as any,
        viralInspiration: selectedInfluencer.sampleContent?.[0]?.description,
      });

      setLastJobId(result.jobId);

      Alert.alert(
        "Production Pipeline Started",
        `${result.message}\n\nThe pipeline will:\n1. Pull best-match slang from Airtable for ${selectedInfluencer.dialect || selectedInfluencer.language}\n2. AI writes a ${contentStyle} script using verified expressions\n3. Kling generates scene videos\n4. HeyGen creates teacher intro/outro\n5. ElevenLabs voices the characters\n6. Auto-posts to ${selectedPlatforms.join(", ")}`,
        [{ text: "OK" }]
      );

      setContentPrompt("");
    } catch (err: any) {
      Alert.alert(
        "Production Failed",
        err.message || "Something went wrong starting the production pipeline. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGenerating(false);
    }
  }, [selectedInfluencer, contentPrompt, selectedPlatforms, postToApp, contentStyle, contentDifficulty]);

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const renderContentTab = () => (
    <View style={styles.tabContent}>
      {/* Content Review Queue Entry Point */}
      <Pressable
        onPress={() => {
          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/content-review-queue" as any);
        }}
        style={({ pressed }) => [styles.reviewQueueBtn, pressed && { opacity: 0.8 }]}
      >
        <Text style={styles.reviewQueueBtnIcon}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.reviewQueueBtnTitle}>Content Review Queue</Text>
          <Text style={styles.reviewQueueBtnDesc}>Review pending Portuguese lessons before they go live</Text>
        </View>
        <Text style={styles.reviewQueueBtnArrow}>→</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Create & Post Content</Text>
      <Text style={styles.sectionDesc}>
        Select an influencer, write a prompt, and auto-post to all platforms simultaneously.
      </Text>

      {/* Influencer Selector */}
      <Text style={styles.label}>Select Influencer</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.influencerScroll}>
        {influencers.map((inf) => (
          <Pressable
            key={inf.id}
            onPress={() => setSelectedInfluencer(inf)}
            style={[
              styles.influencerChip,
              selectedInfluencer?.id === inf.id && styles.influencerChipActive,
            ]}
          >
            {inf.avatarImageUrl ? (
              <Image source={{ uri: inf.avatarImageUrl }} style={styles.chipAvatar} contentFit="cover" />
            ) : (
              <Text style={styles.chipEmoji}>{inf.avatarEmoji}</Text>
            )}
            <Text style={[styles.chipName, selectedInfluencer?.id === inf.id && styles.chipNameActive]}>
              {inf.name.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content Prompt */}
      <Text style={styles.label}>Content Topic</Text>
      <TextInput
        style={styles.promptInput}
        placeholder="e.g., Dominican slang for ordering coffee at a colmado, comparing 'guapo' across dialects..."
        placeholderTextColor="#687076"
        value={contentPrompt}
        onChangeText={setContentPrompt}
        multiline
        numberOfLines={4}
      />

      {/* Style Selector */}
      <Text style={styles.label}>Skit Style</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        {["comedy-skit", "day-in-life", "challenge", "story-time", "cultural-shock", "street-interview"].map((s) => (
          <Pressable
            key={s}
            onPress={() => setContentStyle(s)}
            style={[styles.platformChip, contentStyle === s && styles.platformChipActive]}
          >
            <Text style={[styles.platformText, contentStyle === s && styles.platformTextActive]}>
              {s.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Difficulty Selector */}
      <Text style={styles.label}>Difficulty</Text>
      <View style={styles.platformRow}>
        {["beginner", "intermediate", "advanced"].map((d) => (
          <Pressable
            key={d}
            onPress={() => setContentDifficulty(d)}
            style={[styles.platformChip, contentDifficulty === d && styles.platformChipActive]}
          >
            <Text style={[styles.platformText, contentDifficulty === d && styles.platformTextActive]}>
              {d === "beginner" ? "\ud83c\udf31 Beginner" : d === "intermediate" ? "\ud83c\udf3f Intermediate" : "\ud83c\udf32 Advanced"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Platform Selection */}
      <Text style={styles.label}>Post To</Text>
      <View style={styles.platformRow}>
        {["tiktok", "instagram", "youtube"].map((p) => (
          <Pressable
            key={p}
            onPress={() => togglePlatform(p)}
            style={[styles.platformChip, selectedPlatforms.includes(p) && styles.platformChipActive]}
          >
            <Text style={styles.platformIcon}>
              {p === "tiktok" ? "🎵" : p === "instagram" ? "📸" : "▶️"}
            </Text>
            <Text style={[styles.platformText, selectedPlatforms.includes(p) && styles.platformTextActive]}>
              {p === "tiktok" ? "TikTok" : p === "instagram" ? "Instagram" : "YouTube"}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => setPostToApp(!postToApp)}
          style={[styles.platformChip, postToApp && styles.platformChipActive]}
        >
          <Text style={styles.platformIcon}>📱</Text>
          <Text style={[styles.platformText, postToApp && styles.platformTextActive]}>In-App</Text>
        </Pressable>
      </View>

      {/* Action Buttons */}
      <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
        {/* Preview Script Button */}
        <Pressable
          onPress={handlePreviewScript}
          style={({ pressed }) => [
            styles.generateBtn,
            { flex: 1, backgroundColor: "#334155" },
            (!selectedInfluencer || !contentPrompt.trim() || isPreviewing) && styles.generateBtnDisabled,
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          ]}
        >
          {isPreviewing ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateBtnText}>Previewing...</Text>
            </View>
          ) : (
            <Text style={styles.generateBtnText}>📝 Preview Script</Text>
          )}
        </Pressable>

        {/* Generate & Post Button */}
        <Pressable
          onPress={handleGenerateContent}
          style={({ pressed }) => [
            styles.generateBtn,
            { flex: 1 },
            (!selectedInfluencer || !contentPrompt.trim() || isGenerating) && styles.generateBtnDisabled,
            pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
          ]}
        >
          {isGenerating ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.generateBtnText}>Generating...</Text>
            </View>
          ) : (
            <Text style={styles.generateBtnText}>🚀 Generate & Post</Text>
          )}
        </Pressable>
      </View>

      {/* Script Preview Modal */}
      <Modal visible={showScriptModal} animationType="slide" transparent>
        <View style={scriptModalStyles.overlay}>
          <View style={scriptModalStyles.container}>
            <View style={scriptModalStyles.header}>
              <Text style={scriptModalStyles.title}>🎬 Script Preview</Text>
              <Pressable onPress={() => setShowScriptModal(false)} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
                <Text style={scriptModalStyles.closeBtn}>✕</Text>
              </Pressable>
            </View>

            {previewScript && (
              <View style={scriptModalStyles.metaRow}>
                <Text style={scriptModalStyles.metaText}>🎯 {previewScript.title || "Untitled"}</Text>
                <Text style={scriptModalStyles.metaText}>⏱ ~{previewScript.estimatedDuration || 45}s</Text>
                <Text style={scriptModalStyles.metaText}>🎭 {previewScript.scenes?.length || 0} scenes</Text>
              </View>
            )}

            <Text style={scriptModalStyles.editLabel}>Edit script before producing:</Text>
            <ScrollView style={scriptModalStyles.scriptScroll}>
              <TextInput
                style={scriptModalStyles.scriptInput}
                value={editableScript}
                onChangeText={setEditableScript}
                multiline
                numberOfLines={20}
                placeholderTextColor="#687076"
              />
            </ScrollView>

            {previewScript?.vocabularyTargets && previewScript.vocabularyTargets.length > 0 && (
              <View style={scriptModalStyles.vocabRow}>
                <Text style={scriptModalStyles.vocabLabel}>📚 Vocabulary targets:</Text>
                <Text style={scriptModalStyles.vocabText}>{previewScript.vocabularyTargets.join(", ")}</Text>
              </View>
            )}

            <View style={scriptModalStyles.actionRow}>
              <Pressable
                onPress={() => setShowScriptModal(false)}
                style={({ pressed }) => [scriptModalStyles.cancelBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={scriptModalStyles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleProduceFromPreview}
                style={({ pressed }) => [scriptModalStyles.produceBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
              >
                <Text style={scriptModalStyles.produceBtnText}>🚀 Produce Video</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Last Job Status */}
      {lastJobId && (
        <View style={{ marginTop: 8, padding: 10, backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 8 }}>
          <Text style={{ color: "#22C55E", fontSize: 12 }}>Last job: {lastJobId}</Text>
        </View>
      )}

      {/* Recent Generations Panel */}
      <RecentGenerationsPanel />

      {/* Pipeline Info */}
      <View style={styles.pipelineInfo}>
        <Text style={styles.pipelineTitle}>Content Production Pipeline (Airtable-Powered)</Text>
        <Text style={styles.pipelineStep}>1. Best-match slang pulled from Airtable for the teacher's dialect</Text>
        <Text style={styles.pipelineStep}>2. LLM writes skit script using verified expressions + topic</Text>
        <Text style={styles.pipelineStep}>3. Kling AI generates scene video clips</Text>
        <Text style={styles.pipelineStep}>4. HeyGen creates teacher intro/outro with matched stock avatar</Text>
        <Text style={styles.pipelineStep}>5. ElevenLabs voices the characters in the target language</Text>
        <Text style={styles.pipelineStep}>6. FFmpeg stitches into final video</Text>
        <Text style={styles.pipelineStep}>7. Auto-posts to TikTok, IG, YouTube + in-app feed</Text>
      </View>
    </View>
  );

  const pendingApps = dbApplications.filter((a) => a.status === "pending");
  const approvedApps = dbApplications.filter((a) => a.status === "approved");
  const tier1Apps = approvedApps.filter((a) => a.tier === "tier1");
  const tier2Apps = approvedApps.filter((a) => a.tier === "tier2");

  const renderAffiliatesTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Affiliate Attribution</Text>
      <Text style={styles.sectionDesc}>
        Track which influencer (AI or real) brought which customer. AI avatars = 100% your revenue. Real affiliates = commission payouts.
      </Text>

      {loadingAffiliates ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text style={{ color: "#9BA1A6", marginTop: 12, fontSize: 13 }}>Loading affiliate data...</Text>
        </View>
      ) : (
        <>
          {/* Summary Cards - from real DB stats */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{adminStats?.totalAffiliates || 0}</Text>
              <Text style={styles.summaryLabel}>Active Affiliates</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{adminStats?.pendingApplications || 0}</Text>
              <Text style={styles.summaryLabel}>Pending Apps</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{adminStats?.totalReferrals || 0}</Text>
              <Text style={styles.summaryLabel}>Total Referrals</Text>
            </View>
          </View>

          {/* Pending Applications - REVIEW/APPROVE/REJECT */}
          {pendingApps.length > 0 && (
            <>
              <Text style={styles.subSectionTitle}>⏳ Pending Applications ({pendingApps.length})</Text>
              {pendingApps.map((app) => (
                <View key={app.id} style={[styles.affiliateCard, { borderLeftWidth: 3, borderLeftColor: "#F59E0B" }]}>
                  <View style={styles.affiliateHeader}>
                    <Text style={styles.affiliateName}>{app.name}</Text>
                    <View style={[styles.affiliateTypeBadge, { backgroundColor: "#F59E0B33" }]}>
                      <Text style={[styles.affiliateTypeText, { color: "#F59E0B" }]}>PENDING</Text>
                    </View>
                  </View>
                  <Text style={styles.affiliateCode}>{app.email}</Text>
                  <Text style={styles.affiliateLink}>
                    {[app.tiktokHandle && `TikTok: @${app.tiktokHandle}`, app.instagramHandle && `IG: @${app.instagramHandle}`, app.youtubeHandle && `YT: ${app.youtubeHandle}`].filter(Boolean).join(" | ")}
                  </Text>
                  {app.followerCount && <Text style={{ color: "#9BA1A6", fontSize: 12, marginTop: 2 }}>Followers: {app.followerCount}</Text>}
                  {app.languagesTaught && <Text style={{ color: "#9BA1A6", fontSize: 12, marginTop: 2 }}>Teaches: {app.languagesTaught}</Text>}
                  {app.whyJoin && <Text style={{ color: "#687076", fontSize: 11, marginTop: 4, fontStyle: "italic" }}>"{app.whyJoin}"</Text>}
                  <Text style={{ color: "#687076", fontSize: 11, marginTop: 4 }}>Applied: {new Date(app.createdAt).toLocaleDateString()}</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                    <Pressable
                      onPress={() => handleApproveAffiliate(app.id)}
                      style={({ pressed }) => [{ flex: 1, backgroundColor: "#22C55E", borderRadius: 10, paddingVertical: 10, alignItems: "center", opacity: pressed ? 0.8 : 1 }]}
                    >
                      {approvingId === app.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Approve</Text>
                      )}
                    </Pressable>
                    <Pressable
                      onPress={() => handleRejectAffiliate(app.id)}
                      style={({ pressed }) => [{ flex: 1, backgroundColor: "#EF444433", borderRadius: 10, paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: "#EF4444", opacity: pressed ? 0.8 : 1 }]}
                    >
                      <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>Reject</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* AI Avatars Section */}
          <Text style={styles.subSectionTitle}>🤖 AI Avatars (100% Your Revenue)</Text>
          {aiAvatarAffiliates.map((aff) => (
            <View key={aff.id} style={styles.affiliateCard}>
              <View style={styles.affiliateHeader}>
                <Text style={styles.affiliateName}>{aff.name}</Text>
                <View style={styles.affiliateTypeBadge}>
                  <Text style={styles.affiliateTypeText}>AI AVATAR</Text>
                </View>
              </View>
              <Text style={styles.affiliateCode}>Code: {aff.referralCode}</Text>
              <Text style={styles.affiliateLink}>{aff.referralLink}</Text>
            </View>
          ))}

          {/* Approved Tier 1 Affiliates from DB */}
          <Text style={styles.subSectionTitle}>⭐ Tier 1 Affiliates (20% Commission) — {tier1Apps.length} approved</Text>
          {tier1Apps.length === 0 ? (
            <Text style={{ color: "#687076", fontSize: 13, marginBottom: 16 }}>No approved Tier 1 affiliates yet. Approve pending applications above.</Text>
          ) : (
            tier1Apps.map((aff) => (
              <View key={aff.id} style={styles.affiliateCard}>
                <View style={styles.affiliateHeader}>
                  <Text style={styles.affiliateName}>{aff.name}</Text>
                  <View style={[styles.affiliateTypeBadge, { backgroundColor: "#4ADE8033" }]}>
                    <Text style={[styles.affiliateTypeText, { color: "#4ADE80" }]}>TIER 1</Text>
                  </View>
                </View>
                <Text style={styles.affiliateCode}>Code: {aff.referralCode || "Pending"}</Text>
                <Text style={styles.affiliateLink}>{aff.referralLink || "Link generated on approval"}</Text>
                <Text style={{ color: "#687076", fontSize: 11, marginTop: 4 }}>{aff.email} | Approved: {aff.approvedAt ? new Date(aff.approvedAt).toLocaleDateString() : "N/A"}</Text>
              </View>
            ))
          )}

          {/* Tier 2 Sub-Affiliates from DB */}
          <Text style={styles.subSectionTitle}>🔗 Tier 2 Sub-Affiliates (5% Commission) — {tier2Apps.length} approved</Text>
          {tier2Apps.length === 0 ? (
            <Text style={{ color: "#687076", fontSize: 13, marginBottom: 16 }}>No Tier 2 sub-affiliates yet.</Text>
          ) : (
            tier2Apps.map((aff) => (
              <View key={aff.id} style={styles.affiliateCard}>
                <View style={styles.affiliateHeader}>
                  <Text style={styles.affiliateName}>{aff.name}</Text>
                  <View style={[styles.affiliateTypeBadge, { backgroundColor: "#FBBF2433" }]}>
                    <Text style={[styles.affiliateTypeText, { color: "#FBBF24" }]}>TIER 2</Text>
                  </View>
                </View>
                <Text style={styles.affiliateCode}>Code: {aff.referralCode || "Pending"}</Text>
                <Text style={styles.affiliateLink}>{aff.referralLink || "Link generated on approval"}</Text>
                <Text style={styles.affiliateParent}>↳ Recruited by affiliate #{aff.parentAffiliateId}</Text>
              </View>
            ))
          )}
        </>
      )}
    </View>
  );

  const renderRevenueTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Revenue Dashboard</Text>

      {/* Total Revenue */}
      <View style={styles.revenueHero}>
        <Text style={styles.revenueHeroValue}>$47,850</Text>
        <Text style={styles.revenueHeroLabel}>Total Monthly Revenue (All Sources)</Text>
      </View>

      {/* Revenue Breakdown */}
      <Text style={styles.subSectionTitle}>Revenue Streams</Text>
      <View style={styles.revenueBreakdown}>
        {[
          { label: "App Subscriptions", amount: "$18,200", pct: "38%" },
          { label: "AI Avatar Content (Ad Revenue)", amount: "$8,400", pct: "18%" },
          { label: "Brand Deals / Sponsorships", amount: "$7,500", pct: "16%" },
          { label: "Live Events (Tickets)", amount: "$5,200", pct: "11%" },
          { label: "Affiliate Conversions", amount: "$4,100", pct: "9%" },
          { label: "Paid Courses", amount: "$2,800", pct: "6%" },
          { label: "Merch Sales", amount: "$1,650", pct: "3%" },
        ].map((item) => (
          <View key={item.label} style={styles.revenueRow}>
            <Text style={styles.revenueLabel}>{item.label}</Text>
            <View style={styles.revenueRight}>
              <Text style={styles.revenueAmount}>{item.amount}</Text>
              <Text style={styles.revenuePct}>{item.pct}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Per Influencer Revenue */}
      <Text style={styles.subSectionTitle}>Revenue Per AI Influencer</Text>
      {influencers.slice(0, 6).map((inf) => (
        <View key={inf.id} style={styles.infRevenueCard}>
          <View style={styles.infRevenueHeader}>
            {inf.avatarImageUrl ? (
              <Image source={{ uri: inf.avatarImageUrl }} style={styles.infRevenueAvatar} contentFit="cover" />
            ) : (
              <Text style={styles.infRevenueEmoji}>{inf.avatarEmoji}</Text>
            )}
            <View style={styles.infRevenueInfo}>
              <Text style={styles.infRevenueName}>{inf.name}</Text>
              <Text style={styles.infRevenueLang}>{inf.teachingLanguage || inf.language}</Text>
            </View>
            <Text style={styles.infRevenueAmount}>
              {inf.monetization?.estimatedMonthlyRevenue || "$5K-$10K"}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const BADGE_COLORS: Record<string, string> = {
    Bronze: "#CD7F32",
    Silver: "#C0C0C0",
    Gold: "#FFD700",
    Platinum: "#E5E4E2",
  };

  const renderLeaderboardTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Affiliate Leaderboard</Text>
      <Text style={styles.sectionDesc}>
        Top-performing affiliates ranked by signups, conversions, and earnings.
      </Text>

      {/* Time Filters */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {(["all_time", "this_month", "this_week"] as const).map((filter) => (
          <Pressable
            key={filter}
            onPress={() => setLeaderboardFilter(filter)}
            style={[styles.tab, leaderboardFilter === filter && styles.tabActive, { paddingHorizontal: 12, paddingVertical: 6 }]}
          >
            <Text style={[styles.tabText, leaderboardFilter === filter && styles.tabTextActive, { fontSize: 11 }]}>
              {filter === "all_time" ? "All Time" : filter === "this_month" ? "This Month" : "This Week"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loadingLeaderboard ? (
        <View style={{ padding: 40, alignItems: "center" }}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : leaderboardData.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>🏆</Text>
          <Text style={{ color: "#9BA1A6", fontSize: 14 }}>No rankings yet</Text>
        </View>
      ) : (
        leaderboardData.map((item: any, idx: number) => {
          const badgeColor = BADGE_COLORS[item.badge] || "#CD7F32";
          return (
            <View key={idx} style={[styles.affiliateCard, { flexDirection: "row", alignItems: "center" }]}>
              {/* Rank */}
              <View style={{
                width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center",
                backgroundColor: item.rank <= 3 ? (item.rank === 1 ? "#FFD700" : item.rank === 2 ? "#C0C0C0" : "#CD7F32") : "#1e2022",
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: item.rank <= 3 ? "#000" : "#fff" }}>
                  {item.rank <= 3 ? ["🥇", "🥈", "🥉"][item.rank - 1] : `#${item.rank}`}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.affiliateName}>{item.name}</Text>
                  <View style={{ backgroundColor: badgeColor + "30", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: "700", color: badgeColor }}>{item.badge}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: "#687076", marginTop: 2 }}>
                  {item.totalReferrals} referrals · {item.totalConversions} conversions · {item.conversionRate}% rate
                </Text>
              </View>

              {/* Earnings + Payout */}
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#4ADE80" }}>
                  ${(item.totalEarnings / 100).toFixed(0)}
                </Text>
                <Pressable
                  onPress={() => handleAdminPayout(item.affiliateId, item.name)}
                  style={({ pressed }) => [{
                    marginTop: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                    backgroundColor: "#22C55E33", opacity: pressed ? 0.7 : 1,
                  }]}
                >
                  <Text style={{ fontSize: 9, fontWeight: "700", color: "#22C55E" }}>PAY</Text>
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const renderScheduleTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Content Schedule</Text>
      <Text style={styles.sectionDesc}>
        Set up recurring content schedules for each influencer. Auto-generates and posts on schedule.
      </Text>

      {/* Schedule Grid */}
      {influencers.slice(0, 4).map((inf) => (
        <View key={inf.id} style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.scheduleName}>{inf.name}</Text>
            <View style={styles.scheduleFreq}>
              <Text style={styles.scheduleFreqText}>3x/week</Text>
            </View>
          </View>
          <View style={styles.schedulePlatforms}>
            <Text style={styles.schedulePlatformText}>🎵 TikTok: Mon/Wed/Fri 6PM</Text>
            <Text style={styles.schedulePlatformText}>📸 Instagram: Tue/Thu 7PM</Text>
            <Text style={styles.schedulePlatformText}>▶️ YouTube: Saturday 12PM</Text>
          </View>
          <View style={styles.scheduleStatus}>
            <Text style={styles.scheduleStatusText}>✅ Active — Next post in 4h</Text>
          </View>
        </View>
      ))}

      {/* Automation Settings */}
      <View style={styles.automationBox}>
        <Text style={styles.automationTitle}>⚙️ Automation Settings</Text>
        <Text style={styles.automationItem}>• Auto-approve: OFF (review before posting)</Text>
        <Text style={styles.automationItem}>• Content queue: 12 posts pending review</Text>
        <Text style={styles.automationItem}>• Retry failed posts: ON (3 attempts)</Text>
        <Text style={styles.automationItem}>• Analytics sync: Every 6 hours</Text>
      </View>
    </View>
  );

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={styles.backBtn}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Command Center</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Admin Badge */}
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>🔐 Admin Access — Content & Revenue Management</Text>
        </View>

        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <View style={styles.tabBar}>
            {([
              { key: "content", label: "📝 Content" },
              { key: "affiliates", label: "🤝 Affiliates" },
              { key: "leaderboard", label: "🏆 Rankings" },
              { key: "revenue", label: "💰 Revenue" },
              { key: "schedule", label: "📅 Schedule" },
            ] as const).map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              >
                <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Tab Content */}
        {activeTab === "content" && renderContentTab()}
        {activeTab === "affiliates" && renderAffiliatesTab()}
        {activeTab === "leaderboard" && renderLeaderboardTab()}
        {activeTab === "revenue" && renderRevenueTab()}
        {activeTab === "schedule" && renderScheduleTab()}
      </ScrollView>
    </ScreenContainer>
  );
}

// ─── Pipeline Progress Tracker ───────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: "scripting", label: "Scripting", icon: "📝" },
  { key: "scenes", label: "Scenes", icon: "🎬" },
  { key: "voices", label: "Voices", icon: "🎙️" },
  { key: "stitching", label: "Stitching", icon: "🎞️" },
  { key: "done", label: "Done", icon: "✅" },
];

function PipelineProgressTracker({ stage, progress }: { stage?: string; progress?: number }) {
  const currentIdx = PIPELINE_STAGES.findIndex(s => s.key === stage);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;
  const pct = progress ?? (activeIdx / (PIPELINE_STAGES.length - 1)) * 100;

  return (
    <View style={progressStyles.container}>
      {/* Progress bar */}
      <View style={progressStyles.barBg}>
        <View style={[progressStyles.barFill, { width: `${Math.min(pct, 100)}%` as any }]} />
      </View>

      {/* Step indicators */}
      <View style={progressStyles.stepsRow}>
        {PIPELINE_STAGES.map((s, i) => {
          const isActive = i === activeIdx;
          const isCompleted = i < activeIdx;
          return (
            <View key={s.key} style={progressStyles.step}>
              <View style={[
                progressStyles.stepDot,
                isCompleted && progressStyles.stepDotCompleted,
                isActive && progressStyles.stepDotActive,
              ]}>
                <Text style={progressStyles.stepIcon}>
                  {isCompleted ? "✓" : s.icon}
                </Text>
              </View>
              <Text style={[
                progressStyles.stepLabel,
                isActive && progressStyles.stepLabelActive,
                isCompleted && progressStyles.stepLabelCompleted,
              ]}>
                {s.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Current stage text */}
      <Text style={progressStyles.stageText}>
        {stage ? `Stage: ${stage}` : "Starting..."} {pct > 0 ? `• ${Math.round(pct)}%` : ""}
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  container: { marginTop: 10, marginBottom: 6 },
  barBg: { height: 4, backgroundColor: "#334155", borderRadius: 2, overflow: "hidden", marginBottom: 10 },
  barFill: { height: 4, backgroundColor: "#0a7ea4", borderRadius: 2 },
  stepsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  step: { alignItems: "center", flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#334155", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  stepDotActive: { backgroundColor: "#0a7ea4", borderWidth: 2, borderColor: "#38BDF8" },
  stepDotCompleted: { backgroundColor: "#22C55E" },
  stepIcon: { fontSize: 12, color: "#fff" },
  stepLabel: { fontSize: 9, color: "#687076", textAlign: "center" },
  stepLabelActive: { color: "#0a7ea4", fontWeight: "700" },
  stepLabelCompleted: { color: "#22C55E" },
  stageText: { fontSize: 10, color: "#9BA1A6", textAlign: "center" },
});

// ─── Recent Generations Panel ────────────────────────────────────────────────

function RecentGenerationsPanel() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reposting, setReposting] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      // Merge jobs from both HeyGen direct and content production pipeline
      const [heygenJobs, prodJobs] = await Promise.all([
        vanillaClient.heygen.listJobs.query({ limit: 5 }).catch(() => []),
        vanillaClient.contentProduction.listJobs.query({ limit: 10 }).catch(() => []),
      ]);
      // Normalize production jobs to same shape
      const normalizedProd = (prodJobs || []).map((j: any) => ({
        id: j.id,
        status: j.status === "completed" ? "completed" : j.status === "failed" ? "failed" : "processing",
        type: "skit-pipeline",
        createdAt: j.createdAt,
        metadata: { influencerName: j.teacherId, script: j.title },
        progress: j.progress,
        stage: j.stage,
      }));
      const merged = [...normalizedProd, ...(heygenJobs || [])]
        .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 10);
      setJobs(merged);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const handleRepost = useCallback(async (job: any, platform: string) => {
    setReposting(job.id);
    try {
      await vanillaClient.autoPost.repost.mutate({
        videoUrl: job.videoUrl,
        influencerName: job.metadata?.influencerName || "ConnectWorld AI",
        script: job.metadata?.script || "",
        platforms: [platform],
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Posted!", `Video re-posted to ${platform}`);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to re-post");
    } finally {
      setReposting(null);
    }
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "#22C55E";
      case "processing": return "#F59E0B";
      case "failed": return "#EF4444";
      default: return "#9BA1A6";
    }
  };

  if (jobs.length === 0 && !loading) return null;

  return (
    <View style={recentStyles.container}>
      <View style={recentStyles.headerRow}>
        <Text style={recentStyles.title}>Recent Generations</Text>
        <Pressable onPress={loadJobs} style={({ pressed }) => [pressed && { opacity: 0.6 }]}>
          <Text style={recentStyles.refreshBtn}>{loading ? "..." : "↻ Refresh"}</Text>
        </Pressable>
      </View>

      {jobs.map((job) => (
        <View key={job.id} style={recentStyles.jobCard}>
          <View style={recentStyles.jobHeader}>
            <View style={[recentStyles.statusDot, { backgroundColor: getStatusColor(job.status) }]} />
            <Text style={recentStyles.jobType}>{job.type || "video"}</Text>
            <Text style={recentStyles.jobStatus}>{job.status}</Text>
            <Text style={recentStyles.jobTime}>
              {job.createdAt ? new Date(job.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
            </Text>
          </View>

          {job.metadata?.influencerName && (
            <Text style={recentStyles.jobInfluencer}>👤 {job.metadata.influencerName}</Text>
          )}

          {/* Progress Tracker — shows pipeline step indicator */}
          {job.status === "processing" && job.type === "skit-pipeline" && (
            <PipelineProgressTracker stage={job.stage} progress={job.progress} />
          )}

          {job.thumbnailUrl && (
            <Image source={{ uri: job.thumbnailUrl }} style={recentStyles.thumbnail} contentFit="cover" />
          )}

          {job.status === "completed" && job.videoUrl && (
            <View style={recentStyles.repostRow}>
              <Text style={recentStyles.repostLabel}>Re-post:</Text>
              {["tiktok", "instagram", "youtube"].map((p) => (
                <Pressable
                  key={p}
                  onPress={() => handleRepost(job, p)}
                  style={({ pressed }) => [recentStyles.repostBtn, pressed && { opacity: 0.6 }]}
                >
                  <Text style={recentStyles.repostBtnText}>
                    {reposting === job.id ? "..." : p === "tiktok" ? "🎵" : p === "instagram" ? "📸" : "▶️"}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {job.status === "failed" && job.error && (
            <Text style={recentStyles.errorText}>⚠️ {job.error}</Text>
          )}
        </View>
      ))}
    </View>
  );
}

const recentStyles = StyleSheet.create({
  container: { marginTop: 20, borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 15, fontWeight: "700", color: "#fff" },
  refreshBtn: { fontSize: 12, color: "#0a7ea4", fontWeight: "600" },
  jobCard: { backgroundColor: "#1e2022", borderRadius: 10, padding: 12, marginBottom: 10 },
  jobHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  jobType: { fontSize: 12, fontWeight: "600", color: "#fff", textTransform: "capitalize" },
  jobStatus: { fontSize: 11, color: "#9BA1A6", flex: 1 },
  jobTime: { fontSize: 11, color: "#687076" },
  jobInfluencer: { fontSize: 12, color: "#9BA1A6", marginTop: 6 },
  thumbnail: { width: "100%", height: 120, borderRadius: 8, marginTop: 8 },
  repostRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  repostLabel: { fontSize: 11, color: "#9BA1A6" },
  repostBtn: { backgroundColor: "#334155", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  repostBtnText: { fontSize: 14 },
  errorText: { fontSize: 11, color: "#EF4444", marginTop: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { fontSize: 24, color: "#fff" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: "#fff" },
  adminBadge: { marginHorizontal: 16, backgroundColor: "#7C3AED22", borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 16 },
  adminBadgeText: { fontSize: 12, color: "#A78BFA", fontWeight: "600", textAlign: "center" },
  tabScroll: { marginBottom: 16 },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1e2022" },
  tabActive: { backgroundColor: "#0a7ea4" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#9BA1A6" },
  tabTextActive: { color: "#fff" },
  tabContent: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 6 },
  sectionDesc: { fontSize: 13, color: "#9BA1A6", lineHeight: 18, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#ECEDEE", marginBottom: 8, marginTop: 12 },
  influencerScroll: { marginBottom: 8 },
  influencerChip: { alignItems: "center", marginRight: 12, padding: 8, borderRadius: 12, backgroundColor: "#1e2022", minWidth: 70 },
  influencerChipActive: { backgroundColor: "#0a7ea433", borderWidth: 1, borderColor: "#0a7ea4" },
  chipAvatar: { width: 36, height: 36, borderRadius: 18, marginBottom: 4 },
  chipEmoji: { fontSize: 24, marginBottom: 4 },
  chipName: { fontSize: 10, color: "#9BA1A6", fontWeight: "500" },
  chipNameActive: { color: "#0a7ea4" },
  promptInput: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, fontSize: 14, color: "#fff", minHeight: 100, textAlignVertical: "top" },
  platformRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  platformChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#1e2022" },
  platformChipActive: { backgroundColor: "#0a7ea433", borderWidth: 1, borderColor: "#0a7ea4" },
  platformIcon: { fontSize: 14 },
  platformText: { fontSize: 12, color: "#9BA1A6", fontWeight: "500" },
  platformTextActive: { color: "#0a7ea4" },
  generateBtn: { marginTop: 20, backgroundColor: "#0a7ea4", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  generateBtnDisabled: { opacity: 0.4 },
  generateBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  pipelineInfo: { marginTop: 20, backgroundColor: "#1e2022", borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: "#0a7ea4" },
  pipelineTitle: { fontSize: 13, fontWeight: "700", color: "#fff", marginBottom: 8 },
  pipelineStep: { fontSize: 11, color: "#9BA1A6", lineHeight: 18 },
  summaryRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: "#1e2022", borderRadius: 12, padding: 12, alignItems: "center" },
  summaryValue: { fontSize: 16, fontWeight: "700", color: "#4ADE80" },
  summaryLabel: { fontSize: 10, color: "#9BA1A6", marginTop: 4, textAlign: "center" },
  subSectionTitle: { fontSize: 14, fontWeight: "700", color: "#ECEDEE", marginTop: 16, marginBottom: 10 },
  affiliateCard: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, marginBottom: 10 },
  affiliateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  affiliateName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  affiliateTypeBadge: { backgroundColor: "#0a7ea433", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  affiliateTypeText: { fontSize: 9, fontWeight: "700", color: "#0a7ea4" },
  affiliateCode: { fontSize: 12, color: "#A78BFA", fontWeight: "500", marginBottom: 2 },
  affiliateLink: { fontSize: 11, color: "#687076", marginBottom: 6 },
  affiliateParent: { fontSize: 11, color: "#FBBF24", marginBottom: 6 },
  affiliateStats: { flexDirection: "row", gap: 12 },
  affiliateStat: { fontSize: 11, color: "#9BA1A6" },
  revenueHero: { backgroundColor: "#1e2022", borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 20 },
  revenueHeroValue: { fontSize: 32, fontWeight: "800", color: "#4ADE80" },
  revenueHeroLabel: { fontSize: 12, color: "#9BA1A6", marginTop: 4 },
  revenueBreakdown: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, marginBottom: 16 },
  revenueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#334155" },
  revenueLabel: { fontSize: 13, color: "#ECEDEE", flex: 1 },
  revenueRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  revenueAmount: { fontSize: 13, fontWeight: "700", color: "#4ADE80" },
  revenuePct: { fontSize: 11, color: "#687076", width: 32, textAlign: "right" },
  infRevenueCard: { backgroundColor: "#1e2022", borderRadius: 12, padding: 12, marginBottom: 8 },
  infRevenueHeader: { flexDirection: "row", alignItems: "center" },
  infRevenueAvatar: { width: 32, height: 32, borderRadius: 16 },
  infRevenueEmoji: { fontSize: 20 },
  infRevenueInfo: { flex: 1, marginLeft: 10 },
  infRevenueName: { fontSize: 13, fontWeight: "600", color: "#fff" },
  infRevenueLang: { fontSize: 11, color: "#9BA1A6" },
  infRevenueAmount: { fontSize: 13, fontWeight: "700", color: "#4ADE80" },
  scheduleCard: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, marginBottom: 10 },
  scheduleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  scheduleName: { fontSize: 14, fontWeight: "600", color: "#fff" },
  scheduleFreq: { backgroundColor: "#0a7ea433", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  scheduleFreqText: { fontSize: 10, fontWeight: "700", color: "#0a7ea4" },
  schedulePlatforms: { gap: 4, marginBottom: 8 },
  schedulePlatformText: { fontSize: 11, color: "#9BA1A6" },
  scheduleStatus: { borderTopWidth: 0.5, borderTopColor: "#334155", paddingTop: 8 },
  scheduleStatusText: { fontSize: 11, color: "#4ADE80", fontWeight: "500" },
  automationBox: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, marginTop: 16, borderLeftWidth: 3, borderLeftColor: "#A78BFA" },
  automationTitle: { fontSize: 13, fontWeight: "700", color: "#A78BFA", marginBottom: 8 },
  automationItem: { fontSize: 11, color: "#9BA1A6", lineHeight: 18 },
  reviewQueueBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a2a1a", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#22C55E" },
  reviewQueueBtnIcon: { fontSize: 24, marginRight: 12 },
  reviewQueueBtnTitle: { fontSize: 14, fontWeight: "700", color: "#22C55E" },
  reviewQueueBtnDesc: { fontSize: 11, color: "#9BA1A6", marginTop: 2 },
  reviewQueueBtnArrow: { fontSize: 18, color: "#22C55E", marginLeft: 8 },
});


const scriptModalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", padding: 16 },
  container: { backgroundColor: "#1e2022", borderRadius: 16, padding: 20, maxHeight: "90%" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 18, fontWeight: "700", color: "#fff" },
  closeBtn: { fontSize: 20, color: "#9BA1A6", padding: 4 },
  metaRow: { flexDirection: "row", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  metaText: { fontSize: 12, color: "#0a7ea4", fontWeight: "600" },
  editLabel: { fontSize: 12, color: "#9BA1A6", marginBottom: 6 },
  scriptScroll: { maxHeight: 300, marginBottom: 12 },
  scriptInput: { backgroundColor: "#151718", borderRadius: 10, padding: 12, fontSize: 13, color: "#ECEDEE", lineHeight: 20, textAlignVertical: "top", minHeight: 200 },
  vocabRow: { marginBottom: 12 },
  vocabLabel: { fontSize: 11, fontWeight: "600", color: "#FBBF24", marginBottom: 4 },
  vocabText: { fontSize: 11, color: "#9BA1A6" },
  actionRow: { flexDirection: "row", gap: 10 },
  cancelBtn: { flex: 1, backgroundColor: "#334155", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: "#9BA1A6" },
  produceBtn: { flex: 1, backgroundColor: "#0a7ea4", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  produceBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
