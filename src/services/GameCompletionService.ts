import { GameService } from '../services/GameService';
import { Game, GameProgress, StateInfo } from '../models/types';
import { stateListManager } from '../utils/StateListManager';

export interface GameCompletionEvent {
  gameId: string;
  gameName: string;
  completedAt: string;
  totalStates: number;
  spottedStates: StateInfo[];
  completionTime: number; // in milliseconds
  achievementLevel: AchievementLevel;
}

export enum AchievementLevel {
  BRONZE = 'bronze', // 25+ states
  SILVER = 'silver', // 40+ states
  GOLD = 'gold',     // 50 states
}

export interface CompletionStats {
  totalGames: number;
  completedGames: number;
  averageCompletionTime: number;
  bestCompletionTime: number;
  totalStatesSpotted: number;
  achievementCounts: Record<AchievementLevel, number>;
  recentCompletions: GameCompletionEvent[];
}

export class GameCompletionService {
  private gameService: GameService;

  constructor() {
    this.gameService = new GameService();
  }

  /**
   * Check if a game is complete and handle completion logic
   */
  public async checkAndHandleCompletion(gameId: string): Promise<GameCompletionEvent | null> {
    const gameState = await this.gameService.getGameState(gameId);
    
    if (gameState.progress.found === gameState.progress.total && !gameState.game.isComplete) {
      return await this.completeGame(gameId);
    }

    return null;
  }

  /**
   * Complete a game and generate completion event
   */
  public async completeGame(gameId: string): Promise<GameCompletionEvent> {
    const gameState = await this.gameService.getGameState(gameId);
    
    if (gameState.game.isComplete) {
      throw new Error('Game is already complete');
    }

    if (gameState.progress.found !== gameState.progress.total) {
      throw new Error('Game is not ready for completion');
    }

    // Calculate completion time
    const startDate = new Date(gameState.game.startDate);
    const completedAt = new Date();
    const completionTime = completedAt.getTime() - startDate.getTime();

    // Determine achievement level
    const achievementLevel = this.getAchievementLevel(gameState.progress.found);

    // Mark game as complete
    await this.gameService.completeGame(gameId);

    // Create completion event
    const completionEvent: GameCompletionEvent = {
      gameId: gameState.game.id,
      gameName: gameState.game.name,
      completedAt: completedAt.toISOString(),
      totalStates: gameState.progress.total,
      spottedStates: gameState.stateList.filter(state => state.isSpotted),
      completionTime,
      achievementLevel,
    };

    // Store completion event (in a real app, this might be saved to a separate table)
    await this.storeCompletionEvent(completionEvent);

    return completionEvent;
  }

  /**
   * Get achievement level based on states found
   */
  public getAchievementLevel(statesFound: number): AchievementLevel {
    if (statesFound >= 50) return AchievementLevel.GOLD;
    if (statesFound >= 40) return AchievementLevel.SILVER;
    if (statesFound >= 25) return AchievementLevel.BRONZE;
    return AchievementLevel.BRONZE; // Default for partial completions
  }

  /**
   * Get completion statistics
   */
  public async getCompletionStats(): Promise<CompletionStats> {
    const statistics = await this.gameService.getGameStatistics();
    const allGames = await this.gameService.getAllGamesWithProgress();
    
    const completedGames = allGames.filter(gameState => gameState.game.isComplete);
    const recentCompletions = await this.getRecentCompletions(5);

    // Calculate average completion time
    const completionTimes = completedGames.map(gameState => {
      const startDate = new Date(gameState.game.startDate);
      const endDate = new Date(gameState.game.endDate || new Date());
      return endDate.getTime() - startDate.getTime();
    });

    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
      : 0;

    const bestCompletionTime = completionTimes.length > 0 
      ? Math.min(...completionTimes) 
      : 0;

    // Count achievements
    const achievementCounts: Record<AchievementLevel, number> = {
      [AchievementLevel.BRONZE]: 0,
      [AchievementLevel.SILVER]: 0,
      [AchievementLevel.GOLD]: 0,
    };

    completedGames.forEach(gameState => {
      const level = this.getAchievementLevel(gameState.progress.found);
      achievementCounts[level]++;
    });

    return {
      totalGames: statistics.totalGames,
      completedGames: statistics.completedGames,
      averageCompletionTime,
      bestCompletionTime,
      totalStatesSpotted: statistics.totalStatesSpotted,
      achievementCounts,
      recentCompletions,
    };
  }

