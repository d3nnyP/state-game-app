import DatabaseService from '../services/DatabaseService';
import { SpottedState, GameProgress } from '../models/types';

export class SpottedStateRepository {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  /**
   * Add a spotted state to a game
   */
  public async addSpottedState(gameId: string, stateCode: string): Promise<void> {
    const id = this.generateId();
    const spottedAt = new Date().toISOString();

    const sql = `
      INSERT INTO spotted_states (id, gameId, stateCode, spottedAt)
      VALUES (?, ?, ?, ?)
    `;

    const params = [id, gameId, stateCode, spottedAt];

    try {
      await this.dbService.executeQuery(sql, params);
    } catch (error) {
      // Handle unique constraint violation (state already spotted)
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new Error(`State ${stateCode} has already been spotted in this game`);
      }
      throw error;
    }
  }

  /**
   * Remove a spotted state from a game
   */
  public async removeSpottedState(gameId: string, stateCode: string): Promise<void> {
    const sql = 'DELETE FROM spotted_states WHERE gameId = ? AND stateCode = ?';
    await this.dbService.executeQuery(sql, [gameId, stateCode]);
  }

  /**
   * Get all spotted states for a game
   */
  public async getSpottedStatesForGame(gameId: string): Promise<SpottedState[]> {
    const sql = `
      SELECT * FROM spotted_states 
      WHERE gameId = ? 
      ORDER BY spottedAt ASC
    `;
    const result = await this.dbService.executeQuery(sql, [gameId]);

    const spottedStates: SpottedState[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      spottedStates.push(this.mapRowToSpottedState(result.rows.item(i)));
    }

    return spottedStates;
  }

  /**
   * Get game progress (found/total states)
   */
  public async getGameProgress(gameId: string): Promise<GameProgress> {
    const sql = 'SELECT COUNT(*) as found FROM spotted_states WHERE gameId = ?';
    const result = await this.dbService.executeQuery(sql, [gameId]);
    
    const found = result.rows.item(0).found;
    const total = 50; // Total US states
    
    return {
      found,
      total,
      percentage: Math.round((found / total) * 100),
    };
  }

  /**
   * Check if a state has been spotted in a game
   */
  public async isStateSpotted(gameId: string, stateCode: string): Promise<boolean> {
    const sql = 'SELECT COUNT(*) as count FROM spotted_states WHERE gameId = ? AND stateCode = ?';
    const result = await this.dbService.executeQuery(sql, [gameId, stateCode]);
    
    return result.rows.item(0).count > 0;
  }

  /**
   * Get spotted states by state code across all games
   */
  public async getSpottedStatesByStateCode(stateCode: string): Promise<SpottedState[]> {
    const sql = `
      SELECT * FROM spotted_states 
      WHERE stateCode = ? 
      ORDER BY spottedAt DESC
    `;
    const result = await this.dbService.executeQuery(sql, [stateCode]);

    const spottedStates: SpottedState[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      spottedStates.push(this.mapRowToSpottedState(result.rows.item(i)));
    }

    return spottedStates;
  }

  /**
   * Get statistics for all games
   */
  public async getGameStatistics(): Promise<{
    totalGames: number;
    completedGames: number;
    totalStatesSpotted: number;
    mostSpottedStates: Array<{stateCode: string, count: number}>;
    rarestStates: Array<{stateCode: string, count: number}>;
  }> {
    // Get total games count
    const totalGamesResult = await this.dbService.executeQuery('SELECT COUNT(*) as count FROM games');
    const totalGames = totalGamesResult.rows.item(0).count;

    // Get completed games count
    const completedGamesResult = await this.dbService.executeQuery('SELECT COUNT(*) as count FROM games WHERE isComplete = 1');
    const completedGames = completedGamesResult.rows.item(0).count;

    // Get total states spotted
    const totalStatesResult = await this.dbService.executeQuery('SELECT COUNT(*) as count FROM spotted_states');
    const totalStatesSpotted = totalStatesResult.rows.item(0).count;

    // Get most spotted states
    const mostSpottedResult = await this.dbService.executeQuery(`
      SELECT stateCode, COUNT(*) as count 
      FROM spotted_states 
      GROUP BY stateCode 
      ORDER BY count DESC 
      LIMIT 10
    `);
    
    const mostSpottedStates: Array<{stateCode: string, count: number}> = [];
    for (let i = 0; i < mostSpottedResult.rows.length; i++) {
      const row = mostSpottedResult.rows.item(i);
      mostSpottedStates.push({
        stateCode: row.stateCode,
        count: row.count,
      });
    }

    // Get rarest states
    const rarestResult = await this.dbService.executeQuery(`
      SELECT stateCode, COUNT(*) as count 
      FROM spotted_states 
      GROUP BY stateCode 
      ORDER BY count ASC 
      LIMIT 10
    `);
    
    const rarestStates: Array<{stateCode: string, count: number}> = [];
    for (let i = 0; i < rarestResult.rows.length; i++) {
      const row = rarestResult.rows.item(i);
      rarestStates.push({
        stateCode: row.stateCode,
        count: row.count,
      });
    }

    return {
      totalGames,
      completedGames,
      totalStatesSpotted,
      mostSpottedStates,
      rarestStates,
    };
  }

  /**
   * Toggle state spotted status (add if not spotted, remove if spotted)
   */
  public async toggleStateSpotted(gameId: string, stateCode: string): Promise<boolean> {
    const isSpotted = await this.isStateSpotted(gameId, stateCode);
    
    if (isSpotted) {
      await this.removeSpottedState(gameId, stateCode);
      return false; // State was removed
    } else {
      await this.addSpottedState(gameId, stateCode);
      return true; // State was added
    }
  }

  /**
   * Map database row to SpottedState object
   */
  private mapRowToSpottedState(row: any): SpottedState {
    return {
      id: row.id,
      gameId: row.gameId,
      stateCode: row.stateCode,
      spottedAt: row.spottedAt,
    };
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `spotted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
