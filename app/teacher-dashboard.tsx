import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

const { width } = Dimensions.get("window");

// Student data model
interface Student {
  id: string;
  name: string;
  avatar: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: string; // CEFR: A1-C2
  lastSession: string;
  streak: number;
  totalHours: number;
  weakAreas: string[];
  strongAreas: string[];
  nextLesson: string;
  progress: number; // 0-100
}

// Mock students for the teacher
const MOCK_STUDENTS: Student[] = [
  {
    id: "1",
    name: "Carlos Mendez",
    avatar: "🧑🏽",
    nativeLanguage: "Spanish",
    targetLanguage: "English",
    level: "A2",
    lastSession: "2 hours ago",
    streak: 12,
    totalHours: 34,
    weakAreas: ["Pronunciation", "Past Tense", "Articles"],
    strongAreas: ["Vocabulary", "Listening"],
    nextLesson: "Present Perfect vs Past Simple",
    progress: 38,
  },
  {
    id: "2",
    name: "Yuki Tanaka",
    avatar: "👩🏻",
    nativeLanguage: "Japanese",
    targetLanguage: "English",
    level: "B1",
    lastSession: "Yesterday",
    streak: 7,
    totalHours: 56,
    weakAreas: ["Articles", "Prepositions", "R/L sounds"],
    strongAreas: ["Grammar", "Reading", "Vocabulary"],
    nextLesson: "Conditional Sentences",
    progress: 52,
  },
  {
    id: "3",
    name: "Marie Dupont",
    avatar: "👩🏼",
    nativeLanguage: "French",
    targetLanguage: "Spanish",
    level: "B2",
    lastSession: "3 days ago",
    streak: 0,
    totalHours: 89,
    weakAreas: ["Subjunctive Mood", "Regional Slang"],
    strongAreas: ["Pronunciation", "Grammar", "Listening"],
    nextLesson: "Dominican vs Mexican Spanish",
    progress: 74,
  },
  {
    id: "4",
    name: "Ahmed Hassan",
    avatar: "🧑🏾",
    nativeLanguage: "Arabic",
    targetLanguage: "English",
    level: "A1",
    lastSession: "Today",
    streak: 3,
    totalHours: 8,
    weakAreas: ["Vowel Sounds", "Word Order", "Verb Tenses"],
    strongAreas: ["Motivation", "Listening"],
    nextLesson: "Basic Sentence Structure",
    progress: 12,
  },
];

// AI-generated lesson suggestions based on student's weak areas
const AI_LESSON_SUGGESTIONS: Record<string, string[]> = {
  "Pronunciation": [
    "Minimal Pairs Practice (ship/sheep, bat/bet)",
    "Tongue Twisters for Fluency",
    "Record & Compare with Native Audio",
    "Phoneme Isolation Drills",
  ],
  "Past Tense": [
    "Storytelling Exercise (narrate a past event)",
    "Regular vs Irregular Verb Sort",
    "Timeline Activities (sequence past events)",
    "Song Lyrics Gap Fill (past tense songs)",
  ],
  "Articles": [
    "Article Decision Tree Practice",
    "Real-world Text Article Hunt",
    "A/An/The Pattern Recognition",
    "Zero Article vs The (geographic names)",
  ],
  "Prepositions": [
    "Spatial Preposition Games (in/on/at)",
    "Time Preposition Timeline",
    "Phrasal Verb Matching",
    "Preposition Collocations Drill",
  ],
  "Vowel Sounds": [
    "IPA Vowel Chart Introduction",
    "Minimal Pairs (ship/sheep, full/fool)",
    "Mouth Position Mirror Practice",
    "Vowel Sound Song Method",
  ],
  "Word Order": [
    "Sentence Scramble Activities",
    "SVO Pattern Drilling",
    "Question Formation Practice",
    "Adjective Order Rules",
  ],
  "Verb Tenses": [
    "Timeline Visualization (past/present/future)",
    "Tense Signal Words Matching",
    "Daily Routine Narration (present simple)",
    "Future Plans Discussion (will vs going to)",
  ],
  "Subjunctive Mood": [
    "Wish/If Only Scenarios",
    "Subjunctive Triggers List",
    "Real vs Unreal Conditionals",
    "Formal Suggestions Practice",
  ],
  "Regional Slang": [
    "Slang Comparison Cards (Dominican vs Mexican)",
    "Video Analysis (native speaker content)",
    "Roleplay in Different Dialects",
    "Slang of the Day Deep Dive",
  ],
  "R/L sounds": [
    "R vs L Minimal Pairs (right/light, road/load)",
    "Tongue Position Diagrams",
    "Repetition Drills with Audio",
    "R/L in Connected Speech",
  ],
};

