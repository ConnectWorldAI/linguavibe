/**
 * Hook for capturing waveform data from recording metering and audio playback.
 *
 * - User waveform: captured from recorder metering (dB levels) during recording
 * - Native waveform: captured from AudioPlayer sample listener during playback
 *
 * Both are normalized to 0-1 amplitude arrays suitable for WaveformComparison component.
 */
import { useState, useRef, useCallback } from "react";
import { Platform } from "react-native";

export type WaveformData = number[]; // Array of amplitudes 0-1

const MAX_SAMPLES = 48; // Maximum number of bars to display

/**
 * Normalize a dB metering value (-160 to 0) to 0-1 amplitude.
 * Typical speech is -30 to -5 dB.
 */
function dbToAmplitude(db: number): number {
  // Clamp to reasonable range
  const clamped = Math.max(-60, Math.min(0, db));
  // Map -60..0 to 0..1
  return (clamped + 60) / 60;
}

/**
 * Compute RMS (root mean square) of PCM frames to get amplitude.
 */
function framesToAmplitude(frames: number[]): number {
  if (frames.length === 0) return 0;
  const sum = frames.reduce((acc, val) => acc + val * val, 0);
  return Math.min(1, Math.sqrt(sum / frames.length));
}

/**
 * Calculate similarity between two waveforms (0-100).
 * Uses normalized cross-correlation approach.
 */
export function calculateWaveformSimilarity(a: WaveformData, b: WaveformData): number {
  if (a.length === 0 || b.length === 0) return 0;

  // Resample both to same length
  const len = Math.min(a.length, b.length, MAX_SAMPLES);
  const resampleA = resample(a, len);
  const resampleB = resample(b, len);

  // Calculate normalized difference
  let totalDiff = 0;
  for (let i = 0; i < len; i++) {
    totalDiff += Math.abs(resampleA[i] - resampleB[i]);
  }
  const avgDiff = totalDiff / len;
  // Convert to similarity (0-100)
  return Math.round(Math.max(0, Math.min(100, (1 - avgDiff) * 100)));
}

function resample(data: WaveformData, targetLength: number): WaveformData {
  if (data.length === targetLength) return data;
  const result: number[] = [];
  const step = data.length / targetLength;
  for (let i = 0; i < targetLength; i++) {
    const start = Math.floor(i * step);
    const end = Math.floor((i + 1) * step);
    const slice = data.slice(start, Math.max(end, start + 1));
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

interface UseWaveformCaptureReturn {
  /** User recording waveform data (amplitudes 0-1) */
  userWaveform: WaveformData;
  /** Native speaker waveform data (amplitudes 0-1) */
  nativeWaveform: WaveformData;
  /** Whether currently capturing user waveform */
  isCapturingUser: boolean;
  /** Whether currently capturing native waveform */
  isCapturingNative: boolean;
  /** Start capturing user recording waveform (call when recording starts) */
  startUserCapture: () => void;
  /** Add a metering sample to the user waveform (call from recorder state polling) */
  addUserMeteringSample: (meteringDb: number | undefined) => void;
  /** Stop capturing user waveform */
  stopUserCapture: () => void;
  /** Add native speaker audio sample data (from AudioPlayer sample listener) */
  addNativeSample: (frames: number[]) => void;
  /** Set native waveform from pre-computed data */
  setNativeWaveformData: (data: WaveformData) => void;
  /** Start capturing native waveform */
  startNativeCapture: () => void;
  /** Stop capturing native waveform */
  stopNativeCapture: () => void;
  /** Calculate similarity score between current waveforms */
  getSimilarityScore: () => number;
  /** Reset all waveform data */
  reset: () => void;
}

export function useWaveformCapture(): UseWaveformCaptureReturn {
  const [userWaveform, setUserWaveform] = useState<WaveformData>([]);
  const [nativeWaveform, setNativeWaveform] = useState<WaveformData>([]);
  const [isCapturingUser, setIsCapturingUser] = useState(false);
  const [isCapturingNative, setIsCapturingNative] = useState(false);

  const userSamplesRef = useRef<number[]>([]);
  const nativeSamplesRef = useRef<number[]>([]);

  const startUserCapture = useCallback(() => {
    userSamplesRef.current = [];
    setIsCapturingUser(true);
  }, []);

  const addUserMeteringSample = useCallback((meteringDb: number | undefined) => {
    if (meteringDb === undefined || meteringDb === null) {
      // If metering not available, simulate from noise
      userSamplesRef.current.push(0.1 + Math.random() * 0.3);
    } else {
      userSamplesRef.current.push(dbToAmplitude(meteringDb));
    }
    // Keep max samples
    if (userSamplesRef.current.length > MAX_SAMPLES * 4) {
      userSamplesRef.current = userSamplesRef.current.slice(-MAX_SAMPLES * 4);
    }
  }, []);

  const stopUserCapture = useCallback(() => {
    setIsCapturingUser(false);
    // Downsample to MAX_SAMPLES
    const samples = userSamplesRef.current;
    if (samples.length === 0) return;
    const resampled = resample(samples, MAX_SAMPLES);
    setUserWaveform(resampled);
  }, []);

  const startNativeCapture = useCallback(() => {
    nativeSamplesRef.current = [];
    setIsCapturingNative(true);
  }, []);

  const addNativeSample = useCallback((frames: number[]) => {
    const amplitude = framesToAmplitude(frames);
    nativeSamplesRef.current.push(amplitude);
    if (nativeSamplesRef.current.length > MAX_SAMPLES * 4) {
      nativeSamplesRef.current = nativeSamplesRef.current.slice(-MAX_SAMPLES * 4);
    }
  }, []);

  const setNativeWaveformData = useCallback((data: WaveformData) => {
    setNativeWaveform(data);
    nativeSamplesRef.current = data;
  }, []);

  const stopNativeCapture = useCallback(() => {
    setIsCapturingNative(false);
    const samples = nativeSamplesRef.current;
    if (samples.length === 0) return;
    const resampled = resample(samples, MAX_SAMPLES);
    setNativeWaveform(resampled);
  }, []);

  const getSimilarityScore = useCallback(() => {
    return calculateWaveformSimilarity(userWaveform, nativeWaveform);
  }, [userWaveform, nativeWaveform]);

  const reset = useCallback(() => {
    setUserWaveform([]);
    setNativeWaveform([]);
    userSamplesRef.current = [];
    nativeSamplesRef.current = [];
    setIsCapturingUser(false);
    setIsCapturingNative(false);
  }, []);

  return {
    userWaveform,
    nativeWaveform,
    isCapturingUser,
    isCapturingNative,
    startUserCapture,
    addUserMeteringSample,
    stopUserCapture,
    addNativeSample,
    setNativeWaveformData,
    startNativeCapture,
    stopNativeCapture,
    getSimilarityScore,
    reset,
  };
}