  /**
   * Get recent completion events
   */
  public async getRecentCompletions(limit: number = 10): Promise<GameCompletionEvent[]> {
    // In a real implementation, this would query a completion_events table
    // For now, we'll simulate by getting recent completed games
    const completedGames = await this.gameService.getAllGamesWithProgress();
    const recentCompleted = completedGames
      .filter(gameState => gameState.game.isComplete)
      .sort((a, b) => new Date(b.game.endDate || b.game.createdAt).getTime() - new Date(a.game.endDate || a.game.createdAt).getTime())
      .slice(0, limit);

    return recentCompleted.map(gameState => {
      const startDate = new Date(gameState.game.startDate);
      const endDate = new Date(gameState.game.endDate || new Date());
      const completionTime = endDate.getTime() - startDate.getTime();

      return {
        gameId: gameState.game.id,
        gameName: gameState.game.name,
        completedAt: gameState.game.endDate || new Date().toISOString(),
        totalStates: gameState.progress.total,
        spottedStates: gameState.stateList.filter(state => state.isSpotted),
        completionTime,
        achievementLevel: this.getAchievementLevel(gameState.progress.found),
      };
    });
  }

  /**
   * Get completion rate for a specific time period
   */
  public async getCompletionRate(days: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const allGames = await this.gameService.getAllGamesWithProgress();
    const recentGames = allGames.filter(gameState => 
      new Date(gameState.game.createdAt) >= cutoffDate
    );

    if (recentGames.length === 0) return 0;

    const completedGames = recentGames.filter(gameState => gameState.game.isComplete);
    return Math.round((completedGames.length / recentGames.length) * 100);
  }

  /**
   * Get the rarest states spotted across all games
   */
  public async getRarestStatesSpotted(): Promise<Array<{state: StateInfo, count: number}>> {
    const statistics = await this.gameService.getGameStatistics();
    
    return statistics.rarestStates.map(rareState => {
      const stateInfo = stateListManager.getStateByCode(rareState.stateCode);
      return {
        state: stateInfo || { code: rareState.stateCode, name: rareState.stateCode },
        count: rareState.count,
      };
    });
  }

  /**
   * Get the most commonly spotted states across all games
   */
  public async getMostSpottedStates(): Promise<Array<{state: StateInfo, count: number}>> {
    const statistics = await this.gameService.getGameStatistics();
    
    return statistics.mostSpottedStates.map(commonState => {
      const stateInfo = stateListManager.getStateByCode(commonState.stateCode);
      return {
        state: stateInfo || { code: commonState.stateCode, name: commonState.stateCode },
        count: commonState.count,
      };
    });
  }

  /**
   * Format completion time for display
   */
  public formatCompletionTime(milliseconds: number): string {
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const hours = Math.floor((milliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  /**
   * Get achievement badge info
   */
  public getAchievementBadge(level: AchievementLevel): { name: string; description: string; color: string } {
    const badges = {
      [AchievementLevel.BRONZE]: {
        name: 'Bronze Explorer',
        description: 'Found 25+ states',
        color: '#CD7F32',
      },
      [AchievementLevel.SILVER]: {
        name: 'Silver Traveler',
        description: 'Found 40+ states',
        color: '#C0C0C0',
      },
      [AchievementLevel.GOLD]: {
        name: 'Gold Master',
        description: 'Found all 50 states!',
        color: '#FFD700',
      },
    };

    return badges[level];
  }

  /**
   * Store completion event (placeholder for future database implementation)
   */
  private async storeCompletionEvent(event: GameCompletionEvent): Promise<void> {
    // In a real implementation, this would save to a completion_events table
    console.log('Completion event stored:', event);
  }

  /**
   * Check if user has achieved any milestones
   */
  public async checkMilestones(): Promise<Array<{milestone: string; achieved: boolean; progress: number}>> {
    const stats = await this.getCompletionStats();
    
    const milestones = [
      {
        milestone: 'First Game Completed',
        achieved: stats.completedGames > 0,
        progress: stats.completedGames > 0 ? 100 : 0,
      },
      {
        milestone: 'Bronze Explorer (25+ states)',
        achieved: stats.achievementCounts[AchievementLevel.BRONZE] > 0,
        progress: stats.achievementCounts[AchievementLevel.BRONZE] > 0 ? 100 : 0,
      },
      {
        milestone: 'Silver Traveler (40+ states)',
        achieved: stats.achievementCounts[AchievementLevel.SILVER] > 0,
        progress: stats.achievementCounts[AchievementLevel.SILVER] > 0 ? 100 : 0,
      },
      {
        milestone: 'Gold Master (50 states)',
        achieved: stats.achievementCounts[AchievementLevel.GOLD] > 0,
        progress: stats.achievementCounts[AchievementLevel.GOLD] > 0 ? 100 : 0,
      },
      {
        milestone: 'Complete 5 Games',
        achieved: stats.completedGames >= 5,
        progress: Math.min((stats.completedGames / 5) * 100, 100),
      },
      {
        milestone: 'Complete 10 Games',
        achieved: stats.completedGames >= 10,
        progress: Math.min((stats.completedGames / 10) * 100, 100),
      },
    ];

    return milestones;
  }
}
