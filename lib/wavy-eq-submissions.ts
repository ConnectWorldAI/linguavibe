import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@wavy_eq_submissions";

export type RecordingSubmission = {
  id: string;
  assignmentTitle: string;
  mode: "full" | "punch-in" | "word-by-word";
  duration: number; // seconds
  sectionsRecorded: number;
  totalSections: number;
  completedAt: string; // ISO date
  score?: number; // optional AI quality score
};

/**
 * Get all saved recording submissions
 */
export async function getSubmissions(): Promise<RecordingSubmission[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

/**
 * Save a new recording submission
 */
export async function saveSubmission(
  submission: Omit<RecordingSubmission, "id" | "completedAt">
): Promise<RecordingSubmission> {
  const newSubmission: RecordingSubmission = {
    ...submission,
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    completedAt: new Date().toISOString(),
  };

  const existing = await getSubmissions();
  const updated = [newSubmission, ...existing];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSubmission;
}

/**
 * Delete a submission by ID
 */
export async function deleteSubmission(id: string): Promise<void> {
  const existing = await getSubmissions();
  const filtered = existing.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Get total number of submissions
 */
export async function getSubmissionCount(): Promise<number> {
  const submissions = await getSubmissions();
  return submissions.length;
}

/**
 * Get average score across all submissions that have scores
 */
export async function getAverageScore(): Promise<number | null> {
  const submissions = await getSubmissions();
  const scored = submissions.filter((s) => s.score !== undefined);
  if (scored.length === 0) return null;
  const total = scored.reduce((sum, s) => sum + (s.score || 0), 0);
  return Math.round(total / scored.length);
}

/**
 * Get recent submissions (last N)
 */
export async function getRecentSubmissions(count: number = 5): Promise<RecordingSubmission[]> {
  const submissions = await getSubmissions();
  return submissions.slice(0, count);
}
