# 50 State License Plate Game

A React Native mobile application for tracking license plates from all 50 US states during road trips.

## Project Structure

```
src/
├── models/          # Data models and TypeScript interfaces
├── database/        # Database configuration, migrations, and DAOs
├── repositories/    # Data access layer and business logic
├── screens/         # UI screens and navigation
├── components/      # Reusable UI components
├── utils/           # Helper functions, constants, and utilities
├── assets/          # Images, fonts, and other static assets
├── test/            # Unit tests
└── docs/            # Project documentation
```

## Development Setup

### Prerequisites

- Node.js >= 20
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. For iOS:
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

- iOS: `npm run ios`
- Android: `npm run android`
- Start Metro: `npm start`

### Testing

- Run tests: `npm test`
- Run tests in watch mode: `npm run test:watch`

## Features

- Create and manage license plate hunting games
- Track progress through all 50 US states
- View game history and statistics
- Offline functionality with local SQLite storage
- Clean, intuitive user interface

## Technology Stack

- React Native 0.81.4
- TypeScript
- SQLite (react-native-sqlite-storage)
- React Navigation (planned)
- React Native Safe Area Context

## Development Phases

- **Phase 1**: MVP with core game functionality
- **Phase 2**: Enhanced UX and additional features
- **Phase 3**: Polish and app store preparation
