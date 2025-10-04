import { useState, useCallback, useEffect } from 'react';
import { GameCompletionService, GameCompletionEvent, CompletionStats, AchievementLevel } from '../services/GameCompletionService';
import { useGameManager } from '../contexts/GameManagerContext';

export interface GameCompletionHook {
  completionEvent: GameCompletionEvent | null;
  stats: CompletionStats | null;
  isLoading: boolean;
  error: string | null;
  checkCompletion: () => Promise<GameCompletionEvent | null>;
  completeGame: () => Promise<GameCompletionEvent>;
  refreshStats: () => Promise<void>;
  getAchievementBadge: (level: AchievementLevel) => { name: string; description: string; color: string };
  formatCompletionTime: (milliseconds: number) => string;
  clearError: () => void;
}

export function useGameCompletion(): GameCompletionHook {
  const { state } = useGameManager();
  const [completionService] = useState(() => new GameCompletionService());
  const [completionEvent, setCompletionEvent] = useState<GameCompletionEvent | null>(null);
  const [stats, setStats] = useState<CompletionStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stats on mount
  useEffect(() => {
    refreshStats();
  }, []);

  const checkCompletion = useCallback(async (): Promise<GameCompletionEvent | null> => {
    if (!state.activeGame) {
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const event = await completionService.checkAndHandleCompletion(state.activeGame.game.id);
      if (event) {
        setCompletionEvent(event);
      }
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check completion';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state.activeGame, completionService]);

  const completeGame = useCallback(async (): Promise<GameCompletionEvent> => {
    if (!state.activeGame) {
      throw new Error('No active game');
    }

    setIsLoading(true);
    setError(null);

    try {
      const event = await completionService.completeGame(state.activeGame.game.id);
      setCompletionEvent(event);
      return event;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete game';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [state.activeGame, completionService]);

  const refreshStats = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const newStats = await completionService.getCompletionStats();
      setStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [completionService]);

  const getAchievementBadge = useCallback((level: AchievementLevel) => {
    return completionService.getAchievementBadge(level);
  }, [completionService]);

  const formatCompletionTime = useCallback((milliseconds: number) => {
    return completionService.formatCompletionTime(milliseconds);
  }, [completionService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    completionEvent,
    stats,
    isLoading,
    error,
    checkCompletion,
    completeGame,
    refreshStats,
    getAchievementBadge,
    formatCompletionTime,
    clearError,
  };
}

export interface CompletionCelebrationHook {
  showCelebration: boolean;
  celebrationData: GameCompletionEvent | null;
  triggerCelebration: (event: GameCompletionEvent) => void;
  hideCelebration: () => void;
}

export function useCompletionCelebration(): CompletionCelebrationHook {
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<GameCompletionEvent | null>(null);

  const triggerCelebration = useCallback((event: GameCompletionEvent) => {
    setCelebrationData(event);
    setShowCelebration(true);
  }, []);

  const hideCelebration = useCallback(() => {
    setShowCelebration(false);
    setCelebrationData(null);
  }, []);

  return {
    showCelebration,
    celebrationData,
    triggerCelebration,
    hideCelebration,
  };
}

export interface AchievementHook {
  milestones: Array<{milestone: string; achieved: boolean; progress: number}>;
  isLoading: boolean;
  error: string | null;
  refreshMilestones: () => Promise<void>;
  clearError: () => void;
}

export function useAchievements(): AchievementHook {
  const [completionService] = useState(() => new GameCompletionService());
  const [milestones, setMilestones] = useState<Array<{milestone: string; achieved: boolean; progress: number}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshMilestones = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const newMilestones = await completionService.checkMilestones();
      setMilestones(newMilestones);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load milestones';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [completionService]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Load milestones on mount
  useEffect(() => {
    refreshMilestones();
  }, [refreshMilestones]);

  return {
    milestones,
    isLoading,
    error,
    refreshMilestones,
    clearError,
  };
}
