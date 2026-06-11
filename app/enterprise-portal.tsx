import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

type PlanTier = {
  id: string;
  name: string;
  seats: string;
  price: string;
  features: string[];
  popular: boolean;
  color: string;
};

const TIERS: PlanTier[] = [
  { id: "1", name: "Starter", seats: "5-25 seats", price: "$12/seat/mo", features: ["Core lessons", "Progress tracking", "Email support", "Basic analytics"], popular: false, color: "#3B82F6" },
  { id: "2", name: "Business", seats: "25-100 seats", price: "$9/seat/mo", features: ["Everything in Starter", "Custom curriculum", "Admin dashboard", "Priority support", "SSO integration", "Technical vocabulary packs"], popular: true, color: "#A855F7" },
  { id: "3", name: "Enterprise", seats: "100+ seats", price: "Custom", features: ["Everything in Business", "Dedicated account manager", "Custom AI training", "API access", "White-label option", "On-site workshops", "SLA guarantee"], popular: false, color: "#F59E0B" },
];

export default function EnterprisePortalScreen() {
  const colors = useColors();
  const [selectedTier, setSelectedTier] = useState<string | null>("2");
  const [formData, setFormData] = useState({ company: "", email: "", seats: "", industry: "" });

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Enterprise</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🏢</Text>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>ConnectWorld AI for Teams</Text>
          <Text style={[styles.heroDesc, { color: colors.muted }]}>
            Equip your team with language skills for global business. Custom curricula, technical vocabulary, and admin analytics.
          </Text>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>500+</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Companies</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>50K+</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Learners</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>40+</Text>
            <Text style={[styles.statLabel, { color: colors.muted }]}>Languages</Text>
          </View>
        </View>

        {/* Plans */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a Plan</Text>
        {TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.id}
            style={[styles.tierCard, {
              backgroundColor: colors.surface,
              borderColor: selectedTier === tier.id ? tier.color : colors.border,
              borderWidth: selectedTier === tier.id ? 2 : 1,
            }]}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTier(tier.id);
            }}
          >
            {tier.popular && (
              <View style={[styles.popularBadge, { backgroundColor: tier.color }]}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.tierHeader}>
              <View>
                <Text style={[styles.tierName, { color: colors.foreground }]}>{tier.name}</Text>
                <Text style={[styles.tierSeats, { color: colors.muted }]}>{tier.seats}</Text>
              </View>
              <Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
            </View>
            <View style={styles.tierFeatures}>
              {tier.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={14} color={tier.color} />
                  <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {/* Contact Form */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Get Started</Text>
          <Text style={[styles.formDesc, { color: colors.muted }]}>Fill in your details and we'll set up a demo</Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Company Name"
            placeholderTextColor={colors.muted}
            value={formData.company}
            onChangeText={(v) => setFormData((p) => ({ ...p, company: v }))}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Work Email"
            placeholderTextColor={colors.muted}
            value={formData.email}
            onChangeText={(v) => setFormData((p) => ({ ...p, email: v }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Number of Seats"
            placeholderTextColor={colors.muted}
            value={formData.seats}
            onChangeText={(v) => setFormData((p) => ({ ...p, seats: v }))}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Industry (e.g., IT, Healthcare, Finance)"
            placeholderTextColor={colors.muted}
            value={formData.industry}
            onChangeText={(v) => setFormData((p) => ({ ...p, industry: v }))}
          />

          <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.submitBtnText}>Request Demo</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Employer / Recruiter Portal */}
        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recruiter Tools</Text>
          <TouchableOpacity
            style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingVertical: 16 }]}
            activeOpacity={0.7}
            onPress={() => router.push("/employer-portal" as any)}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#00FF8820", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <Ionicons name="briefcase" size={22} color="#00FF88" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>Employer Portal</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Post jobs, search bilingual candidates, hire verified talent</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: "row", alignItems: "center", paddingVertical: 16, marginTop: 10 }]}
            activeOpacity={0.7}
            onPress={() => router.push("/interview-detection" as any)}
          >
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FF444420", alignItems: "center", justifyContent: "center", marginRight: 14 }}>
              <Ionicons name="shield-checkmark" size={22} color="#FF4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: "700" }}>Hire Real™</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>AI detection for live interviews — verify candidates are real</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Trusted By */}
        <View style={styles.trustedSection}>
          <Text style={[styles.trustedTitle, { color: colors.muted }]}>Trusted by teams at</Text>
          <View style={styles.trustedLogos}>
            {["🏦 Finance Corp", "💻 TechStart", "🏥 HealthNet", "🎓 EduGlobal"].map((company, i) => (
              <View key={i} style={[styles.trustedLogo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.trustedLogoText, { color: colors.muted }]}>{company}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5 },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  hero: { alignItems: "center", marginBottom: 20 },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  heroDesc: { fontSize: 13, textAlign: "center", lineHeight: 20, marginTop: 6 },
  statsRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingVertical: 14, borderTopWidth: 0.5, borderBottomWidth: 0.5, marginBottom: 20 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  tierCard: { padding: 16, borderRadius: 14, marginBottom: 12, position: "relative" },
  popularBadge: { position: "absolute", top: -8, right: 12, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  popularText: { fontSize: 10, fontWeight: "800", color: "#FFF" },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  tierName: { fontSize: 16, fontWeight: "800" },
  tierSeats: { fontSize: 12, marginTop: 2 },
  tierPrice: { fontSize: 16, fontWeight: "800" },
  tierFeatures: { gap: 6 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13 },
  formCard: { padding: 16, borderRadius: 14, borderWidth: 1, marginTop: 8, marginBottom: 20 },
  formTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  formDesc: { fontSize: 12, marginBottom: 14 },
  input: { height: 44, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, marginBottom: 10 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 10, marginTop: 4 },
  submitBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  trustedSection: { alignItems: "center" },
  trustedTitle: { fontSize: 12, marginBottom: 10 },
  trustedLogos: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 },
  trustedLogo: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  trustedLogoText: { fontSize: 11, fontWeight: "600" },
});
