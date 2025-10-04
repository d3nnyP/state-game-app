import DatabaseService from '../services/DatabaseService';
import { Game } from '../models/types';

export class GameRepository {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  /**
   * Create a new game
   */
  public async createGame(gameData: Omit<Game, 'id' | 'createdAt'>): Promise<Game> {
    const id = this.generateId();
    const createdAt = new Date().toISOString();
    
    const game: Game = {
      id,
      createdAt,
      ...gameData,
    };

    const sql = `
      INSERT INTO games (id, name, startDate, endDate, startLocation, destination, isComplete, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      game.id,
      game.name,
      game.startDate,
      game.endDate || null,
      game.startLocation,
      game.destination,
      game.isComplete ? 1 : 0,
      game.createdAt,
    ];

    await this.dbService.executeQuery(sql, params);
    return game;
  }

  /**
   * Get a game by ID
   */
  public async getGameById(id: string): Promise<Game | null> {
    const sql = 'SELECT * FROM games WHERE id = ?';
    const result = await this.dbService.executeQuery(sql, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToGame(result.rows.item(0));
  }

  /**
   * Get all games
   */
  public async getAllGames(): Promise<Game[]> {
    const sql = 'SELECT * FROM games ORDER BY createdAt DESC';
    const result = await this.dbService.executeQuery(sql);

    const games: Game[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      games.push(this.mapRowToGame(result.rows.item(i)));
    }

    return games;
  }

  /**
   * Update a game
   */
  public async updateGame(id: string, updates: Partial<Game>): Promise<void> {
    const allowedFields = ['name', 'startDate', 'endDate', 'startLocation', 'destination', 'isComplete'];
    const updateFields: string[] = [];
    const params: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(key === 'isComplete' ? (value ? 1 : 0) : value);
      }
    }

    if (updateFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    params.push(id);
    const sql = `UPDATE games SET ${updateFields.join(', ')} WHERE id = ?`;

    await this.dbService.executeQuery(sql, params);
  }

  /**
   * Delete a game
   */
  public async deleteGame(id: string): Promise<void> {
    const sql = 'DELETE FROM games WHERE id = ?';
    await this.dbService.executeQuery(sql, [id]);
  }

  /**
   * Get the active game (most recent incomplete game)
   */
  public async getActiveGame(): Promise<Game | null> {
    const sql = `
      SELECT * FROM games 
      WHERE isComplete = 0 
      ORDER BY createdAt DESC 
      LIMIT 1
    `;
    const result = await this.dbService.executeQuery(sql);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToGame(result.rows.item(0));
  }

  /**
   * Mark a game as complete
   */
  public async markGameComplete(id: string): Promise<void> {
    const sql = 'UPDATE games SET isComplete = 1 WHERE id = ?';
    await this.dbService.executeQuery(sql, [id]);
  }

  /**
   * Get games by completion status
   */
  public async getGamesByStatus(isComplete: boolean): Promise<Game[]> {
    const sql = 'SELECT * FROM games WHERE isComplete = ? ORDER BY createdAt DESC';
    const result = await this.dbService.executeQuery(sql, [isComplete ? 1 : 0]);

    const games: Game[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      games.push(this.mapRowToGame(result.rows.item(i)));
    }

    return games;
  }

  /**
   * Map database row to Game object
   */
  private mapRowToGame(row: any): Game {
    return {
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      startLocation: row.startLocation,
      destination: row.destination,
      isComplete: Boolean(row.isComplete),
      createdAt: row.createdAt,
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
