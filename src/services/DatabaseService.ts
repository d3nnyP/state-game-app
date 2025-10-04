import SQLite from 'react-native-sqlite-storage';
import { Game, SpottedState } from '../models/types';

// Enable promise-based SQLite
SQLite.enablePromise(true);

class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    try {
      console.log('Initializing database...');
      this.db = await SQLite.openDatabase({
        name: 'StateGameApp.db',
        location: 'default',
      });

      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const queries = [
      `CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        completed_at INTEGER,
        is_active INTEGER DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS spotted_states (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        state_code TEXT NOT NULL,
        spotted_at INTEGER NOT NULL,
        FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
      )`,
    ];

    for (const query of queries) {
      await this.db.executeSql(query);
    }
  }

  async createGame(game: Omit<Game, 'id'>): Promise<Game> {
    if (!this.db) throw new Error('Database not initialized');

    const id = Date.now().toString();
    const newGame: Game = {
      ...game,
      id,
    };

    await this.db.executeSql(
      'INSERT INTO games (id, name, created_at, completed_at, is_active) VALUES (?, ?, ?, ?, ?)',
      [id, game.name, game.createdAt, game.completedAt || null, game.isActive ? 1 : 0]
    );

    return newGame;
  }

  async getActiveGame(): Promise<Game | null> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM games WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
    );

    if (results.rows.length === 0) {
      return null;
    }

    const row = results.rows.item(0);
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      isActive: row.is_active === 1,
    };
  }

  async getAllGames(): Promise<Game[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM games ORDER BY created_at DESC'
    );

    const games: Game[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      games.push({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        isActive: row.is_active === 1,
      });
    }

    return games;
  }

  async updateGame(game: Game): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      'UPDATE games SET name = ?, completed_at = ?, is_active = ? WHERE id = ?',
      [game.name, game.completedAt || null, game.isActive ? 1 : 0, game.id]
    );
  }

  async deleteGame(gameId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql('DELETE FROM games WHERE id = ?', [gameId]);
  }

  async addSpottedState(spottedState: Omit<SpottedState, 'id'>): Promise<SpottedState> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${spottedState.gameId}_${spottedState.stateCode}`;
    const newSpottedState: SpottedState = {
      ...spottedState,
      id,
    };

    await this.db.executeSql(
      'INSERT OR REPLACE INTO spotted_states (id, game_id, state_code, spotted_at) VALUES (?, ?, ?, ?)',
      [id, spottedState.gameId, spottedState.stateCode, spottedState.spottedAt]
    );

    return newSpottedState;
  }

  async getSpottedStates(gameId: string): Promise<SpottedState[]> {
    if (!this.db) throw new Error('Database not initialized');

    const [results] = await this.db.executeSql(
      'SELECT * FROM spotted_states WHERE game_id = ? ORDER BY spotted_at ASC',
      [gameId]
    );

    const spottedStates: SpottedState[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      spottedStates.push({
        id: row.id,
        gameId: row.game_id,
        stateCode: row.state_code,
        spottedAt: row.spotted_at,
      });
    }

    return spottedStates;
  }

  async removeSpottedState(gameId: string, stateCode: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.executeSql(
      'DELETE FROM spotted_states WHERE game_id = ? AND state_code = ?',
      [gameId, stateCode]
    );
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export default DatabaseService;
