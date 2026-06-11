import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const LESSON_TYPES = [
  { id: "vocabulary", label: "Vocabulary", icon: "book", color: "#8B5CF6" },
  { id: "grammar", label: "Grammar", icon: "construct", color: "#3B82F6" },
  { id: "conversation", label: "Conversation", icon: "chatbubbles", color: "#10B981" },
  { id: "pronunciation", label: "Pronunciation", icon: "mic", color: "#F59E0B" },
  { id: "culture", label: "Culture & Context", icon: "globe", color: "#EC4899" },
  { id: "listening", label: "Listening", icon: "ear", color: "#06B6D4" },
];

const DIFFICULTY_LEVELS = [
  { id: "A1", label: "A1 - Beginner" },
  { id: "A2", label: "A2 - Elementary" },
  { id: "B1", label: "B1 - Intermediate" },
  { id: "B2", label: "B2 - Upper Intermediate" },
  { id: "C1", label: "C1 - Advanced" },
];

export default function TeacherLessonPlannerScreen() {
  const colors = useColors();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [duration, setDuration] = useState("30");

  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title || !selectedType || !selectedLevel) return;
    setSaving(true);
    try {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const plan = {
        id: `plan-${Date.now()}`,
        title,
        description,
        type: selectedType,
        level: selectedLevel,
        duration: parseInt(duration),
        createdAt: new Date().toISOString(),
      };
      const existing = await AsyncStorage.getItem("@teacher_lesson_plans");
      const plans = existing ? JSON.parse(existing) : [];
      plans.unshift(plan);
      await AsyncStorage.setItem("@teacher_lesson_plans", JSON.stringify(plans));
      router.back();
    } catch (e) {
      console.error("Failed to save lesson plan:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "700", color: colors.foreground, marginLeft: 12 }}>
            Create Lesson Plan
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Title */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Lesson Title
          </Text>
          <TextInput
            style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, fontSize: 16, color: colors.foreground, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}
            placeholder="e.g., Ordering Food at a Restaurant"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Description
          </Text>
          <TextInput
            style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14, fontSize: 14, color: colors.foreground, borderWidth: 1, borderColor: colors.border, marginBottom: 20, minHeight: 80, textAlignVertical: "top" }}
            placeholder="What will students learn in this lesson?"
            placeholderTextColor={colors.muted}
            value={description}
            onChangeText={setDescription}
            multiline
          />

          {/* Lesson Type */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Lesson Type
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
            {LESSON_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                onPress={() => setSelectedType(type.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: selectedType === type.id ? type.color + "20" : colors.surface,
                  borderWidth: 1.5,
                  borderColor: selectedType === type.id ? type.color : colors.border,
                }}
              >
                <Ionicons name={type.icon as any} size={16} color={selectedType === type.id ? type.color : colors.muted} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: selectedType === type.id ? type.color : colors.foreground }}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Difficulty Level */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>
            Difficulty Level
          </Text>
          <View style={{ gap: 8, marginBottom: 20 }}>
            {DIFFICULTY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => setSelectedLevel(level.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: selectedLevel === level.id ? colors.primary + "15" : colors.surface,
                  borderWidth: 1.5,
                  borderColor: selectedLevel === level.id ? colors.primary : colors.border,
                }}
              >
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  {level.label}
                </Text>
                {selectedLevel === level.id && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Duration */}
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
            Duration (minutes)
          </Text>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            {["15", "30", "45", "60"].map((d) => (
              <TouchableOpacity
                key={d}
                onPress={() => setDuration(d)}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 20,
                  backgroundColor: duration === d ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: duration === d ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: duration === d ? "#fff" : colors.foreground }}>
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Create Button */}
        <View style={{ padding: 16, paddingBottom: 24 }}>
          <TouchableOpacity
            onPress={handleCreate}
            style={{
              backgroundColor: title && selectedType && selectedLevel ? colors.primary : colors.muted,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              opacity: title && selectedType && selectedLevel ? 1 : 0.5,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              Create Lesson Plan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
