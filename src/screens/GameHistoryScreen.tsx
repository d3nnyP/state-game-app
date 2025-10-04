import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../utils/constants';
import { useGame } from '../contexts/GameContext';
import { Game } from '../models/types';

interface GameHistoryScreenProps {
  onBack: () => void;
}

interface GameItemProps {
  game: Game;
  onResume: (gameId: string) => void;
  onDelete: (gameId: string) => void;
  isActive: boolean;
}

function GameItem({ game, onResume, onDelete, isActive }: GameItemProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getGameStatus = () => {
    if (game.completedAt) {
      return { text: 'Completed', color: COLORS.success || '#34C759', icon: '✅' };
    } else if (isActive) {
      return { text: 'Active', color: COLORS.primary, icon: '▶️' };
    } else {
      return { text: 'Incomplete', color: COLORS.textSecondary, icon: '⏸️' };
    }
  };

  const status = getGameStatus();

  const handleResume = () => {
    Alert.alert(
      'Resume Game',
      `Do you want to resume "${game.name}"? This will make it your active game.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Resume', onPress: () => onResume(game.id) },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Game',
      `Are you sure you want to delete "${game.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(game.id) },
      ]
    );
  };

  return (
    <View style={[styles.gameItem, isActive && styles.activeGameItem]}>
      <View style={styles.gameHeader}>
        <View style={styles.gameInfo}>
          <Text style={[styles.gameName, isActive && styles.activeGameName]}>
            {game.name}
          </Text>
          <View style={styles.statusContainer}>
            <Text style={styles.statusIcon}>{status.icon}</Text>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.text}
            </Text>
          </View>
        </View>
        <View style={styles.gameActions}>
          {!game.completedAt && !isActive && (
            <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.gameDetails}>
        <Text style={styles.gameDate}>
          Created: {formatDate(game.createdAt)} at {formatTime(game.createdAt)}
        </Text>
        {game.completedAt && (
          <Text style={styles.completionDate}>
            Completed: {formatDate(game.completedAt)} at {formatTime(game.completedAt)}
          </Text>
        )}
      </View>
    </View>
  );
}

export function GameHistoryScreen({ onBack }: GameHistoryScreenProps) {
  const { allGames, isLoading, error, resumeGame, deleteGame, loadAllGames, currentGame } = useGame();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAllGames();
    } finally {
      setRefreshing(false);
    }
  };

  const handleResume = async (gameId: string) => {
    try {
      await resumeGame(gameId);
      Alert.alert('Success', 'Game resumed successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to resume game. Please try again.');
    }
  };

  const handleDelete = async (gameId: string) => {
    try {
      await deleteGame(gameId);
      Alert.alert('Success', 'Game deleted successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to delete game. Please try again.');
    }
  };

  const renderGameItem = ({ item }: { item: Game }) => (
    <GameItem
      game={item}
      onResume={handleResume}
      onDelete={handleDelete}
      isActive={currentGame?.id === item.id}
    />
  );

  const getGameStats = () => {
    const totalGames = allGames.length;
    const completedGames = allGames.filter(game => game.completedAt).length;
    const activeGames = allGames.filter(game => game.isActive).length;
    
    return { totalGames, completedGames, activeGames };
  };

  const stats = getGameStats();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Game History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Game History</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Game History</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalGames}</Text>
          <Text style={styles.statLabel}>Total Games</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.completedGames}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.activeGames}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {allGames.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Games Yet</Text>
          <Text style={styles.emptyText}>
            Create your first game to start tracking license plates!
          </Text>
        </View>
      ) : (
        <FlatList
          data={allGames}
          renderItem={renderGameItem}
          keyExtractor={(item) => item.id}
          style={styles.gamesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    margin: SPACING.lg,
    borderRadius: 12,
    padding: SPACING.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  gamesList: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  gameItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeGameItem: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  gameInfo: {
    flex: 1,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  activeGameName: {
    color: COLORS.primary,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gameActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resumeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    marginRight: SPACING.sm,
  },
  resumeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.background,
  },
  deleteButton: {
    backgroundColor: COLORS.error || '#FF3B30',
    borderRadius: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.background,
  },
  gameDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm,
  },
  gameDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  completionDate: {
    fontSize: 12,
    color: COLORS.success || '#34C759',
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
  retryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});