/**
 * Translation Widget Screen
 * 
 * Quick-access translation from home screen without opening the full app.
 * Minimal UI — just a text input, language swap, and instant translation.
 * Designed for speed: auto-translates as you type with debounce.
 */
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Platform,
  KeyboardAvoidingView, Clipboard, ActivityIndicator, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import { ScreenContainer } from "@/components/screen-container";
import { Colors } from "@/constants/Colors";
import { createVanillaClient } from "@/lib/trpc";

export default function TranslationWidgetScreen() {
  const router = useRouter();
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLang, setSourceLang] = useState("English");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [recentTranslations, setRecentTranslations] = useState<Array<{ source: string; target: string; from: string; to: string }>>([]);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 300);
  }, []);

  const translate = useCallback(async (text: string) => {
    if (!text.trim()) { setTranslatedText(""); return; }
    setIsTranslating(true);
    try {
      const client = createVanillaClient();
      const result = await client.translate.translate.mutate({
        text: text.trim(),
        sourceLang,
        targetLang,
      });
      setTranslatedText(result.translatedText || "");
      // Add to recent
      setRecentTranslations(prev => [
        { source: text.trim(), target: result.translatedText || "", from: sourceLang, to: targetLang },
        ...prev.slice(0, 9),
      ]);
    } catch {
      setTranslatedText("[Translation failed]");
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLang, targetLang]);

  const handleTextChange = (text: string) => {
    setInputText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => translate(text), 600);
  };

  const swapLanguages = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setInputText(translatedText);
    setTranslatedText(inputText);
  };

  const copyTranslation = () => {
    if (!translatedText) return;
    Clipboard.setString(translatedText);
    setCopied(true);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakTranslation = () => {
    if (!translatedText) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const langMap: Record<string, string> = {
      Spanish: "es-ES", French: "fr-FR", Japanese: "ja-JP",
      Korean: "ko-KR", Italian: "it-IT", Portuguese: "pt-BR",
      German: "de-DE", Mandarin: "zh-CN", English: "en-US",
    };
    Speech.speak(translatedText, { language: langMap[targetLang] || "es-ES", rate: 0.85 });
  };

  const clearAll = () => {
    setInputText("");
    setTranslatedText("");
    inputRef.current?.focus();
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="close" size={24} color="#ECEDEE" />
          </TouchableOpacity>
          <Text style={s.title}>Quick Translate</Text>
          <TouchableOpacity onPress={clearAll} style={s.clearBtn}>
            <Ionicons name="trash-outline" size={20} color="#9BA1A6" />
          </TouchableOpacity>
        </View>

        {/* Language Bar */}
        <View style={s.langBar}>
          <TouchableOpacity style={s.langBtn}>
            <Text style={s.langText}>{sourceLang}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={swapLanguages} style={s.swapBtn}>
            <Ionicons name="swap-horizontal" size={20} color="#00AAFF" />
          </TouchableOpacity>
          <TouchableOpacity style={s.langBtn}>
            <Text style={s.langText}>{targetLang}</Text>
          </TouchableOpacity>
        </View>

        {/* Input Area */}
        <View style={s.inputCard}>
          <TextInput
            ref={inputRef}
            style={s.input}
            placeholder="Type to translate..."
            placeholderTextColor="#687076"
            value={inputText}
            onChangeText={handleTextChange}
            multiline
            returnKeyType="done"
            autoCorrect={false}
          />
          {inputText.length > 0 && (
            <Text style={s.charCount}>{inputText.length}</Text>
          )}
        </View>

        {/* Translation Output */}
        <View style={s.outputCard}>
          {isTranslating ? (
            <ActivityIndicator size="small" color="#00AAFF" />
          ) : translatedText ? (
            <>
              <Text style={s.outputText}>{translatedText}</Text>
              <View style={s.actionRow}>
                <TouchableOpacity onPress={copyTranslation} style={s.actionBtn}>
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={18} color={copied ? "#4CAF50" : "#00AAFF"} />
                  <Text style={[s.actionLabel, copied && { color: "#4CAF50" }]}>{copied ? "Copied" : "Copy"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={speakTranslation} style={s.actionBtn}>
                  <Ionicons name="volume-medium" size={18} color="#00AAFF" />
                  <Text style={s.actionLabel}>Speak</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={s.placeholderText}>Translation will appear here</Text>
          )}
        </View>

        {/* Recent Translations */}
        {recentTranslations.length > 0 && (
          <View style={s.recentSection}>
            <Text style={s.recentTitle}>Recent</Text>
            <ScrollView style={s.recentList} showsVerticalScrollIndicator={false}>
              {recentTranslations.slice(0, 5).map((item, i) => (
                <TouchableOpacity
                  key={i}
                  style={s.recentItem}
                  onPress={() => { setInputText(item.source); setTranslatedText(item.target); }}
                >
                  <Text style={s.recentSource} numberOfLines={1}>{item.source}</Text>
                  <Text style={s.recentTarget} numberOfLines={1}>{item.target}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary, paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  clearBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", color: "#ECEDEE" },
  langBar: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  langBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#141825", borderRadius: 20 },
  langText: { fontSize: 14, fontWeight: "600", color: "#00AAFF" },
  swapBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,170,255,0.1)", alignItems: "center", justifyContent: "center", marginHorizontal: 12 },
  inputCard: { backgroundColor: "#141825", borderRadius: 16, padding: 16, minHeight: 100, marginBottom: 12 },
  input: { fontSize: 18, color: "#ECEDEE", minHeight: 60, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: "#687076", textAlign: "right", marginTop: 4 },
  outputCard: { backgroundColor: "#1C2235", borderRadius: 16, padding: 16, minHeight: 80, marginBottom: 12, borderWidth: 1, borderColor: "rgba(0,170,255,0.2)" },
  outputText: { fontSize: 18, color: "#FFFFFF", fontWeight: "500" },
  placeholderText: { fontSize: 14, color: "#687076", fontStyle: "italic" },
  actionRow: { flexDirection: "row", marginTop: 12, gap: 16 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionLabel: { fontSize: 12, color: "#00AAFF" },
  recentSection: { flex: 1, marginTop: 8 },
  recentTitle: { fontSize: 13, fontWeight: "600", color: "#9BA1A6", marginBottom: 8 },
  recentList: { flex: 1 },
  recentItem: { backgroundColor: "#141825", borderRadius: 10, padding: 12, marginBottom: 8 },
  recentSource: { fontSize: 13, color: "#9BA1A6" },
  recentTarget: { fontSize: 14, color: "#ECEDEE", fontWeight: "500", marginTop: 2 },
});
