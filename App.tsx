/**
 * 50 State License Plate Game
 * Main App Component
 * 
 * @format
 */

import React, { useEffect, useState } from 'react';
import { NewAppScreen } from '@react-native/new-app-screen';
import { StatusBar, StyleSheet, useColorScheme, View, Text, Button, Alert } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { databaseManager } from './src/database/DatabaseManager';
import { Game } from './src/models/types';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [isDbReady, setIsDbReady] = useState(false);
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    initializeDatabase();
  }, []);

  const initializeDatabase = async () => {
    try {
      await databaseManager.initialize();
      setIsDbReady(true);
      await loadGames();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      Alert.alert('Database Error', 'Failed to initialize database');
    }
  };

  const loadGames = async () => {
    try {
      const gameRepo = databaseManager.getGameRepository();
      const allGames = await gameRepo.getAllGames();
      setGames(allGames);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  const createTestGame = async () => {
    try {
      const gameRepo = databaseManager.getGameRepository();
      const newGame = await gameRepo.createGame({
        name: `Test Game ${Date.now()}`,
        startDate: new Date().toISOString(),
        startLocation: 'New York',
        destination: 'California',
        isComplete: false,
      });
      
      Alert.alert('Success', `Created game: ${newGame.name}`);
      await loadGames();
    } catch (error) {
      console.error('Failed to create game:', error);
      Alert.alert('Error', 'Failed to create game');
    }
  };

  if (!isDbReady) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Initializing Database...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>50 State License Plate Game</Text>
        <Text style={styles.subtitle}>Database Layer Ready!</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.gamesCount}>Games: {games.length}</Text>
        <Button title="Create Test Game" onPress={createTestGame} />
        
        {games.length > 0 && (
          <View style={styles.gamesList}>
            <Text style={styles.gamesListTitle}>Recent Games:</Text>
            {games.slice(0, 3).map((game) => (
              <Text key={game.id} style={styles.gameItem}>
                {game.name} - {game.isComplete ? 'Complete' : 'Active'}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  gamesCount: {
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '600',
  },
  gamesList: {
    marginTop: 30,
    width: '100%',
  },
  gamesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  gameItem: {
    fontSize: 14,
    marginBottom: 5,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 8,
  },
});

export default App;
