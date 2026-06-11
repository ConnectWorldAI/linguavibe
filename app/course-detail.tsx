import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConfettiOverlay } from "@/components/confetti-overlay";

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
  glowSubtle: "rgba(0,170,255,0.08)",
  glowBorder: "rgba(0,170,255,0.2)",
};

const COURSE_DATA = {
  title: "Dominican Spanish: From Zero to Fluent",
  instructor: "Sophia Martinez",
  rating: 4.9,
  students: 2340,
  duration: "8 hrs",
  lessons: 42,
  level: "Beginner",
  language: "Spanish (Dominican)",
  certified: true,
  description: "Master Dominican Spanish with real-world conversations, slang, cultural context, and practical scenarios. Perfect for beginners who want to sound natural, not textbook.",
  whatYouLearn: [
    "Greet and introduce yourself like a local",
    "Navigate everyday conversations confidently",
    "Understand Dominican slang and expressions",
    "Order food, ask for directions, and negotiate",
    "Discuss work, family, and hobbies fluently",
    "Pass the A2/B1 certification exam",
  ],
  sections: [
    {
      title: "Getting Started",
      lessons: [
        { id: "1", title: "Welcome & Course Overview", duration: "5:30", type: "video", completed: true },
        { id: "2", title: "The Dominican Alphabet & Sounds", duration: "12:00", type: "video", completed: true },
        { id: "3", title: "Basic Greetings & Introductions", duration: "15:00", type: "video", completed: true },
        { id: "4", title: "Practice: Introduce Yourself", duration: "8:00", type: "exercise", completed: false },
      ],
    },
    {
      title: "Everyday Conversations",
      lessons: [
        { id: "5", title: "At the Colmado (Corner Store)", duration: "14:00", type: "video", completed: false },
        { id: "6", title: "Ordering Food & Drinks", duration: "18:00", type: "video", completed: false },
        { id: "7", title: "Asking for Directions", duration: "12:00", type: "video", completed: false },
        { id: "8", title: "Quiz: Everyday Phrases", duration: "5:00", type: "quiz", completed: false },
      ],
    },
    {
      title: "Dominican Slang & Culture",
      lessons: [
        { id: "9", title: "Top 50 Dominican Slang Words", duration: "20:00", type: "video", completed: false },
        { id: "10", title: "Music & Bachata Vocabulary", duration: "16:00", type: "video", completed: false },
        { id: "11", title: "Cultural Do's and Don'ts", duration: "10:00", type: "video", completed: false },
        { id: "12", title: "Practice: Slang in Context", duration: "8:00", type: "exercise", completed: false },
      ],
    },
    {
      title: "Business & Professional",
      lessons: [
        { id: "13", title: "Workplace Introductions", duration: "14:00", type: "video", completed: false },
        { id: "14", title: "Phone Calls & Emails", duration: "18:00", type: "video", completed: false },
        { id: "15", title: "Job Interview Preparation", duration: "22:00", type: "video", completed: false },
        { id: "16", title: "Final Certification Exam", duration: "30:00", type: "quiz", completed: false },
      ],
    },
  ],
};

// ─── Reviews & Ratings Component ──────────────────────────────────────────
interface Review {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  text: string;
  date: string;
  helpful: number;
}

const SAMPLE_REVIEWS: Review[] = [
  { id: "r1", name: "Maria G.", avatar: "👩", rating: 5, text: "Excellent course! The instructor explains concepts clearly and the practice exercises are very helpful for real-world conversations.", date: "May 15, 2026", helpful: 24 },
  { id: "r2", name: "James L.", avatar: "👨", rating: 4, text: "Great content and well-structured lessons. Would love more advanced vocabulary sections.", date: "May 10, 2026", helpful: 18 },
  { id: "r3", name: "Aisha K.", avatar: "👩‍💼", rating: 5, text: "This course helped me prepare for my bilingual interview. The business Spanish module is outstanding.", date: "May 3, 2026", helpful: 31 },
  { id: "r4", name: "Carlos R.", avatar: "👨‍💻", rating: 4, text: "Very practical approach to learning. The dual subtitle feature during video lessons is a game changer.", date: "Apr 28, 2026", helpful: 12 },
];

