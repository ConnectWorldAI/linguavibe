import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: May 22, 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.body}>
          ConnectWorld AI ("we", "our", "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.subTitle}>Personal Information</Text>
        <Text style={styles.body}>
          When you create an account, we may collect:{"\n"}
          • Name and email address{"\n"}
          • Profile photo (optional){"\n"}
          • Language preferences{"\n"}
          • Learning goals and schedule{"\n"}
          • Payment information (processed securely via third-party providers)
        </Text>

        <Text style={styles.subTitle}>Usage Data</Text>
        <Text style={styles.body}>
          We automatically collect:{"\n"}
          • Lesson progress and completion data{"\n"}
          • Practice session recordings (stored locally unless you opt into cloud sync){"\n"}
          • App interaction patterns for improvement{"\n"}
          • Device information and operating system version
        </Text>

        <Text style={styles.subTitle}>Audio Data</Text>
        <Text style={styles.body}>
          When you use voice features (pronunciation practice, conversation simulation, WavyEq Studios), audio is processed locally on your device for scoring. Audio recordings are only uploaded to our servers if you explicitly choose to save or share them.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use collected information to:{"\n"}
          • Provide and maintain our language learning services{"\n"}
          • Personalize your learning experience and AI recommendations{"\n"}
          • Track your progress and provide performance analytics{"\n"}
          • Process payments and manage subscriptions{"\n"}
          • Send notifications about your learning schedule{"\n"}
          • Improve our AI models and service quality{"\n"}
          • Communicate updates and new features
        </Text>

        <Text style={styles.sectionTitle}>4. Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell your personal information. We may share data with:{"\n"}
          • Service providers (cloud hosting, payment processing, analytics){"\n"}
          • Other users (only information you choose to make public in your profile){"\n"}
          • Law enforcement (when required by law or to protect safety)
        </Text>

        <Text style={styles.sectionTitle}>5. Data Storage & Security</Text>
        <Text style={styles.body}>
          Your data is stored securely using industry-standard encryption. Learning progress is stored locally on your device by default. Cloud sync (available for paid subscribers) uses encrypted transmission and storage. We retain your data for as long as your account is active.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.body}>
          You have the right to:{"\n"}
          • Access your personal data{"\n"}
          • Correct inaccurate data{"\n"}
          • Delete your account and associated data{"\n"}
          • Export your learning progress{"\n"}
          • Opt out of marketing communications{"\n"}
          • Restrict data processing{"\n"}
          • Data portability
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.body}>
          ConnectWorld AI is intended for users aged 13 and older. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us immediately.
        </Text>

        <Text style={styles.sectionTitle}>8. International Data Transfers</Text>
        <Text style={styles.body}>
          Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws including GDPR and CCPA.
        </Text>

        <Text style={styles.sectionTitle}>9. Third-Party Services</Text>
        <Text style={styles.body}>
          Our app may contain links to third-party services. We are not responsible for the privacy practices of these services. We encourage you to review their privacy policies.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of any material changes through the app or via email. Your continued use of the app after changes constitutes acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>11. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at:{"\n\n"}
          Email: privacy@connectworldai.com{"\n"}
          Address: ConnectWorld AI Inc.{"\n\n"}
          For EU residents: You may also contact your local data protection authority.
        </Text>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.backgroundDark },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: Colors.surfaceCard,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: "700", color: Colors.textPrimary },
  content: { flex: 1, paddingHorizontal: Spacing.md },
  lastUpdated: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.md, fontWeight: "700", color: Colors.textPrimary, marginTop: Spacing.md, marginBottom: Spacing.xs },
  subTitle: { fontSize: FontSize.sm, fontWeight: "600", color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: 4 },
  body: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
});
