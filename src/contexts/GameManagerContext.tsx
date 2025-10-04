import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { GameService, GameState, CreateGameData } from '../services/GameService';
import { Game, GameProgress, StateInfo } from '../models/types';

// Action types
export enum GameActionType {
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_ACTIVE_GAME = 'SET_ACTIVE_GAME',
  CLEAR_ACTIVE_GAME = 'CLEAR_ACTIVE_GAME',
  UPDATE_GAME_PROGRESS = 'UPDATE_GAME_PROGRESS',
  TOGGLE_STATE = 'TOGGLE_STATE',
  REFRESH_GAME_STATE = 'REFRESH_GAME_STATE',
}

// Action interfaces
interface SetLoadingAction {
  type: GameActionType.SET_LOADING;
  payload: boolean;
}

interface SetErrorAction {
  type: GameActionType.SET_ERROR;
  payload: string | null;
}

interface SetActiveGameAction {
  type: GameActionType.SET_ACTIVE_GAME;
  payload: GameState;
}

interface ClearActiveGameAction {
  type: GameActionType.CLEAR_ACTIVE_GAME;
}

interface UpdateGameProgressAction {
  type: GameActionType.UPDATE_GAME_PROGRESS;
  payload: GameProgress;
}

interface ToggleStateAction {
  type: GameActionType.TOGGLE_STATE;
  payload: { stateCode: string; isSpotted: boolean; spottedAt?: string };
}

interface RefreshGameStateAction {
  type: GameActionType.REFRESH_GAME_STATE;
  payload: GameState;
}

export type GameAction = 
  | SetLoadingAction
  | SetErrorAction
  | SetActiveGameAction
  | ClearActiveGameAction
  | UpdateGameProgressAction
  | ToggleStateAction
  | RefreshGameStateAction;

// State interface
export interface GameManagerState {
  isLoading: boolean;
  error: string | null;
  activeGame: GameState | null;
  gameService: GameService;
}

// Context interface
export interface GameManagerContextType {
  state: GameManagerState;
  createGame: (gameData: CreateGameData) => Promise<Game>;
  loadActiveGame: () => Promise<void>;
  toggleStateSpotted: (stateCode: string) => Promise<boolean>;
  completeGame: () => Promise<void>;
  deleteGame: () => Promise<void>;
  refreshGameState: () => Promise<void>;
  clearError: () => void;
}

// Initial state
const initialState: GameManagerState = {
  isLoading: false,
  error: null,
  activeGame: null,
  gameService: new GameService(),
};

// Reducer
function gameManagerReducer(state: GameManagerState, action: GameAction): GameManagerState {
  switch (action.type) {
    case GameActionType.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };

    case GameActionType.SET_ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    case GameActionType.SET_ACTIVE_GAME:
      return {
        ...state,
        isLoading: false,
        error: null,
        activeGame: action.payload,
      };

    case GameActionType.CLEAR_ACTIVE_GAME:
      return {
        ...state,
        activeGame: null,
        error: null,
      };

    case GameActionType.UPDATE_GAME_PROGRESS:
      return {
        ...state,
        activeGame: state.activeGame ? {
          ...state.activeGame,
          progress: action.payload,
        } : null,
      };

    case GameActionType.TOGGLE_STATE:
      if (!state.activeGame) return state;

      const updatedStateList = state.activeGame.stateList.map(stateInfo => {
        if (stateInfo.code === action.payload.stateCode) {
          return {
            ...stateInfo,
            isSpotted: action.payload.isSpotted,
            spottedAt: action.payload.spottedAt,
          };
        }
        return stateInfo;
      });

      const updatedSpottedStates = action.payload.isSpotted
        ? [...state.activeGame.spottedStates, {
            id: `temp_${Date.now()}`,
            gameId: state.activeGame.game.id,
            stateCode: action.payload.stateCode,
            spottedAt: action.payload.spottedAt || new Date().toISOString(),
          }]
        : state.activeGame.spottedStates.filter(ss => ss.stateCode !== action.payload.stateCode);

      const newProgress: GameProgress = {
        found: updatedSpottedStates.length,
        total: 50,
        percentage: Math.round((updatedSpottedStates.length / 50) * 100),
      };

      return {
        ...state,
        activeGame: {
          ...state.activeGame,
          progress: newProgress,
          spottedStates: updatedSpottedStates,
          stateList: updatedStateList,
        },
      };

    case GameActionType.REFRESH_GAME_STATE:
      return {
        ...state,
        isLoading: false,
        error: null,
        activeGame: action.payload,
      };

    default:
      return state;
  }
}

