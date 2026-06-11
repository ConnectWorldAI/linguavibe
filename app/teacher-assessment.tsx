import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

// Assessment categories
const ASSESSMENT_CATEGORIES = [
  {
    id: "speaking",
    icon: "🎙️",
    label: "Speaking",
    description: "Pronunciation, fluency, confidence",
    questions: [
      "Can introduce themselves clearly",
      "Can describe daily routines",
      "Can express opinions on familiar topics",
      "Can handle unexpected questions",
      "Can use idioms and expressions naturally",
    ],
  },
  {
    id: "listening",
    icon: "👂",
    label: "Listening",
    description: "Comprehension, speed, accents",
    questions: [
      "Understands slow, clear speech",
      "Can follow conversations at normal speed",
      "Understands different accents",
      "Can catch details in fast speech",
      "Understands humor and sarcasm",
    ],
  },
  {
    id: "grammar",
    icon: "📐",
    label: "Grammar",
    description: "Accuracy, complexity, self-correction",
    questions: [
      "Uses basic sentence structures correctly",
      "Can form questions properly",
      "Uses past/present/future tenses",
      "Handles complex structures (conditionals, passive)",
      "Self-corrects errors naturally",
    ],
  },
  {
    id: "vocabulary",
    icon: "📖",
    label: "Vocabulary",
    description: "Range, precision, context",
    questions: [
      "Has basic everyday vocabulary",
      "Can describe things when missing exact word",
      "Uses topic-specific vocabulary",
      "Knows formal vs informal register",
      "Uses collocations and phrasal verbs naturally",
    ],
  },
  {
    id: "reading",
    icon: "📄",
    label: "Reading",
    description: "Speed, comprehension, inference",
    questions: [
      "Can read simple texts (menus, signs)",
      "Understands short articles",
      "Can infer meaning from context",
      "Reads complex texts with understanding",
      "Can analyze writing style and tone",
    ],
  },
  {
    id: "writing",
    icon: "✍️",
    label: "Writing",
    description: "Structure, coherence, style",
    questions: [
      "Can write simple messages",
      "Can write structured paragraphs",
      "Uses appropriate connectors",
      "Can write formal and informal texts",
      "Can argue a point persuasively in writing",
    ],
  },
];

// CEFR level descriptions
const CEFR_LEVELS = [
  { level: "A1", name: "Beginner", color: "#EF4444", description: "Can understand and use basic phrases" },
  { level: "A2", name: "Elementary", color: "#F97316", description: "Can communicate in simple, routine tasks" },
  { level: "B1", name: "Intermediate", color: "#EAB308", description: "Can deal with most situations while traveling" },
  { level: "B2", name: "Upper Intermediate", color: "#22C55E", description: "Can interact with fluency and spontaneity" },
  { level: "C1", name: "Advanced", color: "#3B82F6", description: "Can express ideas fluently and spontaneously" },
  { level: "C2", name: "Mastery", color: "#8B5CF6", description: "Can understand virtually everything heard or read" },
];

