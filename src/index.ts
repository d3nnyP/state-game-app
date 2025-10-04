// Main exports for the State Game App
// This file provides a clean API for all the core functionality

// Services
export { GameService, GameCompletionService } from './services';
export type { CreateGameData, GameState, GameCompletionEvent, CompletionStats } from './services';
export { AchievementLevel } from './services';

// Contexts
export { GameManagerProvider, useGameManager } from './contexts';
export type { GameManagerContextType, GameManagerState } from './contexts';

// Hooks
export { 
  useStateToggle, 
  useStateList, 
  useGameProgress, 
  useStateSearch, 
  useStateFilter,
  useGameCompletion,
  useCompletionCelebration,
  useAchievements
} from './hooks';

// Models
export type { 
  Game, 
  SpottedState, 
  UserSettings, 
  GameProgress, 
  StateInfo 
} from './models/types';

// Utils
export { stateListManager } from './utils/StateListManager';
export type { StateListManager, StateStatistics } from './utils/StateListManager';
export { StateRegion } from './utils/StateListManager';
export { US_STATES, COLORS, SPACING, APP_CONFIG, DATABASE_CONFIG } from './utils/constants';

// Database
export { DatabaseService } from './database/DatabaseService';
export { DatabaseManager } from './database/DatabaseManager';
export { GameRepository } from './repositories/GameRepository';
export { SpottedStateRepository } from './repositories/SpottedStateRepository';

// Screens
export { 
  MainMenuScreen, 
  CreateGameScreen, 
  ActiveGameScreen, 
  GameHistoryScreen 
} from './screens';

// Navigation
export { AppNavigator, App } from './navigation';
export type { RootStackParamList } from './navigation';