function ReviewsSection() {
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadReview = async () => {
      const saved = await AsyncStorage.getItem("course_review_spanish_b2");
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserRating(parsed.rating);
        setReviewText(parsed.text);
        setSubmitted(true);
      }
    };
    loadReview();
  }, []);

  const handleSubmitReview = async () => {
    if (userRating === 0) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newReview: Review = {
      id: `user_${Date.now()}`,
      name: "You",
      avatar: "🙂",
      rating: userRating,
      text: reviewText,
      date: "Just now",
      helpful: 0,
    };
    setReviews([newReview, ...reviews]);
    setSubmitted(true);
    await AsyncStorage.setItem("course_review_spanish_b2", JSON.stringify({ rating: userRating, text: reviewText }));
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <View style={reviewStyles.container}>
      <Text style={reviewStyles.title}>Reviews & Ratings</Text>

      {/* Rating Summary */}
      <View style={reviewStyles.summaryCard}>
        <View style={reviewStyles.summaryLeft}>
          <Text style={reviewStyles.avgRating}>{avgRating}</Text>
          <View style={reviewStyles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Ionicons
                key={s}
                name={s <= Math.round(Number(avgRating)) ? "star" : "star-outline"}
                size={14}
                color={Colors.gold}
              />
            ))}
          </View>
          <Text style={reviewStyles.reviewCount}>{reviews.length} reviews</Text>
        </View>
        <View style={reviewStyles.summaryRight}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <View key={star} style={reviewStyles.barRow}>
                <Text style={reviewStyles.barLabel}>{star}</Text>
                <View style={reviewStyles.barTrack}>
                  <View style={[reviewStyles.barFill, { width: `${pct}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Write Review */}
      {!submitted ? (
        <View style={reviewStyles.writeSection}>
          <Text style={reviewStyles.writeTitle}>Rate this course</Text>
          <View style={reviewStyles.starInput}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setUserRating(s);
                }}
              >
                <Ionicons
                  name={s <= userRating ? "star" : "star-outline"}
                  size={28}
                  color={s <= userRating ? Colors.gold : Colors.textMuted}
                />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={reviewStyles.reviewInput}
            placeholder="Write your review (optional)..."
            placeholderTextColor={Colors.textMuted}
            multiline
            value={reviewText}
            onChangeText={setReviewText}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[reviewStyles.submitBtn, userRating === 0 && { opacity: 0.5 }]}
            onPress={handleSubmitReview}
            disabled={userRating === 0}
            activeOpacity={0.8}
          >
            <Text style={reviewStyles.submitBtnText}>Submit Review</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={reviewStyles.submittedBanner}>
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
          <Text style={reviewStyles.submittedText}>Your review has been submitted</Text>
        </View>
      )}

      {/* Reviews List */}
      {displayedReviews.map((review) => (
        <View key={review.id} style={reviewStyles.reviewCard}>
          <View style={reviewStyles.reviewHeader}>
            <View style={reviewStyles.reviewAvatar}>
              <Text style={{ fontSize: 18 }}>{review.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={reviewStyles.reviewName}>{review.name}</Text>
              <View style={reviewStyles.reviewStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= review.rating ? "star" : "star-outline"}
                    size={12}
                    color={Colors.gold}
                  />
                ))}
                <Text style={reviewStyles.reviewDate}>{review.date}</Text>
              </View>
            </View>
          </View>
          {review.text ? <Text style={reviewStyles.reviewText}>{review.text}</Text> : null}
          <View style={reviewStyles.reviewFooter}>
            <TouchableOpacity style={reviewStyles.helpfulBtn}>
              <Ionicons name="thumbs-up-outline" size={14} color={Colors.textMuted} />
              <Text style={reviewStyles.helpfulText}>Helpful ({review.helpful})</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {reviews.length > 3 && !showAll && (
        <TouchableOpacity style={reviewStyles.showAllBtn} onPress={() => setShowAll(true)}>
          <Text style={reviewStyles.showAllText}>Show all {reviews.length} reviews</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const reviewStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 20 },
  title: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  summaryLeft: { alignItems: "center", justifyContent: "center", width: 80 },
  avgRating: { fontSize: 32, fontWeight: "800", color: Colors.textPrimary },
  starsRow: { flexDirection: "row", gap: 2, marginTop: 4 },
  reviewCount: { fontSize: 11, color: Colors.textMuted, marginTop: 4 },
  summaryRight: { flex: 1, marginLeft: 16, justifyContent: "center", gap: 4 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barLabel: { fontSize: 11, color: Colors.textMuted, width: 12, textAlign: "center" },
  barTrack: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", backgroundColor: Colors.gold, borderRadius: 3 },
  writeSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  writeTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary, marginBottom: 10 },
  starInput: { flexDirection: "row", gap: 8, marginBottom: 12 },
  reviewInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  submitBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  submittedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,230,118,0.1)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  submittedText: { fontSize: 13, fontWeight: "600", color: Colors.success },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewName: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  reviewStars: { flexDirection: "row", alignItems: "center", gap: 2, marginTop: 2 },
  reviewDate: { fontSize: 11, color: Colors.textMuted, marginLeft: 8 },
  reviewText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginTop: 10 },
  reviewFooter: { flexDirection: "row", marginTop: 10 },
  helpfulBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  helpfulText: { fontSize: 11, color: Colors.textMuted },
  showAllBtn: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  showAllText: { fontSize: 13, fontWeight: "600", color: Colors.secondary },
});

// ─── Instructor Q&A Component ────────────────────────────────────────────────
interface QAItem {
  id: string;
  question: string;
  author: string;
  avatar: string;
  date: string;
  upvotes: number;
  reply?: { text: string; date: string };
}

const SAMPLE_QA: QAItem[] = [
  {
    id: "q1",
    question: "Can you explain the difference between 'ser' and 'estar' in more detail? The lesson covered it briefly.",
    author: "David M.",
    avatar: "👨‍🎓",
    date: "May 18, 2026",
    upvotes: 12,
    reply: { text: "Great question! 'Ser' is for permanent states (identity, origin, profession) while 'estar' is for temporary states (emotions, location, conditions). I'll add a bonus lesson on this topic next week!", date: "May 19, 2026" },
  },
  {
    id: "q2",
    question: "Is there a recommended way to practice the subjunctive mood outside of the lessons?",
    author: "Lisa T.",
    avatar: "👩‍💻",
    date: "May 15, 2026",
    upvotes: 8,
    reply: { text: "Try writing short diary entries using subjunctive triggers like 'espero que', 'dudo que', 'es posible que'. Start with 3 sentences a day and increase gradually.", date: "May 16, 2026" },
  },
  {
    id: "q3",
    question: "Will there be additional content on business email writing in Spanish?",
    author: "Marcus J.",
    avatar: "👨‍💼",
    date: "May 12, 2026",
    upvotes: 15,
    reply: undefined,
  },
  {
    id: "q4",
    question: "The pronunciation exercises are great! Any tips for rolling the 'rr' sound?",
    author: "Sophie L.",
    avatar: "👩",
    date: "May 10, 2026",
    upvotes: 6,
    reply: { text: "Place your tongue just behind your upper teeth and exhale with a vibration. Practice with words like 'perro', 'carro', 'arroz'. Start slowly and speed up. It takes most learners 2-3 weeks of daily practice!", date: "May 11, 2026" },
  },
];

function QASection() {
  const [questions, setQuestions] = useState<QAItem[]>(SAMPLE_QA);
  const [newQuestion, setNewQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "upvotes">("recent");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      const saved = await AsyncStorage.getItem("course_qa_spanish_b2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.userQuestion) {
          setSubmitted(true);
        }
      }
    };
    loadQuestions();
  }, []);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newQ: QAItem = {
      id: `user_${Date.now()}`,
      question: newQuestion.trim(),
      author: "You",
      avatar: "🙂",
      date: "Just now",
      upvotes: 0,
      reply: undefined,
    };
    setQuestions([newQ, ...questions]);
    setSubmitted(true);
    await AsyncStorage.setItem("course_qa_spanish_b2", JSON.stringify({ userQuestion: newQuestion }));
    setNewQuestion("");
  };

  const handleUpvote = (id: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setQuestions(questions.map((q) => q.id === id ? { ...q, upvotes: q.upvotes + 1 } : q));
  };

  const sortedQuestions = [...questions].sort((a, b) =>
    sortBy === "upvotes" ? b.upvotes - a.upvotes : 0
  );
  const displayedQuestions = showAll ? sortedQuestions : sortedQuestions.slice(0, 3);

  return (
    <View style={qaStyles.container}>
      <View style={qaStyles.headerRow}>
        <Text style={qaStyles.title}>Q&A ({questions.length})</Text>
        <View style={qaStyles.sortRow}>
          <TouchableOpacity
            style={[qaStyles.sortBtn, sortBy === "recent" && qaStyles.sortBtnActive]}
            onPress={() => setSortBy("recent")}
          >
            <Text style={[qaStyles.sortBtnText, sortBy === "recent" && qaStyles.sortBtnTextActive]}>Recent</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[qaStyles.sortBtn, sortBy === "upvotes" && qaStyles.sortBtnActive]}
            onPress={() => setSortBy("upvotes")}
          >
            <Text style={[qaStyles.sortBtnText, sortBy === "upvotes" && qaStyles.sortBtnTextActive]}>Top</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Ask Question */}
      {!submitted ? (
        <View style={qaStyles.askSection}>
          <TextInput
            style={qaStyles.askInput}
            placeholder="Ask the instructor a question..."
            placeholderTextColor={Colors.textMuted}
            multiline
            value={newQuestion}
            onChangeText={setNewQuestion}
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[qaStyles.askBtn, !newQuestion.trim() && { opacity: 0.5 }]}
            onPress={handleSubmitQuestion}
            disabled={!newQuestion.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color="#FFFFFF" />
            <Text style={qaStyles.askBtnText}>Submit Question</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={qaStyles.submittedBanner}>
          <Ionicons name="chatbubble-ellipses" size={16} color={Colors.secondary} />
          <Text style={qaStyles.submittedText}>Your question has been submitted. The instructor will reply soon.</Text>
        </View>
      )}

      {/* Questions List */}
      {displayedQuestions.map((q) => (
        <View key={q.id} style={qaStyles.questionCard}>
          <View style={qaStyles.questionHeader}>
            <View style={qaStyles.questionAvatar}>
              <Text style={{ fontSize: 16 }}>{q.avatar}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={qaStyles.questionAuthor}>{q.author}</Text>
              <Text style={qaStyles.questionDate}>{q.date}</Text>
            </View>
            <TouchableOpacity style={qaStyles.upvoteBtn} onPress={() => handleUpvote(q.id)}>
              <Ionicons name="arrow-up" size={14} color={Colors.textSecondary} />
              <Text style={qaStyles.upvoteCount}>{q.upvotes}</Text>
            </TouchableOpacity>
          </View>
          <Text style={qaStyles.questionText}>{q.question}</Text>
          {q.reply && (
            <View style={qaStyles.replyCard}>
              <View style={qaStyles.replyHeader}>
                <View style={qaStyles.replyBadge}>
                  <Ionicons name="school" size={12} color={Colors.gold} />
                  <Text style={qaStyles.replyBadgeText}>Instructor</Text>
                </View>
                <Text style={qaStyles.replyDate}>{q.reply.date}</Text>
              </View>
              <Text style={qaStyles.replyText}>{q.reply.text}</Text>
            </View>
          )}
          {!q.reply && (
            <View style={qaStyles.pendingReply}>
              <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
              <Text style={qaStyles.pendingText}>Awaiting instructor reply</Text>
            </View>
          )}
        </View>
      ))}

      {questions.length > 3 && !showAll && (
        <TouchableOpacity style={qaStyles.showAllBtn} onPress={() => setShowAll(true)}>
          <Text style={qaStyles.showAllText}>Show all {questions.length} questions</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const qaStyles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  title: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary },
  sortRow: { flexDirection: "row", gap: 6 },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sortBtnActive: { backgroundColor: Colors.secondary },
  sortBtnText: { fontSize: 11, fontWeight: "600", color: Colors.textMuted },
  sortBtnTextActive: { color: "#FFFFFF" },
  askSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  askInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  askBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
  },
  askBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  submittedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.glowSubtle,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  submittedText: { fontSize: 12, fontWeight: "600", color: Colors.secondary, flex: 1 },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questionHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  questionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  questionAuthor: { fontSize: 13, fontWeight: "700", color: Colors.textPrimary },
  questionDate: { fontSize: 11, color: Colors.textMuted },
  upvoteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  upvoteCount: { fontSize: 12, fontWeight: "700", color: Colors.textSecondary },
  questionText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, marginTop: 10 },
  replyCard: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(255,184,0,0.06)",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
  },
  replyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  replyBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  replyBadgeText: { fontSize: 11, fontWeight: "700", color: Colors.gold },
  replyDate: { fontSize: 10, color: Colors.textMuted },
  replyText: { fontSize: 13, color: Colors.textPrimary, lineHeight: 20 },
  pendingReply: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pendingText: { fontSize: 11, color: Colors.textMuted },
  showAllBtn: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  showAllText: { fontSize: 13, fontWeight: "600", color: Colors.secondary },
});

export default function CourseDetailScreen() {
  const router = useRouter();
  const [enrolled, setEnrolled] = useState(true);
  const [expandedSection, setExpandedSection] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const totalLessons = COURSE_DATA.sections.reduce((sum, s) => sum + s.lessons.length, 0);
  const completedLessons = COURSE_DATA.sections.reduce(
    (sum, s) => sum + s.lessons.filter((l) => l.completed).length,
    0
  );
  const progress = completedLessons / totalLessons;

  // Check if course just completed (all lessons done)
  useEffect(() => {
    const checkCompletion = async () => {
      if (progress >= 1.0) {
        const alreadyCelebrated = await AsyncStorage.getItem(`course_celebrated_${COURSE_DATA.title}`);
        if (!alreadyCelebrated) {
          setShowConfetti(true);
          await AsyncStorage.setItem(`course_celebrated_${COURSE_DATA.title}`, "true");
          // Auto-generate certificate
          await generateCertificate();
        }
      }
    };
    checkCompletion();
  }, [progress]);

  const generateCertificate = async () => {
    try {
      const now = new Date();
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const dateStr = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
      const credId = `CM-${COURSE_DATA.language?.slice(0,2).toUpperCase() || "LN"}-${now.getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
      const newCert = {
        id: `auto_${Date.now()}`,
        title: `${COURSE_DATA.title} - Completion`,
        issuer: "ConnectWorld AI",
        date: dateStr,
        icon: "ribbon",
        color: "#FFB800",
        verified: true,
        language: COURSE_DATA.language || "Spanish",
        type: "language",
        credentialId: credId,
        skills: COURSE_DATA.sections.map((s: any) => s.title).slice(0, 3),
      };
      const stored = await AsyncStorage.getItem("@connectworld_auto_certificates");
      const certs = stored ? JSON.parse(stored) : [];
      certs.unshift(newCert);
      await AsyncStorage.setItem("@connectworld_auto_certificates", JSON.stringify(certs));
    } catch {}
  };

  const handleEnroll = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEnrolled(true);
  };

  const toggleSection = (index: number) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === index ? -1 : index);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-outline" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroThumb}>
            <Text style={{ fontSize: 48 }}>🇩🇴</Text>
            <View style={styles.heroPlayBtn}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </View>
          </View>
          {COURSE_DATA.certified && (
            <View style={styles.certifiedBanner}>
              <Ionicons name="ribbon" size={14} color="#FFFFFF" />
              <Text style={styles.certifiedText}>Certificate Included</Text>
            </View>
          )}
        </View>

        {/* Title & Meta */}
        <View style={styles.titleSection}>
          <Text style={styles.courseTitle}>{COURSE_DATA.title}</Text>
          <Text style={styles.courseInstructor}>by {COURSE_DATA.instructor}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="star" size={14} color={Colors.gold} />
              <Text style={styles.metaText}>{COURSE_DATA.rating}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{COURSE_DATA.students.toLocaleString()}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{COURSE_DATA.duration}</Text>
            </View>
            <View style={styles.levelTag}>
              <Text style={styles.levelTagText}>{COURSE_DATA.level}</Text>
            </View>
          </View>

          <Text style={styles.description}>{COURSE_DATA.description}</Text>
        </View>

        {/* Progress (if enrolled) */}
        {enrolled && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Your Progress</Text>
              <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressMeta}>
              {completedLessons} of {totalLessons} lessons completed
            </Text>
          </View>
        )}

        {/* What You'll Learn */}
        <View style={styles.learnSection}>
          <Text style={styles.sectionTitle}>What You'll Learn</Text>
          {COURSE_DATA.whatYouLearn.map((item, i) => (
            <View key={i} style={styles.learnItem}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={styles.learnText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Course Content */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Course Content</Text>
          <Text style={styles.contentMeta}>
            {COURSE_DATA.sections.length} sections • {totalLessons} lessons • {COURSE_DATA.duration}
          </Text>

          {COURSE_DATA.sections.map((section, sIndex) => (
            <View key={sIndex} style={styles.sectionCard}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(sIndex)} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionName}>{section.title}</Text>
                  <Text style={styles.sectionLessonCount}>{section.lessons.length} lessons</Text>
                </View>
                <Ionicons
                  name={expandedSection === sIndex ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {expandedSection === sIndex && (
                <View style={styles.lessonList}>
                  {section.lessons.map((lesson) => (
                    <TouchableOpacity key={lesson.id} style={styles.lessonRow} activeOpacity={0.7} onPress={() => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: "/lesson-player", params: { lessonId: lesson.id, lessonTitle: lesson.title, courseName: COURSE_DATA.title } }); }}>
                      <View style={styles.lessonIcon}>
                        {lesson.completed ? (
                          <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                        ) : lesson.type === "video" ? (
                          <Ionicons name="play-circle" size={20} color={Colors.secondary} />
                        ) : lesson.type === "quiz" ? (
                          <Ionicons name="help-circle" size={20} color={Colors.gold} />
                        ) : (
                          <Ionicons name="pencil" size={20} color="#8B5CF6" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.lessonTitle, lesson.completed && styles.lessonCompleted]}>
                          {lesson.title}
                        </Text>
                        <Text style={styles.lessonDuration}>{lesson.duration}</Text>
                      </View>
                      {lesson.type === "video" && (
                        <Ionicons name="play" size={14} color={Colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Instructor */}
        <View style={styles.instructorSection}>
          <Text style={styles.sectionTitle}>Instructor</Text>
          <TouchableOpacity
            style={styles.instructorCard}
            activeOpacity={0.7}
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/instructor-bio" as any);
            }}
          >
            <View style={styles.instructorAvatar}>
              <Text style={{ fontSize: 24 }}>👩‍🏫</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instructorName}>{COURSE_DATA.instructor}</Text>
              <Text style={styles.instructorBio}>Native Dominican speaker • 5+ years teaching • 4,500+ students</Text>
              <View style={styles.instructorStats}>
                <Ionicons name="star" size={12} color={Colors.gold} />
                <Text style={styles.instructorRating}>4.9 instructor rating</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Reviews & Ratings */}
        <ReviewsSection />

        {/* Instructor Q&A */}
        <QASection />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      {!enrolled ? (
        <View style={styles.bottomCta}>
          <View>
            <Text style={styles.priceLabel}>Free</Text>
            <Text style={styles.priceNote}>Certificate included</Text>
          </View>
          <TouchableOpacity style={styles.enrollBtn} onPress={handleEnroll} activeOpacity={0.8}>
            <Text style={styles.enrollBtnText}>Enroll Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bottomCta}>
          <View>
            <Text style={styles.priceLabel}>{Math.round(progress * 100)}% Complete</Text>
            <Text style={styles.priceNote}>Continue where you left off</Text>
          </View>
          <TouchableOpacity style={styles.enrollBtn} activeOpacity={0.8}>
            <Ionicons name="play" size={16} color="#FFFFFF" />
            <Text style={styles.enrollBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Course Completion Confetti */}
      <ConfettiOverlay
        visible={showConfetti}
        courseName={COURSE_DATA.title}
        onDismiss={() => setShowConfetti(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  header: {
    flexDirection: "row",
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
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: { alignItems: "center", paddingVertical: 20 },
  heroThumb: {
    width: 200,
    height: 120,
    borderRadius: 16,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.glowBorder,
    position: "relative",
  },
  heroPlayBtn: {
    position: "absolute",
    bottom: -12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  certifiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 20,
  },
  certifiedText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  titleSection: { paddingHorizontal: 20, paddingTop: 16 },
  courseTitle: { fontSize: 22, fontWeight: "800", color: Colors.textPrimary, marginBottom: 6 },
  courseInstructor: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 13, fontWeight: "600", color: Colors.textSecondary },
  levelTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(0,170,255,0.15)",
  },
  levelTagText: { fontSize: 11, fontWeight: "700", color: Colors.secondary },
  description: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  progressSection: {
    margin: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glowBorder,
  },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  progressTitle: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  progressPercent: { fontSize: 14, fontWeight: "800", color: Colors.secondary },
  progressBar: { height: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.secondary, borderRadius: 3 },
  progressMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  learnSection: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: Colors.textPrimary, marginBottom: 14 },
  learnItem: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  learnText: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  contentSection: { paddingHorizontal: 20, paddingBottom: 20 },
  contentMeta: { fontSize: 13, color: Colors.textMuted, marginBottom: 14 },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  sectionName: { fontSize: 14, fontWeight: "700", color: Colors.textPrimary },
  sectionLessonCount: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  lessonList: { borderTopWidth: 1, borderTopColor: Colors.border },
  lessonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lessonIcon: { width: 24 },
  lessonTitle: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary },
  lessonCompleted: { color: Colors.textMuted, textDecorationLine: "line-through" },
  lessonDuration: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  instructorSection: { paddingHorizontal: 20, paddingBottom: 20 },
  instructorCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.glowSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  instructorName: { fontSize: 15, fontWeight: "700", color: Colors.textPrimary },
  instructorBio: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  instructorStats: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  instructorRating: { fontSize: 11, fontWeight: "600", color: Colors.gold },
  bottomCta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceLabel: { fontSize: 16, fontWeight: "800", color: Colors.textPrimary },
  priceNote: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  enrollBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  enrollBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