export default function TeacherAssessment() {
  const router = useRouter();
  const colors = useColors();
  const [currentCategory, setCurrentCategory] = useState(0);
  const [scores, setScores] = useState<Record<string, number[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [notes, setNotes] = useState("");
  const [studentName, setStudentName] = useState("");

  const category = ASSESSMENT_CATEGORIES[currentCategory];

  const handleScore = (questionIdx: number, score: number) => {
    const catId = category.id;
    const currentScores = scores[catId] || Array(category.questions.length).fill(0);
    currentScores[questionIdx] = score;
    setScores({ ...scores, [catId]: currentScores });
  };

  const getOverallLevel = (): string => {
    let totalScore = 0;
    let totalQuestions = 0;
    Object.values(scores).forEach((catScores) => {
      catScores.forEach((s) => {
        if (s > 0) {
          totalScore += s;
          totalQuestions++;
        }
      });
    });
    if (totalQuestions === 0) return "A1";
    const avg = totalScore / totalQuestions;
    if (avg <= 1.5) return "A1";
    if (avg <= 2.5) return "A2";
    if (avg <= 3.5) return "B1";
    if (avg <= 4.0) return "B2";
    if (avg <= 4.5) return "C1";
    return "C2";
  };

  const getCategoryAverage = (catId: string): number => {
    const catScores = scores[catId] || [];
    const validScores = catScores.filter((s) => s > 0);
    if (validScores.length === 0) return 0;
    return validScores.reduce((a, b) => a + b, 0) / validScores.length;
  };

  const getAIRecommendations = (): string[] => {
    const level = getOverallLevel();
    const weakCategories: string[] = [];
    ASSESSMENT_CATEGORIES.forEach((cat) => {
      const avg = getCategoryAverage(cat.id);
      if (avg > 0 && avg < 3) {
        weakCategories.push(cat.label);
      }
    });

    const recommendations: string[] = [];
    if (weakCategories.includes("Speaking")) {
      recommendations.push("Start with conversation scenarios at their level — build confidence before accuracy");
    }
    if (weakCategories.includes("Listening")) {
      recommendations.push("Use musical lessons and song breakdowns to train their ear");
    }
    if (weakCategories.includes("Grammar")) {
      recommendations.push("Use the Musical Lesson format to make grammar rules memorable");
    }
    if (weakCategories.includes("Vocabulary")) {
      recommendations.push("Assign Spaced Repetition vocab cards with visual associations");
    }
    if (weakCategories.includes("Reading")) {
      recommendations.push("Start with social media posts and short texts from their interests");
    }
    if (weakCategories.includes("Writing")) {
      recommendations.push("Begin with messaging/chat format before formal writing");
    }

    if (level === "A1" || level === "A2") {
      recommendations.push("Focus on survival phrases and daily routines first");
      recommendations.push("Use their native language as a bridge — translator with dialect support");
    } else if (level === "B1" || level === "B2") {
      recommendations.push("Push into real-world scenarios — City Exploration mode");
      recommendations.push("Introduce slang and cultural expressions for authenticity");
    } else {
      recommendations.push("Focus on nuance, humor, and professional contexts");
      recommendations.push("Use debate and discussion formats for advanced fluency");
    }

    return recommendations;
  };

  return (
    <ScreenContainer className="p-0">
      {!showResults ? (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
          {/* Header */}
          <View style={{ padding: 20, paddingBottom: 12 }}>
            <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 16, color: colors.primary }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground }}>
              Student Assessment
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              Rate your student's abilities to get AI-powered lesson recommendations
            </Text>
          </View>

          {/* Student Name */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Student's name"
              placeholderTextColor={colors.muted}
              value={studentName}
              onChangeText={setStudentName}
            />
          </View>

          {/* Category Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            {ASSESSMENT_CATEGORIES.map((cat, idx) => (
              <TouchableOpacity
                key={cat.id}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  marginRight: 8,
                  backgroundColor: currentCategory === idx ? colors.primary : colors.surface,
                  borderWidth: 1,
                  borderColor: currentCategory === idx ? colors.primary : colors.border,
                }}
                onPress={() => setCurrentCategory(idx)}
                activeOpacity={0.7}
              >
                <Text style={{
                  fontSize: 13,
                  fontWeight: "600",
                  color: currentCategory === idx ? "#fff" : colors.foreground,
                }}>
                  {cat.icon} {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Current Category Questions */}
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 4 }}>
              {category.icon} {category.label}
            </Text>
            <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16 }}>
              {category.description}
            </Text>

            {category.questions.map((question, qIdx) => {
              const currentScore = (scores[category.id] || [])[qIdx] || 0;
              return (
                <View key={qIdx} style={{
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 14, color: colors.foreground, marginBottom: 10 }}>
                    {question}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <TouchableOpacity
                        key={score}
                        style={{
                          flex: 1,
                          paddingVertical: 8,
                          borderRadius: 8,
                          alignItems: "center",
                          backgroundColor: currentScore === score
                            ? score <= 2 ? "#EF4444" : score <= 3 ? "#EAB308" : "#22C55E"
                            : colors.background,
                          borderWidth: 1,
                          borderColor: currentScore === score ? "transparent" : colors.border,
                        }}
                        onPress={() => handleScore(qIdx, score)}
                        activeOpacity={0.7}
                      >
                        <Text style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: currentScore === score ? "#fff" : colors.muted,
                        }}>
                          {score}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4 }}>
                    <Text style={{ fontSize: 10, color: colors.muted }}>Can't do</Text>
                    <Text style={{ fontSize: 10, color: colors.muted }}>Excellent</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Notes */}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
              Additional Notes
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                color: colors.foreground,
                borderWidth: 1,
                borderColor: colors.border,
                height: 80,
                textAlignVertical: "top",
              }}
              placeholder="Any observations about the student..."
              placeholderTextColor={colors.muted}
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Navigation */}
          <View style={{ flexDirection: "row", paddingHorizontal: 20, marginTop: 20, gap: 10 }}>
            {currentCategory > 0 && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
                onPress={() => setCurrentCategory(currentCategory - 1)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                  ← Previous
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 14,
                alignItems: "center",
              }}
              onPress={() => {
                if (currentCategory < ASSESSMENT_CATEGORIES.length - 1) {
                  setCurrentCategory(currentCategory + 1);
                } else {
                  setShowResults(true);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#fff" }}>
                {currentCategory < ASSESSMENT_CATEGORIES.length - 1 ? "Next →" : "See Results"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        /* Results View */
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
          <Text style={{ fontSize: 24, fontWeight: "800", color: colors.foreground, marginBottom: 4 }}>
            Assessment Results
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 20 }}>
            {studentName || "Student"}'s current level and recommendations
          </Text>

          {/* Overall Level */}
          {(() => {
            const level = getOverallLevel();
            const levelInfo = CEFR_LEVELS.find((l) => l.level === level)!;
            return (
              <View style={{
                backgroundColor: levelInfo.color + "15",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                marginBottom: 20,
                borderWidth: 1,
                borderColor: levelInfo.color + "40",
              }}>
                <Text style={{ fontSize: 48, fontWeight: "900", color: levelInfo.color }}>
                  {level}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "700", color: levelInfo.color, marginTop: 4 }}>
                  {levelInfo.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 4, textAlign: "center" }}>
                  {levelInfo.description}
                </Text>
              </View>
            );
          })()}

          {/* Category Breakdown */}
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
            Skill Breakdown
          </Text>
          {ASSESSMENT_CATEGORIES.map((cat) => {
            const avg = getCategoryAverage(cat.id);
            const barWidth = avg > 0 ? (avg / 5) * 100 : 0;
            const barColor = avg < 2 ? "#EF4444" : avg < 3 ? "#F97316" : avg < 4 ? "#EAB308" : "#22C55E";
            return (
              <View key={cat.id} style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.foreground }}>
                    {cat.icon} {cat.label}
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: barColor }}>
                    {avg > 0 ? avg.toFixed(1) : "—"}/5
                  </Text>
                </View>
                <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
                  <View style={{
                    height: 8,
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                    borderRadius: 4,
                  }} />
                </View>
              </View>
            );
          })}

          {/* AI Recommendations */}
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.foreground, marginTop: 20, marginBottom: 12 }}>
            🤖 AI Teaching Recommendations
          </Text>
          <View style={{
            backgroundColor: colors.primary + "10",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.primary + "30",
          }}>
            {getAIRecommendations().map((rec, idx) => (
              <View key={idx} style={{ flexDirection: "row", marginBottom: 8 }}>
                <Text style={{ fontSize: 13, color: colors.primary, marginRight: 8 }}>•</Text>
                <Text style={{ fontSize: 13, color: colors.foreground, flex: 1, lineHeight: 18 }}>
                  {rec}
                </Text>
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={{ gap: 10, marginTop: 20 }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
              }}
              onPress={() => router.push("/teacher-lesson-planner" as any)}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#fff" }}>
                Generate Lesson Plan
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                borderWidth: 1,
                borderColor: colors.border,
              }}
              onPress={() => {
                setShowResults(false);
                setCurrentCategory(0);
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Redo Assessment
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </ScreenContainer>
  );
}
