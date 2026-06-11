/**
 * Creator Studio Upload Flow
 * Multi-step wizard for content creators to upload videos/songs/podcasts for translation.
 * Steps: Select Type → Upload File → Add Metadata → Choose Languages → Confirm & Submit
 */
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";

const Colors = {
  bg: "#0A0E1A",
  card: "#141B2D",
  cardBorder: "#1E293B",
  text: "#FFFFFF",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  primary: "#00AAFF",
  warning: "#F59E0B",
  success: "#10B981",
  error: "#EF4444",
  purple: "#8B5CF6",
  gold: "#FFD700",
  pink: "#EC4899",
  teal: "#14B8A6",
};

type ContentType = "video" | "song" | "podcast" | "social" | "document";

interface ContentTypeOption {
  type: ContentType;
  label: string;
  icon: string;
  description: string;
  formats: string;
  maxSize: string;
  pricePerMin: number;
}

const CONTENT_TYPES: ContentTypeOption[] = [
  { type: "video", label: "Video", icon: "videocam", description: "YouTube, TikTok, Reels, courses", formats: "MP4, MOV, WebM", maxSize: "2GB", pricePerMin: 2.50 },
  { type: "song", label: "Song / Music", icon: "musical-notes", description: "Songs, albums, music videos", formats: "MP3, WAV, FLAC, M4A", maxSize: "500MB", pricePerMin: 3.00 },
  { type: "podcast", label: "Podcast", icon: "mic", description: "Episodes, interviews, audiobooks", formats: "MP3, WAV, M4A", maxSize: "1GB", pricePerMin: 1.75 },
  { type: "social", label: "Social Media", icon: "share-social", description: "Captions, stories, posts", formats: "TXT, SRT, VTT", maxSize: "50MB", pricePerMin: 0.50 },
  { type: "document", label: "Document", icon: "document-text", description: "Articles, scripts, subtitles", formats: "PDF, DOCX, TXT, SRT", maxSize: "100MB", pricePerMin: 0.75 },
];

const LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸", dialects: ["Mexico", "Dominican", "Colombian", "Argentine"] },
  { code: "fr", name: "French", flag: "🇫🇷", dialects: ["France", "Canadian", "West African"] },
  { code: "pt", name: "Portuguese", flag: "🇧🇷", dialects: ["Brazilian", "European"] },
  { code: "de", name: "German", flag: "🇩🇪", dialects: ["Standard", "Austrian", "Swiss"] },
  { code: "ja", name: "Japanese", flag: "🇯🇵", dialects: ["Standard"] },
  { code: "ko", name: "Korean", flag: "🇰🇷", dialects: ["Standard"] },
  { code: "zh", name: "Chinese", flag: "🇨🇳", dialects: ["Mandarin", "Cantonese"] },
  { code: "ar", name: "Arabic", flag: "🇸🇦", dialects: ["MSA", "Egyptian", "Levantine"] },
  { code: "hi", name: "Hindi", flag: "🇮🇳", dialects: ["Standard"] },
  { code: "it", name: "Italian", flag: "🇮🇹", dialects: ["Standard"] },
  { code: "ru", name: "Russian", flag: "🇷🇺", dialects: ["Standard"] },
  { code: "sw", name: "Swahili", flag: "🇰🇪", dialects: ["Standard"] },
];

const GENRES = ["Pop", "Hip-Hop", "R&B", "Reggaeton", "Rock", "Electronic", "Jazz", "Classical", "Folk", "Gospel", "Afrobeats", "K-Pop", "Latin", "Other"];

