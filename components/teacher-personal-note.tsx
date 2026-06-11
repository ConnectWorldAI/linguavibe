/**
 * Teacher Personal Note Component
 * 
 * Shows a handwritten-style note from the teacher after lessons.
 * Personalized to the student's specific struggles and wins.
 * Feels like a real teacher left them a note on their desk.
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { generateTeacherNote } from "@/lib/teacher-memory";

interface TeacherPersonalNoteProps {
  lessonTopic: string;
  accuracy: number;
  struggles: string[];
  wins: string[];
  teacherName: string;
  onDismiss: () => void;
}

export function TeacherPersonalNote({
  lessonTopic,
  accuracy,
  struggles,
  wins,
  teacherName,
  onDismiss,
}: TeacherPersonalNoteProps) {
  const [note, setNote] = useState<{ note: string; tone: string; signoff: string } | null>(null);
  const [slideAnim] = useState(new Animated.Value(100));
  const [opacityAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadNote();
  }, []);

  const loadNote = async () => {
    const generated = await generateTeacherNote(lessonTopic, accuracy, struggles, wins);
    setNote(generated);
    
    // Animate in with a slight delay (feels like teacher is writing)
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 800);
  };

  if (!note) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.noteCard}>
        {/* Paper texture effect */}
        <View style={styles.paperEdge} />
        
        {/* Header */}
        <View style={styles.noteHeader}>
          <View style={styles.penIcon}>
            <Ionicons name="create" size={16} color="#F59E0B" />
          </View>
          <Text style={styles.noteHeaderText}>A note from {teacherName}</Text>
        </View>
        
        {/* Note content - styled to look handwritten */}
        <Text style={styles.noteText}>{note.note}</Text>
        
        {/* Sign-off */}
        <View style={styles.signoffContainer}>
          <Text style={styles.signoff}>{note.signoff}</Text>
          <Text style={styles.teacherSig}>— {teacherName}</Text>
        </View>
        
        {/* Dismiss */}
        <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss} activeOpacity={0.7}>
          <Text style={styles.dismissText}>Thanks, teacher! ❤️</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  noteCard: {
    backgroundColor: "#1C1F2E",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F59E0B30",
    overflow: "hidden",
  },
  paperEdge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: "#F59E0B",
    opacity: 0.6,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  penIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F59E0B15",
    alignItems: "center",
    justifyContent: "center",
  },
  noteHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F59E0B",
    letterSpacing: 0.3,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 24,
    color: "#E2E8F0",
    fontStyle: "italic",
    letterSpacing: 0.2,
  },
  signoffContainer: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  signoff: {
    fontSize: 14,
    color: "#94A3B8",
    fontStyle: "italic",
  },
  teacherSig: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "600",
  },
  dismissBtn: {
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#F59E0B15",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F59E0B30",
  },
  dismissText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
  },
});
