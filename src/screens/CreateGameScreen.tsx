import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../utils/constants';
import { useGame } from '../contexts/GameContext';

interface CreateGameScreenProps {
  onBack: () => void;
  onCreateGame: () => void;
}

export function CreateGameScreen({ onBack, onCreateGame }: CreateGameScreenProps) {
  const [gameName, setGameName] = useState('');
  const { createGame, isLoading, error } = useGame();

  const handleCreateGame = async () => {
    if (!gameName.trim()) {
      Alert.alert('Error', 'Please enter a game name');
      return;
    }

    try {
      await createGame(gameName.trim());
      Alert.alert(
        'Game Created!',
        `"${gameName}" game has been created. Start tracking those license plates!`,
        [
          {
            text: 'Start Playing',
            onPress: onCreateGame,
          },
        ]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to create game. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create New Game</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Create a new game to start tracking license plates from all 50 US states.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Game Name</Text>
          <TextInput
            style={styles.textInput}
            value={gameName}
            onChangeText={setGameName}
            placeholder="Enter a name for your game..."
            placeholderTextColor={COLORS.textSecondary}
            maxLength={50}
          />
          <Text style={styles.inputHint}>
            Give your game a memorable name (e.g., "Summer Road Trip 2024")
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, !gameName.trim() && styles.primaryButtonDisabled]}
          onPress={handleCreateGame}
          disabled={!gameName.trim()}
        >
          <Text style={[styles.primaryButtonText, !gameName.trim() && styles.primaryButtonTextDisabled]}>
            Create Game
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>How to Play:</Text>
          <Text style={styles.infoText}>
            • Look for license plates from all 50 US states{'\n'}
            • Tap on a state when you spot its license plate{'\n'}
            • Track your progress as you find more states{'\n'}
            • Complete the game when you find all 50!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  backButtonText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    padding: SPACING.lg,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  inputHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  primaryButtonTextDisabled: {
    color: COLORS.textSecondary,
  },
  infoContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});