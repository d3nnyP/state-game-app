/**
 * TypeScript configuration for the src directory
 * This extends the main tsconfig.json with additional paths and settings
 */

export interface Game {
  id: string;
  name: string;
  startDate: string; // ISO date string
  endDate?: string;
  startLocation: string;
  destination: string;
  isComplete: boolean;
  createdAt: string;
}

export interface SpottedState {
  id: string;
  gameId: string;
  stateCode: string; // Two-letter state code (e.g., 'CA')
  spottedAt: string; // ISO timestamp
}

export interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
  tutorialCompleted: boolean;
}

export interface GameProgress {
  found: number;
  total: number;
  percentage: number;
}

export interface StateInfo {
  code: string;
  name: string;
  isSpotted?: boolean;
  spottedAt?: string;
}
