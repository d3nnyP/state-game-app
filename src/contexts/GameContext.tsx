import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Game, SpottedState } from '../models/types';
import DatabaseService from '../services/DatabaseService';

interface GameContextType {
  currentGame: Game | null;
  spottedStates: SpottedState[];
  allGames: Game[];
  isLoading: boolean;
  error: string | null;
  createGame: (name: string) => Promise<void>;
  toggleState: (stateCode: string) => Promise<void>;
  completeGame: () => Promise<void>;
  loadActiveGame: () => Promise<void>;
  loadAllGames: () => Promise<void>;
  resumeGame: (gameId: string) => Promise<void>;
  deleteGame: (gameId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [spottedStates, setSpottedStates] = useState<SpottedState[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const db = DatabaseService.getInstance();

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await db.initialize();
      await loadAllGames();
      await loadActiveGame();
    } catch (err) {
      console.error('Failed to initialize database:', err);
      setError('Failed to initialize database');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveGame = async () => {
    try {
      const game = await db.getActiveGame();
      if (game) {
        setCurrentGame(game);
        const states = await db.getSpottedStates(game.id);
        setSpottedStates(states);
      } else {
        setCurrentGame(null);
        setSpottedStates([]);
      }
    } catch (err) {
      console.error('Failed to load active game:', err);
      setError('Failed to load active game');
    }
  };

  const createGame = async (name: string) => {
    try {
      setError(null);
      
      // Deactivate current game if exists
      if (currentGame) {
        await db.updateGame({ ...currentGame, isActive: false });
      }

      const newGame: Omit<Game, 'id'> = {
        name,
        createdAt: Date.now(),
        isActive: true,
      };

      const game = await db.createGame(newGame);
      setCurrentGame(game);
      setSpottedStates([]);
    } catch (err) {
      console.error('Failed to create game:', err);
      setError('Failed to create game');
    }
  };

  const toggleState = async (stateCode: string) => {
    if (!currentGame) return;

    try {
      setError(null);
      
      const existingState = spottedStates.find(s => s.stateCode === stateCode);
      
      if (existingState) {
        // Remove spotted state
        await db.removeSpottedState(currentGame.id, stateCode);
        setSpottedStates(prev => prev.filter(s => s.stateCode !== stateCode));
      } else {
        // Add spotted state
        const spottedState: Omit<SpottedState, 'id'> = {
          gameId: currentGame.id,
          stateCode,
          spottedAt: Date.now(),
        };
        
        const newSpottedState = await db.addSpottedState(spottedState);
        setSpottedStates(prev => [...prev, newSpottedState]);
      }
    } catch (err) {
      console.error('Failed to toggle state:', err);
      setError('Failed to toggle state');
    }
  };

  const completeGame = async () => {
    if (!currentGame) return;

    try {
      setError(null);
      
      const completedGame = {
        ...currentGame,
        completedAt: Date.now(),
        isActive: false,
      };

      await db.updateGame(completedGame);
      setCurrentGame(completedGame);
      await loadAllGames(); // Refresh the games list
    } catch (err) {
      console.error('Failed to complete game:', err);
      setError('Failed to complete game');
    }
  };

  const loadAllGames = async () => {
    try {
      const games = await db.getAllGames();
      setAllGames(games);
    } catch (err) {
      console.error('Failed to load all games:', err);
      setError('Failed to load game history');
    }
  };

  const resumeGame = async (gameId: string) => {
    try {
      setError(null);
      
      // Deactivate current game if exists
      if (currentGame) {
        await db.updateGame({ ...currentGame, isActive: false });
      }

      // Find the game to resume
      const gameToResume = allGames.find(game => game.id === gameId);
      if (!gameToResume) {
        throw new Error('Game not found');
      }

      // Activate the selected game
      const resumedGame = { ...gameToResume, isActive: true };
      await db.updateGame(resumedGame);
      
      // Load the game and its states
      setCurrentGame(resumedGame);
      const states = await db.getSpottedStates(gameId);
      setSpottedStates(states);
      
      await loadAllGames(); // Refresh the games list
    } catch (err) {
      console.error('Failed to resume game:', err);
      setError('Failed to resume game');
    }
  };

  const deleteGame = async (gameId: string) => {
    try {
      setError(null);
      
      await db.deleteGame(gameId);
      
      // If we're deleting the current game, clear it
      if (currentGame && currentGame.id === gameId) {
        setCurrentGame(null);
        setSpottedStates([]);
      }
      
      await loadAllGames(); // Refresh the games list
    } catch (err) {
      console.error('Failed to delete game:', err);
      setError('Failed to delete game');
    }
  };

  const value: GameContextType = {
    currentGame,
    spottedStates,
    allGames,
    isLoading,
    error,
    createGame,
    toggleState,
    completeGame,
    loadActiveGame,
    loadAllGames,
    resumeGame,
    deleteGame,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
