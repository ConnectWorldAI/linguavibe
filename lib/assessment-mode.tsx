import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AssessmentMode = 'idle' | 'active' | 'locked';

export interface AssessmentModeState {
  mode: AssessmentMode;
  lockedTools: string[];
  verificationRequired: boolean;
  trustScore: number;
  currentAssessmentId: string | null;
}

export interface AssessmentModeActions {
  startAssessment: (id: string) => void;
  endAssessment: () => void;
  lockTool: (name: string) => void;
  unlockTool: (name: string) => void;
  requireVerification: () => void;
  completeVerification: () => void;
  updateTrustScore: (delta: number) => void;
}

export type AssessmentModeContextType = AssessmentModeState & AssessmentModeActions;

export const AssessmentModeContext = createContext<AssessmentModeContextType | undefined>(undefined);

const CREATIVE_TOOLS = [
  'song-player',
  'voice-clone',
  'stem-separator',
  'studio-library',
  'vocal-translator'
];

const TRUST_SCORE_STORAGE_KEY = '@ConnectWorldAI:trustScore';

interface AssessmentModeProviderProps {
  children: ReactNode;
}

export const AssessmentModeProvider: React.FC<AssessmentModeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<AssessmentMode>('idle');
  const [lockedTools, setLockedTools] = useState<string[]>([]);
  const [verificationRequired, setVerificationRequired] = useState<boolean>(false);
  const [trustScore, setTrustScore] = useState<number>(50);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);

  useEffect(() => {
    const loadTrustScore = async () => {
      try {
        const storedScore = await AsyncStorage.getItem(TRUST_SCORE_STORAGE_KEY);
        if (storedScore !== null) {
          setTrustScore(Number(storedScore));
        }
      } catch (error) {
        console.error('Failed to load trust score from AsyncStorage', error);
      }
    };
    loadTrustScore();
  }, []);

  const saveTrustScore = async (score: number) => {
    try {
      await AsyncStorage.setItem(TRUST_SCORE_STORAGE_KEY, score.toString());
    } catch (error) {
      console.error('Failed to save trust score to AsyncStorage', error);
    }
  };

  const startAssessment = (id: string) => {
    setMode('active');
    setCurrentAssessmentId(id);
    setLockedTools([...CREATIVE_TOOLS]);
  };

  const endAssessment = () => {
    setMode('idle');
    setCurrentAssessmentId(null);
    setLockedTools([]);
    setVerificationRequired(false);
  };

  const lockTool = (name: string) => {
    setLockedTools((prev) => {
      if (!prev.includes(name)) {
        return [...prev, name];
      }
      return prev;
    });
  };

  const unlockTool = (name: string) => {
    setLockedTools((prev) => prev.filter((tool) => tool !== name));
  };

  const requireVerification = () => {
    setVerificationRequired(true);
    setMode('locked');
  };

  const completeVerification = () => {
    setVerificationRequired(false);
    if (currentAssessmentId) {
      setMode('active');
    } else {
      setMode('idle');
    }
  };

  const updateTrustScore = (delta: number) => {
    setTrustScore((prev) => {
      const newScore = Math.max(0, Math.min(100, prev + delta));
      saveTrustScore(newScore);
      return newScore;
    });
  };

  const value: AssessmentModeContextType = {
    mode,
    lockedTools,
    verificationRequired,
    trustScore,
    currentAssessmentId,
    startAssessment,
    endAssessment,
    lockTool,
    unlockTool,
    requireVerification,
    completeVerification,
    updateTrustScore,
  };

  return (
    <AssessmentModeContext.Provider value={value}>
      {children}
    </AssessmentModeContext.Provider>
  );
};

export const useAssessmentMode = (): AssessmentModeContextType => {
  const context = useContext(AssessmentModeContext);
  if (context === undefined) {
    throw new Error('useAssessmentMode must be used within an AssessmentModeProvider');
  }
  return context;
};
