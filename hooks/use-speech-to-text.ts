/**
 * Speech-to-text hook using expo-audio recording + server transcription.
 * Records audio from the device microphone, uploads to storage,
 * and returns the transcribed text.
 *
 * Uses expo-audio SDK 54 useAudioRecorder hook for native recording.
 * Falls back to MediaRecorder API on web.
 */
import { useState, useRef, useCallback } from "react";
import { Platform } from "react-native";
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { trpc } from "@/lib/trpc";

// Audio recording state
type RecordingState = "idle" | "recording" | "uploading" | "transcribing";

interface UseSpeechToTextReturn {
  state: RecordingState;
  transcript: string;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>;
  isAvailable: boolean;
}

export function useSpeechToText(): UseSpeechToTextReturn {
  const [state, setState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const webRecordingRef = useRef<any>(null);

  // expo-audio SDK 54 recorder hook — valid at the top level of this custom hook
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const uploadMutation = trpc.voice.uploadAudio.useMutation();
  const transcribeMutation = trpc.voice.transcribe.useMutation();

  // Check if audio recording is available (not on web in most cases)
  const isAvailable = Platform.OS !== "web";

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscript("");
      setState("recording");

      if (Platform.OS === "web") {
        // Web fallback: use MediaRecorder API
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        webRecordingRef.current = { mediaRecorder, chunks, stream };
        mediaRecorder.start();
      } else {
        // Native: use expo-audio SDK 54 recorder
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          setError("Microphone permission denied");
          setState("idle");
          return;
        }

        // Configure audio mode for recording
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        // Prepare and start recording
        await recorder.prepareToRecordAsync();
        recorder.record();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start recording");
      setState("idle");
    }
  }, [recorder]);

  const stopRecording = useCallback(async (): Promise<string> => {
    try {
      setState("uploading");

      let base64Audio = "";
      let mimeType = "audio/webm";

      if (Platform.OS === "web") {
        // Web: stop MediaRecorder and get blob
        if (!webRecordingRef.current) {
          setState("idle");
          return "";
        }
        const { mediaRecorder, chunks, stream } = webRecordingRef.current;
        await new Promise<void>((resolve) => {
          mediaRecorder.onstop = () => resolve();
          mediaRecorder.stop();
        });
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop());

        const blob = new Blob(chunks, { type: "audio/webm" });
        const arrayBuffer = await blob.arrayBuffer();
        base64Audio = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
        mimeType = "audio/webm";
        webRecordingRef.current = null;
      } else {
        // Native: stop expo-audio recorder and get URI
        await recorder.stop();
        const uri = recorder.uri;

        if (uri) {
          // Read file as base64
          const FileSystem = await import("expo-file-system/legacy");
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (fileInfo.exists) {
            const base64 = await FileSystem.readAsStringAsync(uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            base64Audio = base64;
            mimeType = "audio/m4a"; // iOS records in m4a by default
          }
        }

        // Reset audio mode after recording
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
      }

      if (!base64Audio) {
        setError("No audio data captured");
        setState("idle");
        return "";
      }

      // Upload audio to server storage
      const uploadResult = await uploadMutation.mutateAsync({
        base64Audio,
        mimeType,
        filename: `agent-voice-${Date.now()}.${mimeType === "audio/m4a" ? "m4a" : "webm"}`,
      });

      setState("transcribing");

      // Transcribe the uploaded audio
      const transcribeResult = await transcribeMutation.mutateAsync({
        audioUrl: uploadResult.url,
        prompt: "Transcribe the user's voice command for a language learning app called ConnectWorld AI",
      });

      if (transcribeResult.success) {
        setTranscript(transcribeResult.text);
        setState("idle");
        return transcribeResult.text;
      } else {
        setError(transcribeResult.error || "Transcription failed");
        setState("idle");
        return "";
      }
    } catch (err) {
      // Fallback: if server is unavailable, return empty
      setError(err instanceof Error ? err.message : "Transcription failed");
      setState("idle");
      return "";
    }
  }, [recorder, uploadMutation, transcribeMutation]);

  return {
    state,
    transcript,
    error,
    startRecording,
    stopRecording,
    isAvailable,
  };
}
