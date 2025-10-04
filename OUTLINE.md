# 50 State License Plate Game - Mobile App Scope of Work

## Project Overview

A simple, intuitive mobile application for iOS and Android that digitizes the classic road trip game of spotting license plates from all 50 US states.

## Core Features

### Game Management

**Create New Game**: Start a new license plate hunting session

- Game name (e.g., "Summer Vacation 2025")
- Start date
- Start location
- Destination
- Optional: End date, participants

**Active Game Interface**

- Clean, scrollable list of all 50 states
- Large, easy-to-tap checkboxes for each state
- Visual progress indicator (X/50 states found)
- Timestamp when each state is spotted
- Optional: Add photo of the license plate

### Game History

**Past Games Archive**

- Chronological list of completed/paused games
- Quick stats: completion percentage, duration, states found
- Detailed view showing all spotted states with timestamps

### Statistics Dashboard

- Total games played
- Best completion percentage
- Most commonly spotted states
- Rarest states found
- Personal records and achievements

## User Experience Requirements

### Simplicity First

- Minimal onboarding (2-3 screens max)
- One-tap state marking
- Offline functionality (no internet required during gameplay)
- Large touch targets for easy use while traveling

### Visual Design

- Clean, modern interface
- High contrast for outdoor visibility
- Dark mode support
- State abbreviations and full names
- Color coding for found/unfound states

## Technical Specifications

### Platform Support

- **iOS**: iOS 14+ (iPhone and iPad)
- **Android**: Android 8+ (API level 26+)

### Architecture

- Native development (Swift for iOS, Kotlin for Android) OR
- Cross-platform framework (Flutter or React Native)
- Local SQLite database for data storage
- Cloud sync optional (future enhancement)

### Core Data Models

```typescript
Game {
  id, name, startDate, endDate, startLocation,
  destination, isComplete, createdAt
}

SpottedState {
  gameId, stateCode, spottedAt, photoPath (optional)
}

User Settings {
  darkMode, notifications, tutorial completed
}
```

## Development Phases

### Phase 1: MVP (4-6 weeks) - Detailed Breakdown

#### Week 1: Foundation & Setup

**Days 1-2: Project Setup**

- [ ] Set up development environment (Xcode/Android Studio)
- [ ] Create new project with proper folder structure
  - [ ] `src/main/` (Android) or Project Root (iOS)
  - [ ] `models/` - Data models (Game, SpottedState, User)
  - [ ] `database/` - Database helper, migrations, DAOs
  - [ ] `repositories/` - Data access layer, business logic
  - [ ] `screens/` or `views/` - UI screens/view controllers
  - [ ] `components/` - Reusable UI components
  - [ ] `utils/` - Helper functions, constants, extensions
  - [ ] `assets/` - Images, fonts, color schemes
  - [ ] `test/` - Unit tests mirroring main structure
  - [ ] `androidTest/` (Android) or `UITests/` (iOS) - Integration tests
  - [ ] `docs/` - Project documentation, API specs
  - [ ] `scripts/` - Build scripts, automation tools
- [ ] Configure version control (Git repository)
- [ ] Set up basic app configuration (bundle ID, permissions, etc.)
- [ ] Create app icons and basic branding assets

**Days 3-5: Data Layer**

- [ ] Install and configure react-native-sqlite-storage
  - [ ] Run `npm install react-native-sqlite-storage`
  - [ ] Link native dependencies (if React Native < 0.60)
  - [ ] Add iOS/Android permissions for file system access
  - [ ] Test basic SQLite connection
- [ ] Design database schema and create TypeScript models
  - [ ] Define Game interface/type:
    ```typescript
    interface Game {
      id: string;
      name: string;
      startDate: string; // ISO date string
      endDate?: string;
      startLocation: string;
      destination: string;
      isComplete: boolean;
      createdAt: string;
    }
    ```
  - [ ] Define SpottedState interface/type:
    ```typescript
    interface SpottedState {
      id: string;
      gameId: string;
      stateCode: string; // Two-letter state code (e.g., 'CA')
      spottedAt: string; // ISO timestamp
    }
    ```
  - [ ] Create US_STATES constant array with all 50 states
  - [ ] Create database configuration types and constants
- [ ] Build database initialization service
  - [ ] Create DatabaseService.ts class
  - [ ] Implement database connection management
  - [ ] Add database file path configuration
  - [ ] Create database opening/closing methods
  - [ ] Add error handling and logging
- [ ] Write database schema creation scripts
  - [ ] Create initializeDatabase() method
  - [ ] Write Games table creation SQL:
    ```sql
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
    ```
  - [ ] Write SpottedStates table creation SQL:
    ```sql
    CREATE TABLE IF NOT EXISTS spotted_states (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      stateCode TEXT NOT NULL,
      spottedAt TEXT NOT NULL,
      FOREIGN KEY (gameId) REFERENCES games (id),
      UNIQUE(gameId, stateCode)
    );
    ```
  - [ ] Add database indexes for performance
  - [ ] Test database creation on both iOS and Android
- [ ] Create data access layer (Repository pattern)
  - [ ] Build GameRepository.ts:
    - [ ] `createGame(game: Omit<Game, 'id' | 'createdAt'>): Promise<Game>`
    - [ ] `getGameById(id: string): Promise<Game | null>`
    - [ ] `getAllGames(): Promise<Game[]>`
    - [ ] `updateGame(id: string, updates: Partial<Game>): Promise<void>`
    - [ ] `deleteGame(id: string): Promise<void>`
    - [ ] `getActiveGame(): Promise<Game | null>`
    - [ ] `markGameComplete(id: string): Promise<void>`
  - [ ] Build SpottedStateRepository.ts:
    - [ ] `addSpottedState(gameId: string, stateCode: string): Promise<void>`
    - [ ] `removeSpottedState(gameId: string, stateCode: string): Promise<void>`
    - [ ] `getSpottedStatesForGame(gameId: string): Promise<SpottedState[]>`
    - [ ] `getGameProgress(gameId: string): Promise<{ found: number; total: number }>`
    - [ ] `isStateSpotted(gameId: string, stateCode: string): Promise<boolean>`
