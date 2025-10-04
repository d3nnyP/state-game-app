/**
 * Database initialization and usage example
 * This file demonstrates how to initialize and use the database layer
 */

import { DatabaseService } from './DatabaseService';
import { DatabaseMigrations } from './DatabaseMigrations';
import { GameRepository } from '../repositories/GameRepository';
import { SpottedStateRepository } from '../repositories/SpottedStateRepository';

export class DatabaseManager {
  private static instance: DatabaseManager;
  private dbService: DatabaseService;
  private migrations: DatabaseMigrations;
  private gameRepo: GameRepository;
  private spottedStateRepo: SpottedStateRepository;
  private isInitialized = false;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.migrations = new DatabaseMigrations();
    this.gameRepo = new GameRepository();
    this.spottedStateRepo = new SpottedStateRepository();
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the database and run migrations
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize database connection
      await this.dbService.initialize();
      
      // Run migrations
      await this.migrations.runMigrations();
      
      this.isInitialized = true;
      console.log('DatabaseManager initialized successfully');
    } catch (error) {
      console.error('DatabaseManager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get repositories
   */
  public getGameRepository(): GameRepository {
    if (!this.isInitialized) {
      throw new Error('DatabaseManager not initialized. Call initialize() first.');
    }
    return this.gameRepo;
  }

  public getSpottedStateRepository(): SpottedStateRepository {
    if (!this.isInitialized) {
      throw new Error('DatabaseManager not initialized. Call initialize() first.');
    }
    return this.spottedStateRepo;
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    await this.dbService.close();
    this.isInitialized = false;
  }

  /**
   * Check if database is ready
   */
  public isReady(): boolean {
    return this.isInitialized && this.dbService.isReady();
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();
