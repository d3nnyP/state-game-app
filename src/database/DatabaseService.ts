import SQLite from 'react-native-sqlite-storage';
import { DATABASE_CONFIG } from '../utils/constants';

// Enable promise-based API
SQLite.enablePromise(true);

export interface DatabaseConfig {
  name: string;
  location?: string;
  createFromLocation?: string;
}

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database connection
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const config: DatabaseConfig = {
        name: DATABASE_CONFIG.name,
        location: 'default',
      };

      this.db = await SQLite.openDatabase(config);
      await this.createTables();
      this.isInitialized = true;
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get the database instance
   */
  public getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
      console.log('Database closed');
    }
  }

  /**
   * Create all necessary tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not available');
    }

    try {
      // Create games table
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS games (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT,
          startLocation TEXT NOT NULL,
          destination TEXT NOT NULL,
          isComplete INTEGER DEFAULT 0,
          createdAt TEXT NOT NULL
        );
      `);

      // Create spotted_states table
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS spotted_states (
          id TEXT PRIMARY KEY,
          gameId TEXT NOT NULL,
          stateCode TEXT NOT NULL,
          spottedAt TEXT NOT NULL,
          FOREIGN KEY (gameId) REFERENCES games (id) ON DELETE CASCADE,
          UNIQUE(gameId, stateCode)
        );
      `);

      // Create indexes for better performance
      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_spotted_states_game_id 
        ON spotted_states(gameId);
      `);

      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_spotted_states_state_code 
        ON spotted_states(stateCode);
      `);

      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL query with parameters
   */
  public async executeQuery(
    sql: string, 
    params: any[] = []
  ): Promise<SQLite.ResultSet> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const [result] = await this.db.executeSql(sql, params);
      return result;
    } catch (error) {
      console.error('Query execution failed:', error);
      throw error;
    }
  }

  /**
   * Execute multiple SQL queries in a transaction
   */
  public async executeTransaction(queries: Array<{sql: string, params?: any[]}>): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.transaction(async (tx) => {
        for (const query of queries) {
          await tx.executeSql(query.sql, query.params || []);
        }
      });
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }
}
