import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Share, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";

const Colors = {
  primary: "#0A0E1A",
  surface: "#141825",
  secondary: "#00AAFF",
  textPrimary: "#FFFFFF",
  textSecondary: "#8A9BB0",
  textMuted: "#5A6A7A",
  border: "rgba(255,255,255,0.06)",
  gold: "#FFD700",
  success: "#00E676",
  glow: "#00CCFF",
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string;
  icon: string;
  color: string;
  verified: boolean;
  language: string;
  type: "language" | "professional" | "academic";
  credentialId: string;
  skills: string[];
}

const ALL_CERTIFICATES: Certificate[] = [
  {
    id: "1",
    title: "Spanish B2 Professional",
    issuer: "ConnectWorld AI",
    date: "May 2026",
    icon: "ribbon",
    color: Colors.gold,
    verified: true,
    language: "Spanish",
    type: "language",
    credentialId: "CM-SP-B2-2026-0451",
    skills: ["Business Spanish", "Professional Communication", "Technical Vocabulary"],
  },
  {
    id: "2",
    title: "Microsoft Purview SC-400 (Spanish)",
    issuer: "ConnectWorld AI + Microsoft",
    date: "Apr 2026",
    icon: "shield-checkmark",
    color: Colors.secondary,
    verified: true,
    language: "Spanish",
    type: "professional",
    credentialId: "CM-MS-SC400-2026-0312",
    skills: ["Information Protection", "Data Loss Prevention", "Information Governance"],
  },
  {
    id: "3",
    title: "French A2 Conversational",
    issuer: "ConnectWorld AI",
    date: "Mar 2026",
    icon: "ribbon",
    color: Colors.glow,
    verified: true,
    language: "French",
    type: "language",
    credentialId: "CM-FR-A2-2026-0289",
    skills: ["Conversational French", "Travel Phrases", "Basic Grammar"],
  },
  {
    id: "4",
    title: "Portuguese A1 Foundations",
    issuer: "ConnectWorld AI",
    date: "Feb 2026",
    icon: "ribbon",
    color: "#FF6B6B",
    verified: true,
    language: "Portuguese",
    type: "language",
    credentialId: "CM-PT-A1-2026-0198",
    skills: ["Basic Greetings", "Numbers & Dates", "Simple Sentences"],
  },
  {
    id: "5",
    title: "Cross-Cultural Communication",
    issuer: "ConnectWorld AI Academy",
    date: "Jan 2026",
    icon: "globe",
    color: "#9B59B6",
    verified: true,
    language: "Multi",
    type: "academic",
    credentialId: "CM-CC-ADV-2026-0145",
    skills: ["Cultural Awareness", "Business Etiquette", "Global Teamwork"],
  },
  {
    id: "6",
    title: "Spanish B1 Intermediate",
    issuer: "ConnectWorld AI",
    date: "Dec 2025",
    icon: "ribbon",
    color: Colors.gold,
    verified: true,
    language: "Spanish",
    type: "language",
    credentialId: "CM-SP-B1-2025-0892",
    skills: ["Intermediate Grammar", "Reading Comprehension", "Oral Expression"],
  },
];

const FILTER_OPTIONS = ["All", "Language", "Professional", "Academic"];

