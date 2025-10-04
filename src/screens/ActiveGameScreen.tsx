import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, US_STATES } from '../utils/constants';
import { useGame } from '../contexts/GameContext';

interface ActiveGameScreenProps {
  onBack: () => void;
}

interface StateItem {
  code: string;
  name: string;
  isSpotted: boolean;
}

export function ActiveGameScreen({ onBack }: ActiveGameScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentGame, spottedStates, toggleState, isLoading, error, completeGame } = useGame();
  const insets = useSafeAreaInsets();

  const states: StateItem[] = US_STATES.map(state => ({
    ...state,
    isSpotted: spottedStates.some(s => s.stateCode === state.code),
  }));

  const handleToggleState = async (stateCode: string) => {
    try {
      await toggleState(stateCode);
    } catch (err) {
      Alert.alert('Error', 'Failed to update state. Please try again.');
    }
  };

  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    state.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const spottedCount = states.filter(state => state.isSpotted).length;
  const totalCount = states.length;
  const progressPercentage = Math.round((spottedCount / totalCount) * 100);

  // Auto-complete game when all states are spotted
  useEffect(() => {
    if (spottedCount === totalCount && currentGame && !currentGame.endDate) {
      Alert.alert(
        '🎉 Congratulations!',
        'You found all 50 state license plates! Your game has been completed.',
        [
          {
            text: 'Complete Game',
            onPress: async () => {
              try {
                await completeGame();
              } catch (err) {
                Alert.alert('Error', 'Failed to complete game. Please try again.');
              }
            },
          },
        ]
      );
    }
  }, [spottedCount, totalCount, currentGame, completeGame]);

  const renderStateItem = ({ item }: { item: StateItem }) => (
    <TouchableOpacity
      style={[
        styles.stateItem,
        item.isSpotted && styles.stateItemSpotted,
      ]}
      onPress={() => handleToggleState(item.code)}
      activeOpacity={0.7}
    >
      <View style={styles.stateItemContent}>
        <View style={styles.stateInfo}>
          <Text style={[
            styles.stateCode,
            item.isSpotted && styles.stateCodeSpotted,
          ]}>
            {item.code}
          </Text>
          <Text style={[
            styles.stateName,
            item.isSpotted && styles.stateNameSpotted,
          ]}>
            {item.name}
          </Text>
        </View>
        <View style={[
          styles.checkbox,
          item.isSpotted && styles.checkboxChecked,
        ]}>
          {item.isSpotted && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentGame) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.noGameContainer}>
          <Text style={styles.noGameText}>No active game found</Text>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={[styles.header, { 
        paddingTop: Platform.OS === 'ios' ? insets.top - 40 : insets.top - 10,
        marginTop: Platform.OS === 'ios' ? -40 : -10
      }]}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{currentGame.name}</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Progress</Text>
          <Text style={styles.progressText}>
            {spottedCount}/{totalCount} states found
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressPercentage}>{progressPercentage}%</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search states..."
          placeholderTextColor={COLORS.textSecondary}
        />
      </View>

      <FlatList
        data={filteredStates}
        renderItem={renderStateItem}
        keyExtractor={(item) => item.code}
        style={styles.statesList}
        showsVerticalScrollIndicator={false}
      />

      {spottedCount === totalCount && (
        <View style={styles.completionContainer}>
          <Text style={styles.completionText}>🎉 Congratulations!</Text>
          <Text style={styles.completionSubtext}>You found all 50 states!</Text>
        </View>
      )}
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
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
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
  progressContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    margin: SPACING.lg,
    borderRadius: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statesList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  stateItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stateItemSpotted: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  stateItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stateInfo: {
    flex: 1,
  },
  stateCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 2,
  },
  stateCodeSpotted: {
    color: COLORS.primary,
  },
  stateName: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  stateNameSpotted: {
    color: COLORS.primary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: 'bold',
  },
  completionContainer: {
    backgroundColor: COLORS.primary,
    margin: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  completionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.background,
    marginBottom: SPACING.sm,
  },
  completionSubtext: {
    fontSize: 16,
    color: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error || '#FF3B30',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  noGameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  noGameText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
});