import { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import * as Haptics from "expo-haptics";
import { vanillaClient } from "@/lib/trpc";

interface AffiliateApplication {
  fullName: string;
  email: string;
  tiktokHandle: string;
  instagramHandle: string;
  youtubeChannel: string;
  followerCount: string;
  languagesSpoken: string;
  languagesTaught: string;
  contentNiche: string;
  whyJoin: string;
  referralCode: string;
}

const COMMISSION_TIERS = [
  {
    tier: "Tier 1 — Direct Affiliate",
    commission: "20%",
    desc: "Earn 20% commission on every paid subscription from users who sign up with your referral code or link.",
    icon: "💰",
  },
  {
    tier: "Tier 2 — Sub-Affiliate",
    commission: "5%",
    desc: "Recruit other creators to the program and earn 5% of their referred users' subscriptions too.",
    icon: "🔗",
  },
];

const BENEFITS = [
  { icon: "🎯", title: "Unique Referral Link & Code", desc: "Get your own trackable link and promo code to share across all platforms" },
  { icon: "📊", title: "Real-Time Dashboard", desc: "Track signups, conversions, and earnings in real-time from your affiliate dashboard" },
  { icon: "💸", title: "Monthly Payouts", desc: "Get paid monthly via Stripe direct deposit — no minimum threshold" },
  { icon: "🎨", title: "Marketing Assets", desc: "Access branded graphics, video templates, and copy for your content" },
  { icon: "📈", title: "Performance Bonuses", desc: "Hit milestones and unlock bonus payouts: 50 signups = $500 bonus, 200 = $2,500" },
  { icon: "🤝", title: "Tier 2 Recruiting", desc: "Build your own team of affiliates and earn passive income from their referrals" },
];

const REQUIREMENTS = [
  "Active social media presence (TikTok, Instagram, or YouTube)",
  "Content related to language learning, travel, culture, or education",
  "Minimum 1,000 followers on at least one platform",
  "Consistent posting schedule (at least 3x/week)",
  "Authentic engagement with your audience",
];

export default function AffiliateSignupScreen() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<AffiliateApplication>({
    fullName: "",
    email: "",
    tiktokHandle: "",
    instagramHandle: "",
    youtubeChannel: "",
    followerCount: "",
    languagesSpoken: "",
    languagesTaught: "",
    contentNiche: "",
    whyJoin: "",
    referralCode: "",
  });

  const updateField = (field: keyof AffiliateApplication, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = useCallback(async () => {
    // Validate required fields
    if (!form.fullName.trim() || !form.email.trim()) {
      Alert.alert("Required Fields", "Please fill in your name and email address.");
      return;
    }
    if (!form.tiktokHandle.trim() && !form.instagramHandle.trim() && !form.youtubeChannel.trim()) {
      Alert.alert("Social Media Required", "Please provide at least one social media handle.");
      return;
    }

    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(true);

    try {
      const result = await vanillaClient.affiliate.submitApplication.mutate({
        name: form.fullName.trim(),
        email: form.email.trim(),
        tiktokHandle: form.tiktokHandle.trim() || undefined,
        instagramHandle: form.instagramHandle.trim() || undefined,
        youtubeHandle: form.youtubeChannel.trim() || undefined,
        followerCount: form.followerCount.trim() || undefined,
        languagesSpoken: form.languagesSpoken.trim() || undefined,
        languagesTaught: form.languagesTaught.trim() || undefined,
        contentNiche: form.contentNiche.trim() || undefined,
        whyJoin: form.whyJoin.trim() || undefined,
        parentReferralCode: form.referralCode.trim() || undefined,
      });

      if (result.success) {
        setSubmitted(true);
      } else {
        Alert.alert("Submission Failed", result.error || "Please try again later.");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [form]);

  if (submitted) {
    return (
      <ScreenContainer className="flex-1 bg-background">
        <ScrollView contentContainerStyle={s.successContainer}>
          <Text style={s.successEmoji}>🎉</Text>
          <Text style={s.successTitle}>Application Submitted!</Text>
          <Text style={s.successDesc}>
            Thank you for applying to the ConnectWorld AI Affiliate Program, {form.fullName.split(" ")[0]}!
          </Text>
          <View style={s.successBox}>
            <Text style={s.successBoxTitle}>What happens next:</Text>
            <Text style={s.successStep}>1. Our team reviews your application (24-48 hours)</Text>
            <Text style={s.successStep}>2. You'll receive an email with your unique referral code and link</Text>
            <Text style={s.successStep}>3. Access your affiliate dashboard to track earnings</Text>
            <Text style={s.successStep}>4. Start sharing and earning commissions immediately</Text>
          </View>
          <Text style={s.successEmail}>We'll email you at: {form.email}</Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [s.backToAppBtn, pressed && { opacity: 0.8 }]}
          >
            <Text style={s.backToAppBtnText}>Back to App</Text>
          </Pressable>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 bg-background">
      <ScrollView style={s.container} contentContainerStyle={s.scrollContent}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [pressed && { opacity: 0.7 }]}>
            <Text style={s.backBtn}>←</Text>
          </Pressable>
          <Text style={s.headerTitle}>Affiliate Program</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Hero Section */}
        <View style={s.hero}>
          <Text style={s.heroEmoji}>🚀</Text>
          <Text style={s.heroTitle}>Join the ConnectWorld AI{"\n"}Affiliate Program</Text>
          <Text style={s.heroSubtitle}>
            Earn money teaching languages. Share ConnectWorld AI with your audience and earn up to 20% commission on every paid subscription.
          </Text>
        </View>

        {/* Commission Tiers */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Commission Structure</Text>
          {COMMISSION_TIERS.map((tier) => (
            <View key={tier.tier} style={s.tierCard}>
              <View style={s.tierHeader}>
                <Text style={s.tierIcon}>{tier.icon}</Text>
                <View style={s.tierInfo}>
                  <Text style={s.tierName}>{tier.tier}</Text>
                  <Text style={s.tierCommission}>{tier.commission} per sale</Text>
                </View>
              </View>
              <Text style={s.tierDesc}>{tier.desc}</Text>
            </View>
          ))}
        </View>

        {/* How It Works */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>How It Works</Text>
          <View style={s.howItWorksBox}>
            {[
              { step: "1", title: "Apply", desc: "Fill out the application form below" },
              { step: "2", title: "Get Approved", desc: "We review your profile within 24-48 hours" },
              { step: "3", title: "Share", desc: "Get your unique link & code, share with your audience" },
              { step: "4", title: "Earn", desc: "Track conversions and get paid monthly" },
            ].map((item) => (
              <View key={item.step} style={s.howStep}>
                <View style={s.stepCircle}>
                  <Text style={s.stepNumber}>{item.step}</Text>
                </View>
                <View style={s.stepContent}>
                  <Text style={s.stepTitle}>{item.title}</Text>
                  <Text style={s.stepDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>What You Get</Text>
          <View style={s.benefitsGrid}>
            {BENEFITS.map((b) => (
              <View key={b.title} style={s.benefitCard}>
                <Text style={s.benefitIcon}>{b.icon}</Text>
                <Text style={s.benefitTitle}>{b.title}</Text>
                <Text style={s.benefitDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Requirements */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Requirements</Text>
          <View style={s.requirementsBox}>
            {REQUIREMENTS.map((req, i) => (
              <View key={i} style={s.reqRow}>
                <Text style={s.reqCheck}>✓</Text>
                <Text style={s.reqText}>{req}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Apply Button or Form */}
        {!showForm ? (
          <View style={s.section}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowForm(true);
              }}
              style={({ pressed }) => [s.applyBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] }]}
            >
              <Text style={s.applyBtnText}>Apply Now</Text>
            </Pressable>
            <Text style={s.applyNote}>Free to join • No upfront costs • Start earning immediately</Text>
          </View>
        ) : (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Application Form</Text>

            <Text style={s.fieldLabel}>Full Name *</Text>
            <TextInput
              style={s.input}
              placeholder="Your full name"
              placeholderTextColor="#687076"
              value={form.fullName}
              onChangeText={(v) => updateField("fullName", v)}
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Email Address *</Text>
            <TextInput
              style={s.input}
              placeholder="you@email.com"
              placeholderTextColor="#687076"
              value={form.email}
              onChangeText={(v) => updateField("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>TikTok Handle</Text>
            <TextInput
              style={s.input}
              placeholder="@yourtiktok"
              placeholderTextColor="#687076"
              value={form.tiktokHandle}
              onChangeText={(v) => updateField("tiktokHandle", v)}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Instagram Handle</Text>
            <TextInput
              style={s.input}
              placeholder="@yourinstagram"
              placeholderTextColor="#687076"
              value={form.instagramHandle}
              onChangeText={(v) => updateField("instagramHandle", v)}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>YouTube Channel</Text>
            <TextInput
              style={s.input}
              placeholder="youtube.com/@yourchannel"
              placeholderTextColor="#687076"
              value={form.youtubeChannel}
              onChangeText={(v) => updateField("youtubeChannel", v)}
              autoCapitalize="none"
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Total Follower Count (across all platforms)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., 15,000"
              placeholderTextColor="#687076"
              value={form.followerCount}
              onChangeText={(v) => updateField("followerCount", v)}
              keyboardType="numeric"
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Languages You Speak</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., English, Spanish, French"
              placeholderTextColor="#687076"
              value={form.languagesSpoken}
              onChangeText={(v) => updateField("languagesSpoken", v)}
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Languages You Teach/Create Content About</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Spanish (Dominican slang), French"
              placeholderTextColor="#687076"
              value={form.languagesTaught}
              onChangeText={(v) => updateField("languagesTaught", v)}
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Content Niche</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., Language learning, travel, culture, food"
              placeholderTextColor="#687076"
              value={form.contentNiche}
              onChangeText={(v) => updateField("contentNiche", v)}
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Why do you want to join? (optional)</Text>
            <TextInput
              style={[s.input, { minHeight: 80 }]}
              placeholder="Tell us about your audience and why ConnectWorld AI is a good fit..."
              placeholderTextColor="#687076"
              value={form.whyJoin}
              onChangeText={(v) => updateField("whyJoin", v)}
              multiline
              numberOfLines={3}
            />

            <Text style={s.fieldLabel}>Referral Code (if referred by another affiliate)</Text>
            <TextInput
              style={s.input}
              placeholder="e.g., NATASHA or leave blank"
              placeholderTextColor="#687076"
              value={form.referralCode}
              onChangeText={(v) => updateField("referralCode", v)}
              autoCapitalize="characters"
              returnKeyType="done"
            />

            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                s.submitBtn,
                isSubmitting && { opacity: 0.6 },
                pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.submitBtnText}>Submit Application</Text>
              )}
            </Pressable>

            <Text style={s.termsText}>
              By applying, you agree to our Affiliate Terms of Service and Commission Agreement.
            </Text>
          </View>
        )}

        {/* FAQ */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Frequently Asked Questions</Text>
          {[
            {
              q: "How much can I earn?",
              a: "There's no cap. Top affiliates earn $5,000+/month. You earn 20% of every subscription from your referrals, plus 5% from sub-affiliates you recruit.",
            },
            {
              q: "When do I get paid?",
              a: "Payouts are processed monthly via Stripe. You'll see your earnings in real-time on your dashboard.",
            },
            {
              q: "Can I promote on any platform?",
              a: "Yes! TikTok, Instagram, YouTube, Twitter/X, Facebook, your blog, email list — anywhere you have an audience.",
            },
            {
              q: "What if someone uses my link but signs up later?",
              a: "We use 30-day cookie tracking. If someone clicks your link and signs up within 30 days, you get credit.",
            },
            {
              q: "Can I recruit other affiliates?",
              a: "Yes! That's Tier 2. When you recruit another creator and they bring in paying users, you earn 5% of those subscriptions too.",
            },
          ].map((faq, i) => (
            <View key={i} style={s.faqCard}>
              <Text style={s.faqQ}>{faq.q}</Text>
              <Text style={s.faqA}>{faq.a}</Text>
            </View>
          ))}
        </View>
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
  hero: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 32, backgroundColor: "#0a7ea411" },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center", lineHeight: 32 },
  heroSubtitle: { fontSize: 14, color: "#9BA1A6", textAlign: "center", marginTop: 12, lineHeight: 20, maxWidth: 320 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 12 },
  tierCard: { backgroundColor: "#1e2022", borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: "#0a7ea4" },
  tierHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  tierIcon: { fontSize: 28, marginRight: 12 },
  tierInfo: { flex: 1 },
  tierName: { fontSize: 15, fontWeight: "700", color: "#fff" },
  tierCommission: { fontSize: 20, fontWeight: "800", color: "#4ADE80" },
  tierDesc: { fontSize: 12, color: "#9BA1A6", lineHeight: 18 },
  howItWorksBox: { gap: 12 },
  howStep: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#0a7ea4", alignItems: "center", justifyContent: "center" },
  stepNumber: { fontSize: 14, fontWeight: "800", color: "#fff" },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: "700", color: "#fff" },
  stepDesc: { fontSize: 12, color: "#9BA1A6", marginTop: 2 },
  benefitsGrid: { gap: 10 },
  benefitCard: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14 },
  benefitIcon: { fontSize: 24, marginBottom: 6 },
  benefitTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 4 },
  benefitDesc: { fontSize: 12, color: "#9BA1A6", lineHeight: 16 },
  requirementsBox: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, gap: 10 },
  reqRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  reqCheck: { fontSize: 14, color: "#4ADE80", fontWeight: "700" },
  reqText: { fontSize: 13, color: "#ECEDEE", flex: 1, lineHeight: 18 },
  applyBtn: { backgroundColor: "#0a7ea4", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  applyBtnText: { fontSize: 17, fontWeight: "800", color: "#fff" },
  applyNote: { fontSize: 11, color: "#687076", textAlign: "center", marginTop: 8 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#ECEDEE", marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, fontSize: 14, color: "#fff", minHeight: 48 },
  submitBtn: { marginTop: 20, backgroundColor: "#4ADE80", borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  submitBtnText: { fontSize: 16, fontWeight: "800", color: "#151718" },
  termsText: { fontSize: 10, color: "#687076", textAlign: "center", marginTop: 10 },
  faqCard: { backgroundColor: "#1e2022", borderRadius: 12, padding: 14, marginBottom: 8 },
  faqQ: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 6 },
  faqA: { fontSize: 12, color: "#9BA1A6", lineHeight: 18 },
  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  successEmoji: { fontSize: 64, marginBottom: 16 },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#fff", marginBottom: 8 },
  successDesc: { fontSize: 15, color: "#9BA1A6", textAlign: "center", marginBottom: 24 },
  successBox: { backgroundColor: "#1e2022", borderRadius: 14, padding: 16, width: "100%", marginBottom: 16 },
  successBoxTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 10 },
  successStep: { fontSize: 12, color: "#9BA1A6", lineHeight: 22 },
  successEmail: { fontSize: 12, color: "#0a7ea4", marginBottom: 24 },
  backToAppBtn: { backgroundColor: "#0a7ea4", borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  backToAppBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
