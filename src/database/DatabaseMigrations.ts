import { DatabaseService } from './DatabaseService';

export interface Migration {
  version: number;
  name: string;
  up: string;
  down?: string;
}

export class DatabaseMigrations {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = DatabaseService.getInstance();
  }

  /**
   * Initialize the migrations table
   */
  public async initializeMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at TEXT NOT NULL
      );
    `;
    await this.dbService.executeQuery(sql);
  }

  /**
   * Get the current database version
   */
  public async getCurrentVersion(): Promise<number> {
    try {
      const sql = 'SELECT MAX(version) as version FROM migrations';
      const result = await this.dbService.executeQuery(sql);
      return result.rows.item(0).version || 0;
    } catch (error) {
      // If migrations table doesn't exist, return 0
      return 0;
    }
  }

  /**
   * Check if a migration has been executed
   */
  public async isMigrationExecuted(version: number): Promise<boolean> {
    const sql = 'SELECT COUNT(*) as count FROM migrations WHERE version = ?';
    const result = await this.dbService.executeQuery(sql, [version]);
    return result.rows.item(0).count > 0;
  }

  /**
   * Mark a migration as executed
   */
  public async markMigrationExecuted(migration: Migration): Promise<void> {
    const sql = `
      INSERT INTO migrations (version, name, executed_at)
      VALUES (?, ?, ?)
    `;
    const executedAt = new Date().toISOString();
    await this.dbService.executeQuery(sql, [migration.version, migration.name, executedAt]);
  }

  /**
   * Execute a migration
   */
  public async executeMigration(migration: Migration): Promise<void> {
    try {
      await this.dbService.executeQuery(migration.up);
      await this.markMigrationExecuted(migration);
      console.log(`Migration ${migration.version}: ${migration.name} executed successfully`);
    } catch (error) {
      console.error(`Migration ${migration.version}: ${migration.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Rollback a migration (if down script is provided)
   */
  public async rollbackMigration(migration: Migration): Promise<void> {
    if (!migration.down) {
      throw new Error(`Migration ${migration.version} does not have a rollback script`);
    }

    try {
      await this.dbService.executeQuery(migration.down);
      
      // Remove migration record
      const sql = 'DELETE FROM migrations WHERE version = ?';
      await this.dbService.executeQuery(sql, [migration.version]);
      
      console.log(`Migration ${migration.version}: ${migration.name} rolled back successfully`);
    } catch (error) {
      console.error(`Rollback of migration ${migration.version}: ${migration.name} failed:`, error);
      throw error;
    }
  }

  /**
   * Run all pending migrations
   */
  public async runMigrations(): Promise<void> {
    await this.initializeMigrationsTable();
    
    const currentVersion = await this.getCurrentVersion();
    const migrations = this.getMigrations();
    
    const pendingMigrations = migrations.filter(m => m.version > currentVersion);
    
    if (pendingMigrations.length === 0) {
      console.log('No pending migrations');
      return;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      await this.executeMigration(migration);
    }

    console.log('All migrations completed successfully');
  }

  /**
   * Get all available migrations
   */
  private getMigrations(): Migration[] {
    return [
      {
        version: 1,
        name: 'Initial schema',
        up: `
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
          
          CREATE TABLE IF NOT EXISTS spotted_states (
            id TEXT PRIMARY KEY,
            gameId TEXT NOT NULL,
            stateCode TEXT NOT NULL,
            spottedAt TEXT NOT NULL,
            FOREIGN KEY (gameId) REFERENCES games (id) ON DELETE CASCADE,
            UNIQUE(gameId, stateCode)
          );
          
          CREATE INDEX IF NOT EXISTS idx_spotted_states_game_id 
          ON spotted_states(gameId);
          
          CREATE INDEX IF NOT EXISTS idx_spotted_states_state_code 
          ON spotted_states(stateCode);
        `,
        down: `
          DROP TABLE IF EXISTS spotted_states;
          DROP TABLE IF EXISTS games;
        `,
      },
      // Future migrations can be added here
      // {
      //   version: 2,
      //   name: 'Add photo support',
      //   up: 'ALTER TABLE spotted_states ADD COLUMN photoPath TEXT;',
      //   down: 'ALTER TABLE spotted_states DROP COLUMN photoPath;',
      // },
    ];
  }

  /**
   * Reset database (for testing purposes)
   */
  public async resetDatabase(): Promise<void> {
    const migrations = this.getMigrations();
    
    // Rollback migrations in reverse order
    for (let i = migrations.length - 1; i >= 0; i--) {
      const migration = migrations[i];
      if (await this.isMigrationExecuted(migration.version)) {
        await this.rollbackMigration(migration);
      }
    }
  }
}
