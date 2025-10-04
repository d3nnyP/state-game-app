/**
 * 50 State License Plate Game
 * Simple App without Navigation (to fix gesture handler issues)
 * 
 * @format
 */

import React from 'react';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS, SPACING, APP_CONFIG } from './src/utils/constants';
import { ActiveGameScreen } from './src/screens/ActiveGameScreen';
import { CreateGameScreen } from './src/screens/CreateGameScreen';
import { GameHistoryScreen } from './src/screens/GameHistoryScreen';
import { GameProvider } from './src/contexts/GameContext';

function App() {
  const [currentScreen, setCurrentScreen] = React.useState('main');

  const renderMainScreen = () => (
    <View style={styles.content}>
      <Text style={styles.title}>{APP_CONFIG.name}</Text>
      <Text style={styles.subtitle}>Track license plates from all 50 states</Text>
      
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setCurrentScreen('create')}
      >
        <Text style={styles.primaryButtonText}>Create New Game</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setCurrentScreen('active')}
      >
        <Text style={styles.secondaryButtonText}>Continue Game</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setCurrentScreen('history')}
      >
        <Text style={styles.secondaryButtonText}>Game History</Text>
      </TouchableOpacity>
      
      <Text style={styles.footerText}>
        Start your journey to find all 50 state license plates!
      </Text>
    </View>
  );

  const renderCreateScreen = () => (
    <CreateGameScreen 
      onBack={() => setCurrentScreen('main')}
      onCreateGame={() => setCurrentScreen('active')}
    />
  );

  const renderActiveScreen = () => (
    <ActiveGameScreen onBack={() => setCurrentScreen('main')} />
  );

  const renderHistoryScreen = () => (
    <GameHistoryScreen onBack={() => setCurrentScreen('main')} />
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'create':
        return renderCreateScreen();
      case 'active':
        return renderActiveScreen();
      case 'history':
        return renderHistoryScreen();
      default:
        return renderMainScreen();
    }
  };

  return (
    <SafeAreaProvider>
      <GameProvider>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
          {renderCurrentScreen()}
        </SafeAreaView>
      </GameProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  info: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: SPACING.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: SPACING.lg,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: SPACING.lg,
  },
});

export default App;