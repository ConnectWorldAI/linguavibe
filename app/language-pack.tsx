import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { Ionicons } from "@expo/vector-icons";
import { useI18n, SUPPORTED_LANGUAGES, type AppLanguage } from "@/lib/i18n";

export default function LanguagePackScreen() {
  const router = useRouter();
  const { language, setLanguage, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return SUPPORTED_LANGUAGES;
    const q = searchQuery.toLowerCase();
    return SUPPORTED_LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q) ||
        l.code.includes(q)
    );
  }, [searchQuery]);

  const handleSelect = (code: AppLanguage) => {
    setLanguage(code);
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.languagePack}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Description */}
        <View style={styles.descCard}>
          <Ionicons name="globe-outline" size={28} color="#00D4FF" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.descTitle}>App Interface Language</Text>
            <Text style={styles.descText}>
              Choose the language for all buttons, labels, and menus in the app.
              This does not affect your learning language.
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="done"
          />
        </View>

        {/* Language List */}
        <FlatList
          data={filteredLanguages}
          keyExtractor={(item) => item.code}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item: lang }) => {
            const isSelected = lang.code === language;
            return (
              <TouchableOpacity
                style={[styles.langItem, isSelected && styles.langItemSelected]}
                onPress={() => handleSelect(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={styles.langName}>{lang.name}</Text>
                  <Text style={styles.langNative}>{lang.nativeName}</Text>
                </View>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#060912" />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />

        {/* Current Selection */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Current: {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.flag}{" "}
            {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName}
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060912",
  },
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
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  descCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    backgroundColor: "rgba(0,212,255,0.06)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.15)",
  },
  descTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  descText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 17,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#fff",
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  langItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  langItemSelected: {
    backgroundColor: "rgba(0,212,255,0.08)",
    borderColor: "rgba(0,212,255,0.3)",
  },
  flag: {
    fontSize: 28,
    marginRight: 14,
  },
  langInfo: {
    flex: 1,
  },
  langName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  langNative: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00D4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
  },
});
