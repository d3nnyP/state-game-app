// Main exports for the State Game App
// This file provides a clean API for all the core functionality

// Services are now integrated into GameContext

// Contexts
export { GameProvider, useGame } from './contexts';
export type { GameContextType } from './contexts';

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
export { default as DatabaseService } from './services/DatabaseService';

// Screens
export { 
  MainMenuScreen, 
  CreateGameScreen, 
  ActiveGameScreen, 
  GameHistoryScreen 
} from './screens';