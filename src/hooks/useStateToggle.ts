import { useState, useCallback, useEffect } from 'react';
import { StateInfo } from '../models/types';
import { useGameManager } from '../contexts/GameManagerContext';
import { stateListManager, StateStatistics } from '../utils/StateListManager';

export interface StateToggleHook {
  states: StateInfo[];
  statistics: StateStatistics;
  isLoading: boolean;
  error: string | null;
  toggleState: (stateCode: string) => Promise<void>;
  isStateSpotted: (stateCode: string) => boolean;
  getSpottedStates: () => StateInfo[];
  getRemainingStates: () => StateInfo[];
  refreshStates: () => Promise<void>;
  clearError: () => void;
}

export function useStateToggle(): StateToggleHook {
  const { state, toggleStateSpotted, refreshGameState, clearError } = useGameManager();
  const [localError, setLocalError] = useState<string | null>(null);

  const states = state.activeGame?.stateList || [];
  const statistics = stateListManager.getStateStatistics(states);

  const toggleState = useCallback(async (stateCode: string) => {
    try {
      setLocalError(null);
      await toggleStateSpotted(stateCode);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle state';
      setLocalError(errorMessage);
      throw error;
    }
  }, [toggleStateSpotted]);

  const isStateSpotted = useCallback((stateCode: string): boolean => {
    const state = states.find(s => s.code === stateCode);
    return state?.isSpotted || false;
  }, [states]);

  const getSpottedStates = useCallback((): StateInfo[] => {
    return states.filter(state => state.isSpotted);
  }, [states]);

  const getRemainingStates = useCallback((): StateInfo[] => {
    return states.filter(state => !state.isSpotted);
  }, [states]);

  const refreshStates = useCallback(async (): Promise<void> => {
    try {
      setLocalError(null);
      await refreshGameState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh states';
      setLocalError(errorMessage);
    }
  }, [refreshGameState]);

  const handleClearError = useCallback((): void => {
    setLocalError(null);
    clearError();
  }, [clearError]);

  return {
    states,
    statistics,
    isLoading: state.isLoading,
    error: localError || state.error,
    toggleState,
    isStateSpotted,
    getSpottedStates,
    getRemainingStates,
    refreshStates,
    clearError: handleClearError,
  };
}

export interface StateListHook {
  allStates: StateInfo[];
  spottedStates: StateInfo[];
  remainingStates: StateInfo[];
  statistics: StateStatistics;
  isLoading: boolean;
  error: string | null;
  toggleState: (stateCode: string) => Promise<void>;
  refreshStates: () => Promise<void>;
  clearError: () => void;
}

export function useStateList(): StateListHook {
  const stateToggle = useStateToggle();
  
  return {
    allStates: stateToggle.states,
    spottedStates: stateToggle.getSpottedStates(),
    remainingStates: stateToggle.getRemainingStates(),
    statistics: stateToggle.statistics,
    isLoading: stateToggle.isLoading,
    error: stateToggle.error,
    toggleState: stateToggle.toggleState,
    refreshStates: stateToggle.refreshStates,
    clearError: stateToggle.clearError,
  };
}

export interface GameProgressHook {
  progress: StateStatistics | null;
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
  refreshProgress: () => Promise<void>;
  clearError: () => void;
}

export function useGameProgress(): GameProgressHook {
  const { state, refreshGameState, clearError } = useGameManager();
  
  const progress = state.activeGame ? stateListManager.getStateStatistics(state.activeGame.stateList) : null;
  const isComplete = progress ? progress.spotted === progress.total : false;

  const refreshProgress = useCallback(async (): Promise<void> => {
    try {
      await refreshGameState();
    } catch (error) {
      // Error will be handled by the context
    }
  }, [refreshGameState]);

  return {
    progress,
    isComplete,
    isLoading: state.isLoading,
    error: state.error,
    refreshProgress,
    clearError,
  };
}

export interface StateSearchHook {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredStates: StateInfo[];
  clearSearch: () => void;
}

export function useStateSearch(): StateSearchHook {
  const { state } = useGameManager();
  const states = state.activeGame?.stateList || [];
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStates = useCallback(() => {
    if (!searchQuery.trim()) {
      return states;
    }
    
    return stateListManager.searchStates(searchQuery).map(state => {
      const gameState = states.find(gs => gs.code === state.code);
      return gameState || state;
    });
  }, [searchQuery, states])();

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    setSearchQuery,
    filteredStates,
    clearSearch,
  };
}

export interface StateFilterHook {
  filterType: 'all' | 'spotted' | 'remaining';
  setFilterType: (type: 'all' | 'spotted' | 'remaining') => void;
  filteredStates: StateInfo[];
  sortBy: 'name' | 'code' | 'spotted' | 'spottedAt';
  setSortBy: (sort: 'name' | 'code' | 'spotted' | 'spottedAt') => void;
  sortedStates: StateInfo[];
}

export function useStateFilter(): StateFilterHook {
  const { state } = useGameManager();
  const states = state.activeGame?.stateList || [];
  const [filterType, setFilterType] = useState<'all' | 'spotted' | 'remaining'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'spotted' | 'spottedAt'>('name');

  const filteredStates = useCallback(() => {
    switch (filterType) {
      case 'spotted':
        return states.filter(state => state.isSpotted);
      case 'remaining':
        return states.filter(state => !state.isSpotted);
      default:
        return states;
    }
  }, [filterType, states])();

  const sortedStates = useCallback(() => {
    return stateListManager.sortStates(filteredStates, sortBy);
  }, [filteredStates, sortBy])();

  return {
    filterType,
    setFilterType,
    filteredStates,
    sortBy,
    setSortBy,
    sortedStates,
  };
}