// Context
const GameManagerContext = createContext<GameManagerContextType | undefined>(undefined);

// Provider component
export interface GameManagerProviderProps {
  children: ReactNode;
}

export function GameManagerProvider({ children }: GameManagerProviderProps) {
  console.log('GameManagerProvider rendering...');
  const [state, dispatch] = useReducer(gameManagerReducer, initialState);

  const loadActiveGame = useCallback(async (): Promise<void> => {
    dispatch({ type: GameActionType.SET_LOADING, payload: true });
    
    try {
      const activeGameState = await state.gameService.getActiveGameState();
      if (activeGameState) {
        dispatch({ type: GameActionType.SET_ACTIVE_GAME, payload: activeGameState });
      } else {
        dispatch({ type: GameActionType.CLEAR_ACTIVE_GAME });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load active game';
      dispatch({ type: GameActionType.SET_ERROR, payload: errorMessage });
    }
  }, [state.gameService]);

  // Load active game on mount
  useEffect(() => {
    loadActiveGame();
  }, [loadActiveGame]);

  const createGame = async (gameData: CreateGameData): Promise<Game> => {
    dispatch({ type: GameActionType.SET_LOADING, payload: true });
    
    try {
      const game = await state.gameService.createGame(gameData);
      await loadActiveGame(); // Refresh the active game
      return game;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create game';
      dispatch({ type: GameActionType.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const toggleStateSpotted = async (stateCode: string): Promise<boolean> => {
    if (!state.activeGame) {
      throw new Error('No active game');
    }

    try {
      const isNowSpotted = await state.gameService.toggleStateSpotted(
        state.activeGame.game.id,
        stateCode
      );

      // Update local state immediately for better UX
      dispatch({
        type: GameActionType.TOGGLE_STATE,
        payload: {
          stateCode,
          isSpotted: isNowSpotted,
          spottedAt: isNowSpotted ? new Date().toISOString() : undefined,
        },
      });

      // Refresh game state to ensure consistency
      await refreshGameState();

      return isNowSpotted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle state';
      dispatch({ type: GameActionType.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const completeGame = async (): Promise<void> => {
    if (!state.activeGame) {
      throw new Error('No active game');
    }

    dispatch({ type: GameActionType.SET_LOADING, payload: true });
    
    try {
      await state.gameService.completeGame(state.activeGame.game.id);
      await refreshGameState();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete game';
      dispatch({ type: GameActionType.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const deleteGame = async (): Promise<void> => {
    if (!state.activeGame) {
      throw new Error('No active game');
    }

    dispatch({ type: GameActionType.SET_LOADING, payload: true });
    
    try {
      await state.gameService.deleteGame(state.activeGame.game.id);
      dispatch({ type: GameActionType.CLEAR_ACTIVE_GAME });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete game';
      dispatch({ type: GameActionType.SET_ERROR, payload: errorMessage });
      throw error;
    }
  };

  const refreshGameState = async (): Promise<void> => {
    if (!state.activeGame) {
      return;
    }

    try {
      const refreshedState = await state.gameService.getGameState(state.activeGame.game.id);
      dispatch({ type: GameActionType.REFRESH_GAME_STATE, payload: refreshedState });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh game state';
      dispatch({ type: GameActionType.SET_ERROR, payload: errorMessage });
    }
  };

  const clearError = (): void => {
    dispatch({ type: GameActionType.SET_ERROR, payload: null });
  };

  const contextValue: GameManagerContextType = {
    state,
    createGame,
    loadActiveGame,
    toggleStateSpotted,
    completeGame,
    deleteGame,
    refreshGameState,
    clearError,
  };

  return (
    <GameManagerContext.Provider value={contextValue}>
      {children}
    </GameManagerContext.Provider>
  );
}

// Hook to use the context
export function useGameManager(): GameManagerContextType {
  const context = useContext(GameManagerContext);
  if (context === undefined) {
    throw new Error('useGameManager must be used within a GameManagerProvider');
  }
  return context;
}

// Additional hooks for specific functionality
export function useActiveGame(): GameState | null {
  const { state } = useGameManager();
  return state.activeGame;
}

export function useGameProgress(): GameProgress | null {
  const activeGame = useActiveGame();
  return activeGame?.progress || null;
}

export function useGameStates(): StateInfo[] {
  const activeGame = useActiveGame();
  return activeGame?.stateList || [];
}

export function useGameLoading(): boolean {
  const { state } = useGameManager();
  return state.isLoading;
}

export function useGameError(): string | null {
  const { state } = useGameManager();
  return state.error;
}