export default function CreatorUploadScreen() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ContentTypeOption | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; duration: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [metadata, setMetadata] = useState({ title: "", description: "", genre: "", originalLanguage: "English" });
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const totalSteps = 5;

  const handleSelectType = (type: ContentTypeOption) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedType(type);
    setStep(2);
  };

  const handleUpload = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsUploading(true);
    setUploadProgress(0);
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadedFile({ name: "my_content_file." + (selectedType?.type === "video" ? "mp4" : "mp3"), size: "48.2 MB", duration: "3:42" });
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  const handleToggleLanguage = (code: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmitOrder = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderComplete(true);
    }, 2500);
  };

  const estimatedCost = selectedType && uploadedFile
    ? (selectedType.pricePerMin * 3.7 * selectedLanguages.length).toFixed(2)
    : "0.00";

  const estimatedDelivery = selectedLanguages.length <= 2 ? "24-48 hours" : selectedLanguages.length <= 5 ? "3-5 days" : "5-7 days";

  // Order complete screen
  if (orderComplete) {
    return (
      <ScreenContainer edges={["top", "left", "right"]}>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.completeContainer}>
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
            </View>
            <Text style={styles.completeTitle}>Order Submitted!</Text>
            <Text style={styles.completeSubtitle}>Your content is being processed for translation.</Text>

            <View style={styles.orderSummaryCard}>
              <Text style={styles.orderSummaryTitle}>Order Summary</Text>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Tracking ID</Text>
                <Text style={styles.orderValue}>#CRT-{Date.now().toString().slice(-6)}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Content</Text>
                <Text style={styles.orderValue}>{metadata.title || "Untitled"}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Type</Text>
                <Text style={styles.orderValue}>{selectedType?.label}</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Languages</Text>
                <Text style={styles.orderValue}>{selectedLanguages.length} languages</Text>
              </View>
              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>Est. Delivery</Text>
                <Text style={styles.orderValue}>{estimatedDelivery}</Text>
              </View>
              <View style={[styles.orderRow, styles.orderTotal]}>
                <Text style={styles.orderTotalLabel}>Total</Text>
                <Text style={styles.orderTotalValue}>${estimatedCost}</Text>
              </View>
            </View>

            <Text style={styles.completeNote}>You'll receive a notification when your translations are ready. Track progress in Creator Studio.</Text>

            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
              <Text style={styles.doneBtnText}>Back to Creator Studio</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? setStep(step - 1) : router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upload Content</Text>
          <Text style={styles.stepIndicator}>{step}/{totalSteps}</Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / totalSteps) * 100}%` }]} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Step 1: Select Content Type */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>What are you translating?</Text>
              <Text style={styles.stepSubtitle}>Select the type of content you want to translate</Text>
              {CONTENT_TYPES.map((ct) => (
                <TouchableOpacity
                  key={ct.type}
                  style={[styles.typeCard, selectedType?.type === ct.type && styles.typeCardSelected]}
                  onPress={() => handleSelectType(ct)}
                  activeOpacity={0.7}
                >
                  <View style={styles.typeCardIcon}>
                    <Ionicons name={ct.icon as any} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.typeCardContent}>
                    <Text style={styles.typeCardLabel}>{ct.label}</Text>
                    <Text style={styles.typeCardDesc}>{ct.description}</Text>
                    <View style={styles.typeCardMeta}>
                      <Text style={styles.typeCardFormat}>{ct.formats}</Text>
                      <Text style={styles.typeCardSize}>Max: {ct.maxSize}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Step 2: Upload File */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload your {selectedType?.label.toLowerCase()}</Text>
              <Text style={styles.stepSubtitle}>Supported: {selectedType?.formats} (max {selectedType?.maxSize})</Text>

              {!uploadedFile && !isUploading && (
                <TouchableOpacity style={styles.uploadZone} onPress={handleUpload}>
                  <Ionicons name="cloud-upload" size={48} color={Colors.primary} />
                  <Text style={styles.uploadZoneTitle}>Tap to Upload</Text>
                  <Text style={styles.uploadZoneSubtitle}>or drag and drop your file here</Text>
                </TouchableOpacity>
              )}

              {isUploading && (
                <View style={styles.uploadingCard}>
                  <Ionicons name="cloud-upload" size={32} color={Colors.primary} />
                  <Text style={styles.uploadingText}>Uploading...</Text>
                  <View style={styles.uploadProgressBar}>
                    <View style={[styles.uploadProgressFill, { width: `${Math.min(uploadProgress, 100)}%` }]} />
                  </View>
                  <Text style={styles.uploadProgressText}>{Math.min(Math.round(uploadProgress), 100)}%</Text>
                </View>
              )}

              {uploadedFile && (
                <View style={styles.uploadedCard}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                  <View style={styles.uploadedInfo}>
                    <Text style={styles.uploadedName}>{uploadedFile.name}</Text>
                    <Text style={styles.uploadedMeta}>{uploadedFile.size} • {uploadedFile.duration}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setUploadedFile(null); setUploadProgress(0); }}>
                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              )}

              {uploadedFile && (
                <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
                  <Text style={styles.nextBtnText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Step 3: Metadata */}
          {step === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Content Details</Text>
              <Text style={styles.stepSubtitle}>Help us understand your content for better translation</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter content title..."
                  placeholderTextColor={Colors.textMuted}
                  value={metadata.title}
                  onChangeText={(t) => setMetadata({ ...metadata, title: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Brief description of your content..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={metadata.description}
                  onChangeText={(t) => setMetadata({ ...metadata, description: t })}
                  textAlignVertical="top"
                />
              </View>

              {(selectedType?.type === "song" || selectedType?.type === "video") && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Genre</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.genreRow}>
                      {GENRES.map((g) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.genreChip, metadata.genre === g && styles.genreChipActive]}
                          onPress={() => setMetadata({ ...metadata, genre: g })}
                        >
                          <Text style={[styles.genreChipText, metadata.genre === g && styles.genreChipTextActive]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Original Language</Text>
                <View style={styles.originalLangBadge}>
                  <Text style={styles.originalLangText}>{metadata.originalLanguage}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(4)}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Step 4: Choose Languages */}
          {step === 4 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Target Languages</Text>
              <Text style={styles.stepSubtitle}>Select languages to translate your content into</Text>

              <View style={styles.langGrid}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[styles.langCard, selectedLanguages.includes(lang.code) && styles.langCardSelected]}
                    onPress={() => handleToggleLanguage(lang.code)}
                  >
                    <Text style={styles.langFlag}>{lang.flag}</Text>
                    <Text style={styles.langName}>{lang.name}</Text>
                    <Text style={styles.langDialects}>{lang.dialects.length} dialect{lang.dialects.length > 1 ? "s" : ""}</Text>
                    {selectedLanguages.includes(lang.code) && (
                      <View style={styles.langCheck}>
                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {selectedLanguages.length > 0 && (
                <View style={styles.langSummary}>
                  <Text style={styles.langSummaryText}>{selectedLanguages.length} language{selectedLanguages.length > 1 ? "s" : ""} selected</Text>
                  <Text style={styles.langEstimate}>Est. ${estimatedCost} • {estimatedDelivery}</Text>
                </View>
              )}

              {selectedLanguages.length > 0 && (
                <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(5)}>
                  <Text style={styles.nextBtnText}>Review Order</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Review & Confirm</Text>
              <Text style={styles.stepSubtitle}>Make sure everything looks good before submitting</Text>

              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Ionicons name={selectedType?.icon as any} size={18} color={Colors.primary} />
                  <Text style={styles.reviewLabel}>Type</Text>
                  <Text style={styles.reviewValue}>{selectedType?.label}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Ionicons name="document" size={18} color={Colors.primary} />
                  <Text style={styles.reviewLabel}>File</Text>
                  <Text style={styles.reviewValue}>{uploadedFile?.name}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Ionicons name="text" size={18} color={Colors.primary} />
                  <Text style={styles.reviewLabel}>Title</Text>
                  <Text style={styles.reviewValue}>{metadata.title || "Untitled"}</Text>
                </View>
                {metadata.genre && (
                  <View style={styles.reviewRow}>
                    <Ionicons name="musical-note" size={18} color={Colors.primary} />
                    <Text style={styles.reviewLabel}>Genre</Text>
                    <Text style={styles.reviewValue}>{metadata.genre}</Text>
                  </View>
                )}
                <View style={styles.reviewRow}>
                  <Ionicons name="globe" size={18} color={Colors.primary} />
                  <Text style={styles.reviewLabel}>Languages</Text>
                  <Text style={styles.reviewValue}>{selectedLanguages.length} languages</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Ionicons name="time" size={18} color={Colors.primary} />
                  <Text style={styles.reviewLabel}>Delivery</Text>
                  <Text style={styles.reviewValue}>{estimatedDelivery}</Text>
                </View>
                <View style={[styles.reviewRow, styles.reviewTotal]}>
                  <Ionicons name="card" size={18} color={Colors.gold} />
                  <Text style={styles.reviewTotalLabel}>Total Cost</Text>
                  <Text style={styles.reviewTotalValue}>${estimatedCost}</Text>
                </View>
              </View>

              <View style={styles.disclaimerCard}>
                <Ionicons name="information-circle" size={16} color={Colors.textMuted} />
                <Text style={styles.disclaimerText}>
                  Translation quality is AI-powered with human review for premium content. You retain full ownership of translated content.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitOrderBtn, isSubmitting && styles.submitOrderBtnDisabled]}
                onPress={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Text style={styles.submitOrderBtnText}>Processing...</Text>
                ) : (
                  <>
                    <Ionicons name="rocket" size={20} color="#FFFFFF" />
                    <Text style={styles.submitOrderBtnText}>Submit Translation Order</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.card, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  stepIndicator: { fontSize: 13, color: Colors.textMuted, fontWeight: "600" },
  progressBar: { height: 3, backgroundColor: Colors.cardBorder, marginHorizontal: 16, borderRadius: 2, marginBottom: 16 },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 2 },
  stepContent: { paddingHorizontal: 16 },
  stepTitle: { fontSize: 20, fontWeight: "800", color: Colors.text, marginBottom: 6 },
  stepSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: 20 },
  // Step 1: Type selection
  typeCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.cardBorder },
  typeCardSelected: { borderColor: Colors.primary },
  typeCardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + "15", alignItems: "center", justifyContent: "center", marginRight: 12 },
  typeCardContent: { flex: 1 },
  typeCardLabel: { fontSize: 14, fontWeight: "700", color: Colors.text },
  typeCardDesc: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  typeCardMeta: { flexDirection: "row", gap: 10, marginTop: 4 },
  typeCardFormat: { fontSize: 10, color: Colors.textMuted },
  typeCardSize: { fontSize: 10, color: Colors.textMuted },
  // Step 2: Upload
  uploadZone: { alignItems: "center", justifyContent: "center", backgroundColor: Colors.card, borderRadius: 16, borderWidth: 2, borderColor: Colors.primary + "40", borderStyle: "dashed", padding: 40, marginTop: 10, gap: 8 },
  uploadZoneTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  uploadZoneSubtitle: { fontSize: 12, color: Colors.textMuted },
  uploadingCard: { alignItems: "center", backgroundColor: Colors.card, borderRadius: 16, padding: 30, gap: 12, borderWidth: 1, borderColor: Colors.cardBorder },
  uploadingText: { fontSize: 14, color: Colors.text, fontWeight: "600" },
  uploadProgressBar: { width: "100%", height: 6, backgroundColor: Colors.bg, borderRadius: 3, overflow: "hidden" },
  uploadProgressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 3 },
  uploadProgressText: { fontSize: 12, color: Colors.textMuted },
  uploadedCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: Colors.success + "40" },
  uploadedInfo: { flex: 1 },
  uploadedName: { fontSize: 13, fontWeight: "600", color: Colors.text },
  uploadedMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  // Step 3: Metadata
  inputGroup: { marginBottom: 18 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: Colors.textSecondary, marginBottom: 6 },
  textInput: { backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, padding: 12, fontSize: 14, color: Colors.text },
  textArea: { minHeight: 80 },
  genreRow: { flexDirection: "row", gap: 8 },
  genreChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  genreChipActive: { backgroundColor: Colors.primary + "20", borderColor: Colors.primary },
  genreChipText: { fontSize: 12, color: Colors.textSecondary },
  genreChipTextActive: { color: Colors.primary, fontWeight: "600" },
  originalLangBadge: { backgroundColor: Colors.card, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: Colors.cardBorder, alignSelf: "flex-start" },
  originalLangText: { fontSize: 13, color: Colors.text, fontWeight: "500" },
  // Step 4: Languages
  langGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  langCard: { width: "47%", backgroundColor: Colors.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.cardBorder, alignItems: "center", gap: 4, position: "relative" },
  langCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + "08" },
  langFlag: { fontSize: 24 },
  langName: { fontSize: 12, fontWeight: "600", color: Colors.text },
  langDialects: { fontSize: 10, color: Colors.textMuted },
  langCheck: { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: "center", justifyContent: "center" },
  langSummary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginTop: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  langSummaryText: { fontSize: 13, color: Colors.text, fontWeight: "600" },
  langEstimate: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  // Step 5: Review
  reviewCard: { backgroundColor: Colors.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 16 },
  reviewRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  reviewLabel: { fontSize: 12, color: Colors.textMuted, width: 70 },
  reviewValue: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: "500", textAlign: "right" },
  reviewTotal: { borderBottomWidth: 0, marginTop: 4 },
  reviewTotalLabel: { fontSize: 13, color: Colors.gold, fontWeight: "700", flex: 1 },
  reviewTotalValue: { fontSize: 18, color: Colors.gold, fontWeight: "800" },
  disclaimerCard: { flexDirection: "row", gap: 8, backgroundColor: Colors.card, borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder },
  disclaimerText: { flex: 1, fontSize: 11, color: Colors.textMuted, lineHeight: 16 },
  submitOrderBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.success, borderRadius: 14, padding: 16 },
  submitOrderBtnDisabled: { opacity: 0.6 },
  submitOrderBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  // Shared
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, borderRadius: 12, padding: 14, marginTop: 20 },
  nextBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  // Complete screen
  completeContainer: { flexGrow: 1, alignItems: "center", paddingHorizontal: 16, paddingTop: 60 },
  completeIcon: { marginBottom: 16 },
  completeTitle: { fontSize: 24, fontWeight: "800", color: Colors.text, marginBottom: 8 },
  completeSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: "center", marginBottom: 24 },
  orderSummaryCard: { width: "100%", backgroundColor: Colors.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: Colors.cardBorder, marginBottom: 20 },
  orderSummaryTitle: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  orderRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  orderLabel: { fontSize: 12, color: Colors.textMuted },
  orderValue: { fontSize: 12, color: Colors.text, fontWeight: "500" },
  orderTotal: { borderBottomWidth: 0, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.primary + "30" },
  orderTotalLabel: { fontSize: 14, color: Colors.gold, fontWeight: "700" },
  orderTotalValue: { fontSize: 18, color: Colors.gold, fontWeight: "800" },
  completeNote: { fontSize: 12, color: Colors.textMuted, textAlign: "center", marginBottom: 24, paddingHorizontal: 20 },
  doneBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  doneBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
