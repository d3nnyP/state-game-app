import DatabaseService from '../services/DatabaseService';
import { DatabaseMigrations } from '../services/DatabaseService';
import { GameRepository } from '../repositories/GameRepository';
import { SpottedStateRepository } from '../repositories/SpottedStateRepository';
import { Game, SpottedState } from '../models/types';

// Mock react-native-sqlite-storage
jest.mock('react-native-sqlite-storage', () => ({
  enablePromise: jest.fn(),
  openDatabase: jest.fn(() => Promise.resolve({
    executeSql: jest.fn(() => Promise.resolve([{ rows: { length: 0, item: jest.fn() } }])),
    transaction: jest.fn((callback) => callback({
      executeSql: jest.fn(() => Promise.resolve())
    })),
    close: jest.fn(() => Promise.resolve()),
  })),
}));

describe('Database Layer Tests', () => {
  let dbService: DatabaseService;
  let migrations: DatabaseMigrations;
  let gameRepo: GameRepository;
  let spottedStateRepo: SpottedStateRepository;

  beforeEach(() => {
    // Reset singleton instance
    (DatabaseService as any).instance = undefined;
    
    dbService = DatabaseService.getInstance();
    migrations = new DatabaseMigrations();
    gameRepo = new GameRepository();
    spottedStateRepo = new SpottedStateRepository();
  });

  afterEach(async () => {
    await dbService.close();
  });

  describe('DatabaseService', () => {
    test('should initialize database successfully', async () => {
      await expect(dbService.initialize()).resolves.not.toThrow();
      expect(dbService.isReady()).toBe(true);
    });

    test('should throw error when accessing uninitialized database', () => {
      expect(() => dbService.getDatabase()).toThrow('Database not initialized');
    });

    test('should close database connection', async () => {
      await dbService.initialize();
      await expect(dbService.close()).resolves.not.toThrow();
      expect(dbService.isReady()).toBe(false);
    });
  });

  describe('DatabaseMigrations', () => {
    beforeEach(async () => {
      await dbService.initialize();
    });

    test('should initialize migrations table', async () => {
      await expect(migrations.initializeMigrationsTable()).resolves.not.toThrow();
    });

    test('should get current version', async () => {
      await migrations.initializeMigrationsTable();
      const version = await migrations.getCurrentVersion();
      expect(typeof version).toBe('number');
    });

    test('should run migrations successfully', async () => {
      await expect(migrations.runMigrations()).resolves.not.toThrow();
    });
  });

  describe('GameRepository', () => {
    beforeEach(async () => {
      await dbService.initialize();
      await migrations.runMigrations();
    });

    test('should create a new game', async () => {
      const gameData = {
        name: 'Test Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      const game = await gameRepo.createGame(gameData);
      
      expect(game.id).toBeDefined();
      expect(game.name).toBe(gameData.name);
      expect(game.createdAt).toBeDefined();
    });

    test('should get game by ID', async () => {
      const gameData = {
        name: 'Test Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      const createdGame = await gameRepo.createGame(gameData);
      const retrievedGame = await gameRepo.getGameById(createdGame.id);

      expect(retrievedGame).toEqual(createdGame);
    });

    test('should return null for non-existent game', async () => {
      const game = await gameRepo.getGameById('non-existent-id');
      expect(game).toBeNull();
    });

    test('should get all games', async () => {
      const gameData = {
        name: 'Test Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      await gameRepo.createGame(gameData);
      const games = await gameRepo.getAllGames();

      expect(games.length).toBeGreaterThan(0);
      expect(games[0].name).toBe(gameData.name);
    });

    test('should update game', async () => {
      const gameData = {
        name: 'Test Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      const game = await gameRepo.createGame(gameData);
      await gameRepo.updateGame(game.id, { name: 'Updated Game' });

      const updatedGame = await gameRepo.getGameById(game.id);
      expect(updatedGame?.name).toBe('Updated Game');
    });

    test('should delete game', async () => {
      const gameData = {
        name: 'Test Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      const game = await gameRepo.createGame(gameData);
      await gameRepo.deleteGame(game.id);

      const deletedGame = await gameRepo.getGameById(game.id);
      expect(deletedGame).toBeNull();
    });

    test('should get active game', async () => {
      const gameData = {
        name: 'Active Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      await gameRepo.createGame(gameData);
      const activeGame = await gameRepo.getActiveGame();

      expect(activeGame?.name).toBe(gameData.name);
    });

    test('should mark game as complete', async () => {
      const gameData = {
        name: 'Test Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      const game = await gameRepo.createGame(gameData);
      await gameRepo.markGameComplete(game.id);

      const completedGame = await gameRepo.getGameById(game.id);
      expect(completedGame?.isComplete).toBe(true);
    });
  });

  describe('SpottedStateRepository', () => {
    let testGame: Game;

    beforeEach(async () => {
      await dbService.initialize();
      await migrations.runMigrations();

      const gameData = {
        name: 'Test Game',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      testGame = await gameRepo.createGame(gameData);
    });

    test('should add spotted state', async () => {
      await expect(spottedStateRepo.addSpottedState(testGame.id, 'CA')).resolves.not.toThrow();
    });

    test('should not add duplicate spotted state', async () => {
      await spottedStateRepo.addSpottedState(testGame.id, 'CA');
      await expect(spottedStateRepo.addSpottedState(testGame.id, 'CA')).rejects.toThrow();
    });

    test('should remove spotted state', async () => {
      await spottedStateRepo.addSpottedState(testGame.id, 'CA');
      await expect(spottedStateRepo.removeSpottedState(testGame.id, 'CA')).resolves.not.toThrow();
    });

    test('should get spotted states for game', async () => {
      await spottedStateRepo.addSpottedState(testGame.id, 'CA');
      await spottedStateRepo.addSpottedState(testGame.id, 'NY');

      const spottedStates = await spottedStateRepo.getSpottedStatesForGame(testGame.id);
      expect(spottedStates.length).toBe(2);
    });

    test('should get game progress', async () => {
      await spottedStateRepo.addSpottedState(testGame.id, 'CA');
      await spottedStateRepo.addSpottedState(testGame.id, 'NY');

      const progress = await spottedStateRepo.getGameProgress(testGame.id);
      expect(progress.found).toBe(2);
      expect(progress.total).toBe(50);
      expect(progress.percentage).toBe(4); // 2/50 * 100 = 4%
    });

    test('should check if state is spotted', async () => {
      await spottedStateRepo.addSpottedState(testGame.id, 'CA');
      
      const isSpotted = await spottedStateRepo.isStateSpotted(testGame.id, 'CA');
      expect(isSpotted).toBe(true);

      const isNotSpotted = await spottedStateRepo.isStateSpotted(testGame.id, 'NY');
      expect(isNotSpotted).toBe(false);
    });

    test('should toggle state spotted status', async () => {
      // Initially not spotted
      let isSpotted = await spottedStateRepo.toggleStateSpotted(testGame.id, 'CA');
      expect(isSpotted).toBe(true);

      // Now spotted, should remove it
      isSpotted = await spottedStateRepo.toggleStateSpotted(testGame.id, 'CA');
      expect(isSpotted).toBe(false);
    });

    test('should get game statistics', async () => {
      await spottedStateRepo.addSpottedState(testGame.id, 'CA');
      await spottedStateRepo.addSpottedState(testGame.id, 'NY');

      const stats = await spottedStateRepo.getGameStatistics();
      expect(stats.totalGames).toBeGreaterThan(0);
      expect(stats.totalStatesSpotted).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete game workflow', async () => {
      await dbService.initialize();
      await migrations.runMigrations();

      // Create a game
      const gameData = {
        name: 'Road Trip 2024',
        startDate: '2024-01-01',
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      };

      const game = await gameRepo.createGame(gameData);

      // Add some spotted states
      await spottedStateRepo.addSpottedState(game.id, 'CA');
      await spottedStateRepo.addSpottedState(game.id, 'NY');
      await spottedStateRepo.addSpottedState(game.id, 'TX');

      // Check progress
      const progress = await spottedStateRepo.getGameProgress(game.id);
      expect(progress.found).toBe(3);

      // Get spotted states
      const spottedStates = await spottedStateRepo.getSpottedStatesForGame(game.id);
      expect(spottedStates.length).toBe(3);

      // Mark game as complete
      await gameRepo.markGameComplete(game.id);

      // Verify game is complete
      const completedGame = await gameRepo.getGameById(game.id);
      expect(completedGame?.isComplete).toBe(true);
    });
  });
});