export default function MyCertificatesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [autoCerts, setAutoCerts] = useState<Certificate[]>([]);
  const generatePdf = trpc.certificate.generatePdf.useMutation();

  useEffect(() => {
    AsyncStorage.getItem("@connectworld_auto_certificates").then((stored) => {
      if (stored) {
        const parsed = JSON.parse(stored);
        setAutoCerts(parsed);
      }
    }).catch(() => {});
  }, []);

  const handleDownload = async (cert: Certificate) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDownloadingId(cert.id);
    try {
      const result = await generatePdf.mutateAsync({
        userName: "Alex Rivera",
        courseName: cert.title,
        completionDate: cert.date,
        credentialId: cert.credentialId,
        issuer: cert.issuer,
      });
      // Open the generated certificate in browser
      if (result.url) {
        await WebBrowser.openBrowserAsync(result.url);
      }
    } catch (e: any) {
      Alert.alert("Download Error", "Could not generate certificate. Please try again later.");
    } finally {
      setDownloadingId(null);
    }
  };

  const allCerts = [...autoCerts, ...ALL_CERTIFICATES];
  const filteredCerts = activeFilter === "All"
    ? allCerts
    : allCerts.filter((c) => c.type === activeFilter.toLowerCase());

  const handleShare = async (cert: Certificate) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `🎓 I earned the "${cert.title}" certification from ${cert.issuer}!\n\nCredential ID: ${cert.credentialId}\nVerified ✓\n\n#LinguaVibe #ConnectWorldAI #LanguageLearning`,
        title: `Certificate: ${cert.title}`,
      });
    } catch (e) {
      // User cancelled
    }
  };

  const handleLinkedIn = (cert: Certificate) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // In production, this would deep-link to LinkedIn's add certification flow
    Share.share({
      message: `I just earned my "${cert.title}" certification from ${cert.issuer}! 🎓\n\nCredential ID: ${cert.credentialId}\n\nAdd to your LinkedIn profile → linkedin.com/in/me\n\n#CareerGrowth #BilingualProfessional`,
      title: "Share to LinkedIn",
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Certificates</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Stats Banner */}
      <View style={styles.statsBanner}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{ALL_CERTIFICATES.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{ALL_CERTIFICATES.filter((c) => c.verified).length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{new Set(ALL_CERTIFICATES.map((c) => c.language)).size}</Text>
          <Text style={styles.statLabel}>Languages</Text>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {FILTER_OPTIONS.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter(filter);
            }}
          >
            <Text style={[styles.filterChipText, activeFilter === filter && styles.filterChipTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Certificates List */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {filteredCerts.map((cert) => (
          <View key={cert.id} style={styles.certCard}>
            {/* Card Header */}
            <View style={styles.certCardHeader}>
              <View style={[styles.certIconWrap, { backgroundColor: `${cert.color}20` }]}>
                <Ionicons name={cert.icon as any} size={24} color={cert.color} />
              </View>
              <View style={styles.certCardHeaderInfo}>
                <Text style={styles.certCardTitle}>{cert.title}</Text>
                <Text style={styles.certCardIssuer}>{cert.issuer}</Text>
                <Text style={styles.certCardDate}>Issued {cert.date}</Text>
              </View>
              {cert.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            {/* Credential ID */}
            <View style={styles.credentialRow}>
              <Ionicons name="key-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.credentialId}>{cert.credentialId}</Text>
            </View>

            {/* Skills */}
            <View style={styles.skillsRow}>
              {cert.skills.map((skill, idx) => (
                <View key={idx} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))}
            </View>

            {/* Actions */}
            <View style={styles.certActions}>
              <TouchableOpacity style={styles.shareBtn} onPress={() => handleShare(cert)}>
                <Ionicons name="share-outline" size={16} color={Colors.secondary} />
                <Text style={styles.shareBtnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkedInBtn} onPress={() => handleLinkedIn(cert)}>
                <Ionicons name="logo-linkedin" size={16} color="#0A66C2" />
                <Text style={styles.linkedInBtnText}>Add to LinkedIn</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(cert)}>
                {downloadingId === cert.id ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <Ionicons name="download-outline" size={16} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredCerts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="ribbon-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No certificates in this category</Text>
            <Text style={styles.emptySubtitle}>Complete courses to earn certificates</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.textPrimary },
  statsBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  statItem: { alignItems: "center", flex: 1 },
  statNumber: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  filterRow: { marginTop: 16, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  filterChipText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  filterChipTextActive: { color: "#FFFFFF" },
  certCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  certCardHeader: { flexDirection: "row", alignItems: "flex-start" },
  certIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  certCardHeaderInfo: { flex: 1, marginLeft: 12 },
  certCardTitle: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  certCardIssuer: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  certCardDate: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,230,118,0.1)",
  },
  verifiedText: { fontSize: 11, fontWeight: "600", color: Colors.success },
  credentialRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  credentialId: { fontSize: 12, color: Colors.textMuted, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  skillChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  skillChipText: { fontSize: 11, color: Colors.secondary, fontWeight: "600" },
  certActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.glowSubtle,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  shareBtnText: { fontSize: 12, fontWeight: "600", color: Colors.secondary },
  linkedInBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(10,102,194,0.1)",
    borderWidth: 1,
    borderColor: "rgba(10,102,194,0.3)",
  },
  linkedInBtnText: { fontSize: 12, fontWeight: "600", color: "#0A66C2" },
  downloadBtn: {
    marginLeft: "auto",
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: Colors.textSecondary, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
});
