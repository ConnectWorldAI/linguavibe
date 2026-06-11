import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize } from "../constants/Colors";

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: May 22, 2026</Text>

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By downloading, installing, or using ConnectWorld AI ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.body}>
          ConnectWorld AI is a language learning platform that provides:{"\n"}
          • AI-powered language instruction and practice{"\n"}
          • Song translation and pronunciation training{"\n"}
          • Live conversation simulation{"\n"}
          • Social learning features (messaging, video calls){"\n"}
          • Progress tracking and certification{"\n"}
          • Structured curriculum from A1 to C2 levels
        </Text>

        <Text style={styles.sectionTitle}>3. User Accounts</Text>
        <Text style={styles.body}>
          You must be at least 13 years old to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree to provide accurate and complete information during registration.
        </Text>

        <Text style={styles.sectionTitle}>4. Subscription & Payments</Text>
        <Text style={styles.body}>
          ConnectWorld AI offers free and paid subscription tiers:{"\n\n"}
          • Free: Limited features and credits{"\n"}
          • Plus ($9.99/mo): Enhanced features and credits{"\n"}
          • Pro ($19.99/mo): Full access with unlimited AI features{"\n"}
          • Enterprise ($49.99/mo): Team features and API access{"\n\n"}
          Subscriptions auto-renew unless cancelled at least 24 hours before the renewal date. Refunds are handled per Apple App Store and Google Play Store policies.
        </Text>

        <Text style={styles.sectionTitle}>5. User Content</Text>
        <Text style={styles.body}>
          You retain ownership of content you create (recordings, posts, messages). By sharing content publicly, you grant ConnectWorld AI a non-exclusive license to display it within the platform. You are responsible for ensuring your content does not violate any laws or third-party rights.
        </Text>

        <Text style={styles.sectionTitle}>6. Acceptable Use</Text>
        <Text style={styles.body}>
          You agree not to:{"\n"}
          • Use the App for any unlawful purpose{"\n"}
          • Harass, bully, or threaten other users{"\n"}
          • Share inappropriate, offensive, or harmful content{"\n"}
          • Attempt to reverse-engineer or hack the App{"\n"}
          • Create multiple accounts to abuse free-tier limits{"\n"}
          • Use automated tools to access the service{"\n"}
          • Impersonate other users or entities
        </Text>

        <Text style={styles.sectionTitle}>7. AI-Generated Content</Text>
        <Text style={styles.body}>
          ConnectWorld AI uses artificial intelligence to provide language instruction, translations, and conversation practice. While we strive for accuracy, AI-generated content may contain errors. The App should not be relied upon as the sole source for critical translations or professional language certification.
        </Text>

        <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
        <Text style={styles.body}>
          All App content, features, and functionality (excluding user-generated content) are owned by ConnectWorld AI Inc. and protected by international copyright, trademark, and other intellectual property laws. The curriculum, AI models, and proprietary algorithms are trade secrets.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.body}>
          ConnectWorld AI is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the App. Our total liability shall not exceed the amount you paid for the service in the preceding 12 months.
        </Text>

        <Text style={styles.sectionTitle}>10. Termination</Text>
        <Text style={styles.body}>
          We may suspend or terminate your account if you violate these Terms. You may delete your account at any time through the App settings. Upon termination, your right to use the App ceases immediately, though we may retain certain data as required by law.
        </Text>

        <Text style={styles.sectionTitle}>11. Dispute Resolution</Text>
        <Text style={styles.body}>
          Any disputes arising from these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. You agree to waive your right to participate in class-action lawsuits.
        </Text>

        <Text style={styles.sectionTitle}>12. Changes to Terms</Text>
        <Text style={styles.body}>
          We reserve the right to modify these Terms at any time. Material changes will be communicated through the App. Continued use after changes constitutes acceptance of the new Terms.
        </Text>

        <Text style={styles.sectionTitle}>13. Contact</Text>
        <Text style={styles.body}>
          For questions about these Terms, contact us at:{"\n\n"}
          Email: legal@connectworldai.com{"\n"}
          ConnectWorld AI Inc.
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
  body: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 22 },
});
