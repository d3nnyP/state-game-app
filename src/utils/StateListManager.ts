import { StateInfo } from '../models/types';
import { US_STATES } from '../utils/constants';

export interface StateListManager {
  getAllStates(): StateInfo[];
  getStateByCode(code: string): StateInfo | null;
  getStateByName(name: string): StateInfo | null;
  isValidStateCode(code: string): boolean;
  getStatesByRegion(region: StateRegion): StateInfo[];
  getStatesByFirstLetter(letter: string): StateInfo[];
  searchStates(query: string): StateInfo[];
  getStateStatistics(states: StateInfo[]): StateStatistics;
}

export interface StateStatistics {
  total: number;
  spotted: number;
  remaining: number;
  percentage: number;
  spottedStates: StateInfo[];
  remainingStates: StateInfo[];
}

export enum StateRegion {
  NORTHEAST = 'northeast',
  SOUTHEAST = 'southeast',
  MIDWEST = 'midwest',
  SOUTHWEST = 'southwest',
  WEST = 'west',
  PACIFIC = 'pacific',
}

export class StateListManagerImpl implements StateListManager {
  private states: StateInfo[];

  constructor() {
    this.states = US_STATES.map(state => ({
      code: state.code,
      name: state.name,
    }));
  }

  /**
   * Get all states
   */
  public getAllStates(): StateInfo[] {
    return [...this.states];
  }

  /**
   * Get state by code
   */
  public getStateByCode(code: string): StateInfo | null {
    return this.states.find(state => state.code === code) || null;
  }

  /**
   * Get state by name
   */
  public getStateByName(name: string): StateInfo | null {
    return this.states.find(state => 
      state.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }

  /**
   * Check if state code is valid
   */
  public isValidStateCode(code: string): boolean {
    return this.states.some(state => state.code === code);
  }

  /**
   * Get states by region
   */
  public getStatesByRegion(region: StateRegion): StateInfo[] {
    const regionMap: Record<StateRegion, string[]> = {
      [StateRegion.NORTHEAST]: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
      [StateRegion.SOUTHEAST]: ['AL', 'AR', 'DE', 'FL', 'GA', 'KY', 'LA', 'MD', 'MS', 'NC', 'SC', 'TN', 'VA', 'WV'],
      [StateRegion.MIDWEST]: ['IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI'],
      [StateRegion.SOUTHWEST]: ['AZ', 'NM', 'OK', 'TX'],
      [StateRegion.WEST]: ['CO', 'ID', 'MT', 'NV', 'UT', 'WY'],
      [StateRegion.PACIFIC]: ['AK', 'CA', 'HI', 'OR', 'WA'],
    };

    const regionCodes = regionMap[region] || [];
    return this.states.filter(state => regionCodes.includes(state.code));
  }

  /**
   * Get states by first letter
   */
  public getStatesByFirstLetter(letter: string): StateInfo[] {
    const upperLetter = letter.toUpperCase();
    return this.states.filter(state => state.name.startsWith(upperLetter));
  }

  /**
   * Search states by name or code
   */
  public searchStates(query: string): StateInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.states.filter(state => 
      state.name.toLowerCase().includes(lowerQuery) ||
      state.code.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get statistics for a list of states
   */
  public getStateStatistics(states: StateInfo[]): StateStatistics {
    const spotted = states.filter(state => state.isSpotted);
    const remaining = states.filter(state => !state.isSpotted);
    const total = states.length;
    const percentage = total > 0 ? Math.round((spotted.length / total) * 100) : 0;

    return {
      total,
      spotted: spotted.length,
      remaining: remaining.length,
      percentage,
      spottedStates: spotted,
      remainingStates: remaining,
    };
  }

  /**
   * Sort states by various criteria
   */
  public sortStates(states: StateInfo[], sortBy: 'name' | 'code' | 'spotted' | 'spottedAt'): StateInfo[] {
    return [...states].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'code':
          return a.code.localeCompare(b.code);
        case 'spotted':
          if (a.isSpotted === b.isSpotted) return 0;
          return a.isSpotted ? -1 : 1;
        case 'spottedAt':
          if (!a.spottedAt && !b.spottedAt) return 0;
          if (!a.spottedAt) return 1;
          if (!b.spottedAt) return -1;
          return new Date(b.spottedAt).getTime() - new Date(a.spottedAt).getTime();
        default:
          return 0;
      }
    });
  }

  /**
   * Get states grouped by region
   */
  public getStatesGroupedByRegion(): Record<StateRegion, StateInfo[]> {
    const grouped: Record<StateRegion, StateInfo[]> = {} as Record<StateRegion, StateInfo[]>;
    
    Object.values(StateRegion).forEach(region => {
      grouped[region] = this.getStatesByRegion(region);
    });

    return grouped;
  }

  /**
   * Get states grouped by first letter
   */
  public getStatesGroupedByFirstLetter(): Record<string, StateInfo[]> {
    const grouped: Record<string, StateInfo[]> = {};
    
    this.states.forEach(state => {
      const firstLetter = state.name.charAt(0);
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(state);
    });

    return grouped;
  }

  /**
   * Get random states (useful for testing or demo purposes)
   */
  public getRandomStates(count: number): StateInfo[] {
    const shuffled = [...this.states].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.states.length));
  }

  /**
   * Get states that are commonly spotted (for demo purposes)
   */
  public getCommonlySpottedStates(): StateInfo[] {
    // These are typically the most populous states and most likely to be spotted
    const commonCodes = ['CA', 'TX', 'FL', 'NY', 'PA', 'IL', 'OH', 'GA', 'NC', 'MI'];
    return this.states.filter(state => commonCodes.includes(state.code));
  }

  /**
   * Get states that are rarely spotted (for demo purposes)
   */
  public getRarelySpottedStates(): StateInfo[] {
    // These are typically smaller or more remote states
    const rareCodes = ['AK', 'HI', 'VT', 'RI', 'DE', 'ND', 'SD', 'MT', 'WY', 'NH'];
    return this.states.filter(state => rareCodes.includes(state.code));
  }
}

// Export singleton instance
export const stateListManager = new StateListManagerImpl();