- [ ] Add database versioning and migration system
  - [ ] Create DatabaseMigrations.ts
  - [ ] Implement version tracking table
  - [ ] Add migration runner for schema changes
  - [ ] Create rollback functionality (basic)
  - [ ] Test migrations with sample data
- [ ] Write comprehensive unit tests for data layer
  - [ ] Test database connection and initialization
  - [ ] Test all GameRepository methods with mock data
  - [ ] Test all SpottedStateRepository methods
  - [ ] Test error scenarios (database locked, invalid data)
  - [ ] Test data persistence across app restarts
  - [ ] Add test database cleanup utilities

#### Week 2: Core Game Logic

**Days 6-8: Game Management**

- [ ] Implement "Create New Game" functionality
- [ ] Build game state management (active game tracking)
- [ ] Create state list data structure (all 50 states)
- [ ] Implement state toggle functionality (mark as found/unfound)
- [ ] Add game completion detection logic

**Days 9-10: Basic Navigation**

- [ ] Set up app navigation structure
- [ ] Create main navigation between screens
- [ ] Implement basic routing/screen transitions

#### Week 3: User Interface Development

**Days 11-13: Core Screens - Wireframe Level**

- [ ] Create main menu/home screen layout
- [ ] Build "Create New Game" form screen
- [ ] Design active game screen with state list
- [ ] Implement basic game history list screen
- [ ] Focus on functionality over aesthetics

**Days 14-15: State List Interface**

- [ ] Create scrollable list of all 50 states
- [ ] Implement checkbox/toggle functionality
- [ ] Add visual feedback for tapped states
- [ ] Show progress counter (X/50 states found)
- [ ] Handle state persistence when toggling

#### Week 4: Integration & Polish

**Days 16-18: Screen Integration**

- [ ] Connect all screens with proper navigation
- [ ] Implement data flow between screens
- [ ] Add form validation for new game creation
- [ ] Handle edge cases (empty states, invalid inputs)
- [ ] Test complete user flow from start to finish

**Days 19-20: MVP Testing & Bug Fixes**

- [ ] Manual testing on target devices
- [ ] Fix critical bugs and crashes
- [ ] Test data persistence across app restarts
- [ ] Verify offline functionality works properly
- [ ] Basic performance optimization

### Detailed Task Breakdown by Component

#### Database Tasks

- [ ] Install and configure react-native-sqlite-storage
- [ ] Write database initialization and migration scripts
- [ ] Create Game table with fields: id, name, startDate, startLocation, destination, isComplete, createdAt
- [ ] Create SpottedStates table with fields: gameId, stateCode, spottedAt
- [ ] Write database service class with CRUD operations
- [ ] Add database versioning and migration handling

#### UI/UX Tasks

- [ ] Create app color scheme and basic styling
- [ ] Design form layouts for game creation
- [ ] Create list item layout for states (checkbox + state name)
- [ ] Design simple progress indicator
- [ ] Create basic app header/title bars
- [ ] Implement responsive layout for different screen sizes

#### Core Logic Tasks

- [ ] Create 50-state reference data (state codes, full names)
- [ ] Implement game creation with validation
- [ ] Build state toggle mechanism with instant feedback
- [ ] Add automatic progress calculation
- [ ] Create game completion detection
- [ ] Implement basic game history retrieval

#### Testing Tasks

- [ ] Create test games with various state combinations
- [ ] Test app behavior with no games created
- [ ] Test creating multiple games
- [ ] Verify data persists after app closure
- [ ] Test on different device sizes and orientations

### Key Deliverables for Phase 1

- ✅ Working app that can create new games
- ✅ Functional state checklist with progress tracking
- ✅ Game history that shows past games
- ✅ All data stored locally and persists between sessions
- ✅ Basic but clean user interface
- ✅ Stable performance on target devices

### Phase 2: Enhanced UX (2-3 weeks)

- [ ] Improved visual design and animations
- [ ] Statistics dashboard
- [ ] Photo capture functionality
- [ ] Dark mode implementation

### Phase 3: Polish & Launch (2-3 weeks)

- [ ] App store optimization
- [ ] Performance testing
- [ ] User testing and bug fixes
- [ ] App store submission

## Optional Future Enhancements

- [ ] Social sharing of completed games
- [ ] Cloud backup and sync across devices
- [ ] Canada provinces expansion
- [ ] Achievement badges and gamification
- [ ] Export game data as PDF/image
- [ ] Apple Watch companion app
- [ ] Location-based automatic state detection

## Success Metrics

- **User engagement**: Games completed per user
- **Retention**: Users returning for multiple trips
- **Usability**: Time to create and start new game < 30 seconds
- **Performance**: App launch time < 3 seconds

## Risk Considerations

- **Offline Usage**: Ensure full functionality without internet
- **Battery Usage**: Minimize background processing
- **Screen Visibility**: Design for bright outdoor conditions
- **Accidental Taps**: Implement undo functionality

## Project Timeline & Budget

### Estimated Timeline

- **Total Development**: 8-12 weeks
- **MVP Release**: 6-8 weeks
- **Full Feature Release**: 10-14 weeks

### Budget Considerations

- Development team (1-2 developers)
- UI/UX design
- App store fees ($99/year iOS, $25 one-time Android)
- Testing devices
- Optional: Analytics and crash reporting tools