// Quick actions for teachers
const QUICK_ACTIONS = [
  { id: "assess", icon: "📊", label: "Quick Assessment", route: "/teacher-assessment" },
  { id: "lesson", icon: "📝", label: "Create Lesson", route: "/teacher-lesson-planner" },
  { id: "progress", icon: "📈", label: "Progress Report", route: "/teacher-progress" },
  { id: "translate", icon: "🌐", label: "Live Translate", route: "/(tabs)/translate" },
  { id: "resources", icon: "📚", label: "Resources", route: "/teacher-resources" },
  { id: "schedule", icon: "📅", label: "Schedule", route: "/teacher-schedule" },
];

export default function TeacherDashboard() {
  const router = useRouter();
  const colors = useColors();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentNative, setNewStudentNative] = useState("");
  const [newStudentTarget, setNewStudentTarget] = useState("");

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = {
      "A1": "#EF4444", "A2": "#F97316", "B1": "#EAB308",
      "B2": "#22C55E", "C1": "#3B82F6", "C2": "#8B5CF6",
    };
    return map[level] || colors.muted;
  };

  const getProgressColor = (progress: number) => {
    if (progress < 25) return "#EF4444";
    if (progress < 50) return "#F97316";
    if (progress < 75) return "#EAB308";
    return "#22C55E";
  };

  const renderStudentCard = useCallback(({ item }: { item: Student }) => (
    <TouchableOpacity
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
      onPress={() => {
        setSelectedStudent(item);
        setShowStudentDetail(true);
      }}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 36 }}>{item.avatar}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.muted, marginTop: 2 }}>
            {item.nativeLanguage} → {item.targetLanguage}
          </Text>
        </View>
        <View style={{
          backgroundColor: getLevelColor(item.level) + "20",
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 8,
        }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: getLevelColor(item.level) }}>
            {item.level}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ marginBottom: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Progress to next level</Text>
          <Text style={{ fontSize: 12, fontWeight: "600", color: getProgressColor(item.progress) }}>
            {item.progress}%
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
          <View style={{
            height: 6,
            width: `${item.progress}%`,
            backgroundColor: getProgressColor(item.progress),
            borderRadius: 3,
          }} />
        </View>
      </View>

      {/* Quick stats */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Streak</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            🔥 {item.streak}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Hours</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {item.totalHours}h
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Last Session</Text>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
            {item.lastSession}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Next</Text>
          <Text style={{ fontSize: 11, fontWeight: "500", color: colors.primary, maxWidth: 80 }} numberOfLines={1}>
            {item.nextLesson}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [colors]);

  return (
    <ScreenContainer className="p-0">
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ padding: 20, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 28, fontWeight: "800", color: colors.foreground }}>
                Teacher Mode
              </Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>
                AI Co-Teacher Dashboard
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                width: 44,
                height: 44,
                borderRadius: 22,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => setShowAddStudent(true)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 24, color: "#fff" }}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 12,
                  width: (width - 50) / 3,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 24, marginBottom: 4 }}>{action.icon}</Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.foreground, textAlign: "center" }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Overview */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={{
            backgroundColor: colors.primary + "10",
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.primary + "30",
          }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary, marginBottom: 8 }}>
              🤖 AI Co-Teacher Insights
            </Text>
            <Text style={{ fontSize: 13, color: colors.foreground, lineHeight: 20 }}>
              • Carlos needs extra practice on articles — suggest "Article Decision Tree" exercise{"\n"}
              • Ahmed is struggling with vowel sounds — recommend the "Mouth Position Mirror" drill{"\n"}
              • Marie hasn't practiced in 3 days — send a motivation nudge{"\n"}
              • Yuki is ready to advance to B2 — schedule a level assessment
            </Text>
          </View>
        </View>

        {/* Students List */}
        <View style={{ paddingHorizontal: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground }}>
              My Students ({MOCK_STUDENTS.length})
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: colors.primary, fontWeight: "600" }}>
                Sort by Level
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={MOCK_STUDENTS}
            renderItem={renderStudentCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Student Detail Modal */}
      <Modal visible={showStudentDetail} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
                {selectedStudent?.avatar} {selectedStudent?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowStudentDetail(false)}>
                <Text style={{ fontSize: 16, color: colors.primary }}>Done</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4 }}>
              {selectedStudent?.nativeLanguage} → {selectedStudent?.targetLanguage} • Level {selectedStudent?.level}
            </Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
            {/* Weak Areas with AI Suggestions */}
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
              ⚠️ Areas Needing Work
            </Text>
            {selectedStudent?.weakAreas.map((area, idx) => (
              <View key={idx} style={{
                backgroundColor: "#EF444410",
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: "#EF444430",
              }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#EF4444", marginBottom: 8 }}>
                  {area}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.foreground, marginBottom: 6 }}>
                  AI-Suggested Exercises:
                </Text>
                {(AI_LESSON_SUGGESTIONS[area] || []).map((suggestion, sIdx) => (
                  <TouchableOpacity
                    key={sIdx}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 6,
                      paddingLeft: 8,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, color: colors.primary, marginRight: 6 }}>▶</Text>
                    <Text style={{ fontSize: 13, color: colors.foreground }}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Strong Areas */}
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 16, marginBottom: 12 }}>
              ✅ Strong Areas
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {selectedStudent?.strongAreas.map((area, idx) => (
                <View key={idx} style={{
                  backgroundColor: "#22C55E20",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                }}>
                  <Text style={{ fontSize: 13, color: "#22C55E", fontWeight: "600" }}>{area}</Text>
                </View>
              ))}
            </View>

            {/* Next Recommended Lesson */}
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 20, marginBottom: 12 }}>
              📝 Next Recommended Lesson
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary + "10",
                borderRadius: 12,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.primary + "30",
              }}
              onPress={() => {
                setShowStudentDetail(false);
                router.push("/teacher-lesson-planner" as any);
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.primary }}>
                {selectedStudent?.nextLesson}
              </Text>
              <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                Tap to generate a full lesson plan with exercises, activities, and assessment
              </Text>
            </TouchableOpacity>

            {/* Quick Actions for this student */}
            <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 20, marginBottom: 12 }}>
              🎯 Actions
            </Text>
            <View style={{ gap: 8 }}>
              {[
                { label: "Start Live Session", icon: "🎙️", desc: "AI co-teaches in real-time" },
                { label: "Run Assessment", icon: "📊", desc: "4-min level check" },
                { label: "Assign Homework", icon: "📚", desc: "AI generates based on weak areas" },
                { label: "Send Motivation", icon: "💪", desc: "Encourage them to practice" },
                { label: "View Full History", icon: "📈", desc: "All sessions, scores, progress" },
              ].map((action, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: colors.surface,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{action.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                      {action.label}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.muted }}>{action.desc}</Text>
                  </View>
                  <Text style={{ fontSize: 16, color: colors.muted }}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Add Student Modal */}
      <Modal visible={showAddStudent} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.foreground }}>
              Add Student
            </Text>
            <TouchableOpacity onPress={() => setShowAddStudent(false)}>
              <Text style={{ fontSize: 16, color: colors.primary }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Student Name
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
            placeholder="Enter student's name"
            placeholderTextColor={colors.muted}
            value={newStudentName}
            onChangeText={setNewStudentName}
          />

          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Their Native Language
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 16,
            }}
            placeholder="e.g., Spanish, Japanese, Arabic"
            placeholderTextColor={colors.muted}
            value={newStudentNative}
            onChangeText={setNewStudentNative}
          />

          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
            Language They're Learning
          </Text>
          <TextInput
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              color: colors.foreground,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24,
            }}
            placeholder="e.g., English, Spanish, French"
            placeholderTextColor={colors.muted}
            value={newStudentTarget}
            onChangeText={setNewStudentTarget}
          />

          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
              Add Student & Run Assessment
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 12, color: colors.muted, textAlign: "center", marginTop: 12 }}>
            After adding, the AI will run a quick 4-minute assessment to determine their current level and create a personalized learning plan.
          </Text>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
