import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";

type ReviewStatus = "pending_review" | "approved" | "rejected" | "needs_revision";

const STATUS_COLORS: Record<ReviewStatus, string> = {
  pending_review: "#F59E0B",
  approved: "#22C55E",
  rejected: "#EF4444",
  needs_revision: "#6C63FF",
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending_review: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  needs_revision: "Needs Revision",
};

export default function ContentReviewQueueScreen() {
  const [activeFilter, setActiveFilter] = useState<ReviewStatus | undefined>("pending_review");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);

  const queueQuery = trpc.contentValidation.getReviewQueue.useQuery({
    status: activeFilter,
    language: "portuguese",
    limit: 50,
  });

  const statsQuery = trpc.contentValidation.getStats.useQuery();
  const approveMutation = trpc.contentValidation.approveContent.useMutation();
  const rejectMutation = trpc.contentValidation.rejectContent.useMutation();
  const revisionMutation = trpc.contentValidation.requestRevision.useMutation();
  const aiValidateMutation = trpc.contentValidation.aiPreValidate.useMutation();

  const handleApprove = useCallback(async () => {
    if (!selectedItem) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await approveMutation.mutateAsync({
      id: selectedItem.id,
      reviewerNotes: reviewNotes || undefined,
    });
    setShowReviewModal(false);
    setSelectedItem(null);
    setReviewNotes("");
    queueQuery.refetch();
    statsQuery.refetch();
  }, [selectedItem, reviewNotes]);

  const handleReject = useCallback(async () => {
    if (!selectedItem || !reviewNotes.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await rejectMutation.mutateAsync({
      id: selectedItem.id,
      reviewerNotes: reviewNotes,
    });
    setShowReviewModal(false);
    setSelectedItem(null);
    setReviewNotes("");
    queueQuery.refetch();
    statsQuery.refetch();
  }, [selectedItem, reviewNotes]);

  const handleRequestRevision = useCallback(async () => {
    if (!selectedItem || !reviewNotes.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await revisionMutation.mutateAsync({
      id: selectedItem.id,
      reviewerNotes: reviewNotes,
    });
    setShowReviewModal(false);
    setSelectedItem(null);
    setReviewNotes("");
    queueQuery.refetch();
    statsQuery.refetch();
  }, [selectedItem, reviewNotes]);

  const handleAIValidate = useCallback(async () => {
    if (!selectedItem) return;
    const result = await aiValidateMutation.mutateAsync({
      content: selectedItem.content,
      language: "portuguese",
      dialect: selectedItem.dialect || "Brazilian",
    });
    setReviewNotes(
      `AI Validation (${result.confidence}% confidence):\n${result.overallFeedback}\n\nIssues:\n${
        result.issues?.map((i: any) => `- [${i.severity}] ${i.description}`).join("\n") || "None found"
      }`
    );
  }, [selectedItem]);

  const openReview = (item: any) => {
    setSelectedItem(item);
    setReviewNotes("");
    setShowReviewModal(true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
      onPress={() => openReview(item)}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status as ReviewStatus] }]} />
        <Text style={styles.cardType}>{item.contentType}</Text>
        <Text style={styles.cardDialect}>{item.dialect || "Brazilian"}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      {item.sourceCreator && (
        <Text style={styles.cardCreator}>via {item.sourceCreator}</Text>
      )}
      <Text style={styles.cardDate}>
        {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </Pressable>
  );

  return (
    <ScreenContainer className="p-0">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Content Review</Text>
          <Text style={styles.headerSubtitle}>Portuguese Lessons</Text>
        </View>
      </View>

      {/* Stats Bar */}
      {statsQuery.data && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#F59E0B" }]}>{statsQuery.data.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#22C55E" }]}>{statsQuery.data.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#EF4444" }]}>{statsQuery.data.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#6C63FF" }]}>{statsQuery.data.needsRevision}</Text>
            <Text style={styles.statLabel}>Revision</Text>
          </View>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["pending_review", "approved", "rejected", "needs_revision"] as ReviewStatus[]).map((status) => (
          <Pressable
            key={status}
            style={({ pressed }) => [
              styles.filterTab,
              activeFilter === status && styles.filterTabActive,
              pressed && { opacity: 0.8 },
            ]}
            onPress={() => setActiveFilter(activeFilter === status ? undefined : status)}
          >
            <Text style={[styles.filterTabText, activeFilter === status && styles.filterTabTextActive]}>
              {STATUS_LABELS[status]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content List */}
      {queueQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
        </View>
      ) : (
        <FlatList
          data={queueQuery.data?.items || []}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>No items in queue</Text>
              <Text style={styles.emptySubtext}>
                {activeFilter ? `No ${STATUS_LABELS[activeFilter].toLowerCase()} content` : "Queue is empty"}
              </Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Review Content</Text>
              <Pressable
                style={({ pressed }) => [pressed && { opacity: 0.7 }]}
                onPress={() => setShowReviewModal(false)}
              >
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            {selectedItem && (
              <>
                <View style={styles.modalMeta}>
                  <Text style={styles.modalMetaLabel}>Type:</Text>
                  <Text style={styles.modalMetaValue}>{selectedItem.contentType}</Text>
                  <Text style={styles.modalMetaLabel}>Creator:</Text>
                  <Text style={styles.modalMetaValue}>{selectedItem.sourceCreator || "System"}</Text>
                </View>

                <Text style={styles.modalItemTitle}>{selectedItem.title}</Text>

                {/* Content Preview */}
                <View style={styles.contentPreview}>
                  <Text style={styles.contentPreviewText} numberOfLines={8}>
                    {typeof selectedItem.content === "string"
                      ? selectedItem.content
                      : JSON.stringify(selectedItem.content, null, 2)}
                  </Text>
                </View>

                {/* AI Validate Button */}
                <Pressable
                  style={({ pressed }) => [styles.aiValidateBtn, pressed && { opacity: 0.8 }]}
                  onPress={handleAIValidate}
                >
                  <Text style={styles.aiValidateBtnText}>
                    {aiValidateMutation.isPending ? "Validating..." : "🤖 AI Pre-Validate"}
                  </Text>
                </Pressable>

                {/* Review Notes Input */}
                <TextInput
                  style={styles.notesInput}
                  placeholder="Reviewer notes (required for reject/revision)..."
                  placeholderTextColor="#6B7280"
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  numberOfLines={4}
                />

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <Pressable
                    style={({ pressed }) => [styles.approveBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                    onPress={handleApprove}
                  >
                    <Text style={styles.actionBtnText}>✓ Approve</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.revisionBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                    onPress={handleRequestRevision}
                  >
                    <Text style={styles.actionBtnText}>↻ Revision</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.rejectBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
                    onPress={handleReject}
                  >
                    <Text style={styles.actionBtnText}>✕ Reject</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
  },
  backBtn: { padding: 8 },
  backBtnText: { fontSize: 24, color: "#FFFFFF" },
  headerCenter: { marginLeft: 12 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 13, color: "#9CA3AF" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#1A1A2E",
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A4A",
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1A1A2E",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  filterTabActive: { borderColor: "#6C63FF", backgroundColor: "#2A2A4A" },
  filterTabText: { fontSize: 12, color: "#6B7280" },
  filterTabTextActive: { color: "#FFFFFF", fontWeight: "600" },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#1A1A2E",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  cardType: { fontSize: 12, color: "#9CA3AF", textTransform: "uppercase", fontWeight: "600" },
  cardDialect: { fontSize: 11, color: "#6C63FF", marginLeft: "auto" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 4 },
  cardCreator: { fontSize: 12, color: "#8B83FF" },
  cardDate: { fontSize: 11, color: "#6B7280", marginTop: 4 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyContainer: { alignItems: "center", padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#FFFFFF" },
  emptySubtext: { fontSize: 14, color: "#9CA3AF", marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0F0F1E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  modalClose: { fontSize: 24, color: "#9CA3AF", padding: 4 },
  modalMeta: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  modalMetaLabel: { fontSize: 12, color: "#6B7280" },
  modalMetaValue: { fontSize: 12, color: "#FFFFFF", fontWeight: "500", marginRight: 12 },
  modalItemTitle: { fontSize: 18, fontWeight: "600", color: "#FFFFFF", marginBottom: 12 },
  contentPreview: {
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    maxHeight: 150,
  },
  contentPreviewText: { fontSize: 12, color: "#D1D5DB", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  aiValidateBtn: {
    backgroundColor: "#2A2A4A",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#6C63FF40",
  },
  aiValidateBtnText: { fontSize: 14, color: "#8B83FF", fontWeight: "600" },
  notesInput: {
    backgroundColor: "#1A1A2E",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    marginBottom: 16,
  },
  actionRow: { flexDirection: "row", gap: 8 },
  approveBtn: {
    flex: 1,
    backgroundColor: "#22C55E",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  revisionBtn: {
    flex: 1,
    backgroundColor: "#6C63FF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "#EF4444",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  actionBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
