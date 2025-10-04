import { GameRepository } from '../repositories/GameRepository';
import { SpottedStateRepository } from '../repositories/SpottedStateRepository';
import { Game, SpottedState, GameProgress, StateInfo } from '../models/types';
import { US_STATES } from '../utils/constants';

export interface CreateGameData {
  name: string;
  startDate: string;
  endDate?: string;
  startLocation: string;
  destination: string;
}

export interface GameState {
  game: Game;
  progress: GameProgress;
  spottedStates: SpottedState[];
  stateList: StateInfo[];
}

export class GameService {
  private gameRepository: GameRepository;
  private spottedStateRepository: SpottedStateRepository;

  constructor() {
    this.gameRepository = new GameRepository();
    this.spottedStateRepository = new SpottedStateRepository();
  }

  /**
   * Create a new game with validation
   */
  public async createGame(gameData: CreateGameData): Promise<Game> {
    // Validate required fields
    if (!gameData.name?.trim()) {
      throw new Error('Game name is required');
    }
    if (!gameData.startDate) {
      throw new Error('Start date is required');
    }
    if (!gameData.startLocation?.trim()) {
      throw new Error('Start location is required');
    }
    if (!gameData.destination?.trim()) {
      throw new Error('Destination is required');
    }

    // Validate date format and logic
    const startDate = new Date(gameData.startDate);
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid start date format');
    }

    if (gameData.endDate) {
      const endDate = new Date(gameData.endDate);
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid end date format');
      }
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
    }

    // Check if there's already an active game
    const activeGame = await this.gameRepository.getActiveGame();
    if (activeGame) {
      throw new Error('There is already an active game. Please complete or delete it before creating a new one.');
    }

    // Create the game
    const game = await this.gameRepository.createGame({
      name: gameData.name.trim(),
      startDate: gameData.startDate,
      endDate: gameData.endDate,
      startLocation: gameData.startLocation.trim(),
      destination: gameData.destination.trim(),
      isComplete: false,
    });

    return game;
  }

  /**
   * Get the current active game with full state information
   */
  public async getActiveGameState(): Promise<GameState | null> {
    const game = await this.gameRepository.getActiveGame();
    if (!game) {
      return null;
    }

    return await this.getGameState(game.id);
  }

  /**
   * Get complete game state for a specific game
   */
  public async getGameState(gameId: string): Promise<GameState> {
    const game = await this.gameRepository.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    const progress = await this.spottedStateRepository.getGameProgress(gameId);
    const spottedStates = await this.spottedStateRepository.getSpottedStatesForGame(gameId);
    
    // Create state list with spotted status
    const stateList: StateInfo[] = US_STATES.map(state => {
      const spottedState = spottedStates.find(ss => ss.stateCode === state.code);
      return {
        code: state.code,
        name: state.name,
        isSpotted: !!spottedState,
        spottedAt: spottedState?.spottedAt,
      };
    });

    return {
      game,
      progress,
      spottedStates,
      stateList,
    };
  }

  /**
   * Toggle a state's spotted status
   */
  public async toggleStateSpotted(gameId: string, stateCode: string): Promise<boolean> {
    // Validate state code
    const validState = US_STATES.find(state => state.code === stateCode);
    if (!validState) {
      throw new Error(`Invalid state code: ${stateCode}`);
    }

    // Check if game exists
    const game = await this.gameRepository.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.isComplete) {
      throw new Error('Cannot modify states in a completed game');
    }

    // Toggle the state
    const isNowSpotted = await this.spottedStateRepository.toggleStateSpotted(gameId, stateCode);

    // Check if game is now complete
    const progress = await this.spottedStateRepository.getGameProgress(gameId);
    if (progress.found === progress.total && !game.isComplete) {
      await this.gameRepository.markGameComplete(gameId);
    }

    return isNowSpotted;
  }

  /**
   * Mark a game as complete manually
   */
  public async completeGame(gameId: string): Promise<void> {
    const game = await this.gameRepository.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.isComplete) {
      throw new Error('Game is already complete');
    }

    await this.gameRepository.markGameComplete(gameId);
  }

  /**
   * Delete a game and all its spotted states
   */
  public async deleteGame(gameId: string): Promise<void> {
    const game = await this.gameRepository.getGameById(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Delete all spotted states first (foreign key constraint)
    const spottedStates = await this.spottedStateRepository.getSpottedStatesForGame(gameId);
    for (const spottedState of spottedStates) {
      await this.spottedStateRepository.removeSpottedState(gameId, spottedState.stateCode);
    }

    // Delete the game
    await this.gameRepository.deleteGame(gameId);
  }

  /**
   * Get all games with their progress
   */
  public async getAllGamesWithProgress(): Promise<Array<GameState>> {
    const games = await this.gameRepository.getAllGames();
    const gameStates: GameState[] = [];

    for (const game of games) {
      try {
        const gameState = await this.getGameState(game.id);
        gameStates.push(gameState);
      } catch (error) {
        console.error(`Error loading game state for game ${game.id}:`, error);
        // Continue with other games even if one fails
      }
    }

    return gameStates;
  }

  /**
   * Get game statistics
   */
  public async getGameStatistics() {
    return await this.spottedStateRepository.getGameStatistics();
  }

  /**
   * Validate game data before creation
   */
  public validateGameData(gameData: CreateGameData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!gameData.name?.trim()) {
      errors.push('Game name is required');
    }

    if (!gameData.startDate) {
      errors.push('Start date is required');
    } else {
      const startDate = new Date(gameData.startDate);
      if (isNaN(startDate.getTime())) {
        errors.push('Invalid start date format');
      }
    }

    if (gameData.endDate) {
      const endDate = new Date(gameData.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('Invalid end date format');
      } else if (gameData.startDate) {
        const startDate = new Date(gameData.startDate);
        if (endDate <= startDate) {
          errors.push('End date must be after start date');
        }
      }
    }

    if (!gameData.startLocation?.trim()) {
      errors.push('Start location is required');
    }

    if (!gameData.destination?.trim()) {
      errors.push('Destination is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get all available states
   */
  public getAllStates(): StateInfo[] {
    return US_STATES.map(state => ({
      code: state.code,
      name: state.name,
    }));
  }

  /**
   * Check if a state code is valid
   */
  public isValidStateCode(stateCode: string): boolean {
    return US_STATES.some(state => state.code === stateCode);
  }
}
