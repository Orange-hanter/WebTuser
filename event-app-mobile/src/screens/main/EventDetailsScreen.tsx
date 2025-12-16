import React, { FC, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import EventApi from '@/services/eventApi';
import { useToast } from '@/contexts';
import type { EventDetails, RootStackParamList } from '@/types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetails'>;

const { width } = Dimensions.get('window');

export const EventDetailsScreen: FC<Props> = ({ route, navigation }) => {
  const { eventId } = route.params;
  const { success, error: showError } = useToast();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await EventApi.getEventById(eventId);
      if (response.success) {
        setEvent(response.data);
      } else {
        showError(response.error || 'Ошибка загрузки события');
      }
    } catch (err) {
      showError('Ошибка загрузки события');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const response = await EventApi.joinEvent(eventId);
      if (response.success) {
        success('Вы записаны на событие!');
      } else {
        showError(response.error || 'Ошибка записи');
      }
    } catch (err) {
      showError('Ошибка записи на событие');
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Посмотри это событие: ${event?.title}\nhttps://your-domain.com/e/${eventId}`,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#94a3b8" />
          <Text style={styles.errorTitle}>Событие не найдено</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Вернуться назад</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: event.image }} 
            style={styles.heroImage}
            resizeMode="cover"
          />
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.shareButton}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{event.type}</Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{event.title}</Text>

          {/* Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <Ionicons name="calendar-outline" size={24} color="#6366f1" />
              <Text style={styles.infoCardLabel}>Дата</Text>
              <Text style={styles.infoCardValue}>{event.date}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="time-outline" size={24} color="#6366f1" />
              <Text style={styles.infoCardLabel}>Время</Text>
              <Text style={styles.infoCardValue}>{event.time}</Text>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="location-outline" size={24} color="#6366f1" />
              <Text style={styles.infoCardLabel}>Место</Text>
              <Text style={styles.infoCardValue} numberOfLines={2}>{event.location}</Text>
            </View>
          </View>

          {/* Rating & Attendees */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={20} color="#fbbf24" />
              <Text style={styles.statValue}>{event.rating}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people" size={20} color="#6366f1" />
              <Text style={styles.statValue}>{event.attendees} участников</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Описание</Text>
            <Text style={styles.description}>
              {event.fullDescription || event.description}
            </Text>
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Теги</Text>
            <View style={styles.tags}>
              {event.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Organizer */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Организатор</Text>
            <View style={styles.organizerCard}>
              <View style={styles.organizerAvatar}>
                <Text style={styles.organizerInitials}>
                  {event.organizer.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>{event.organizer.name}</Text>
                <View style={styles.organizerStats}>
                  <Ionicons name="star" size={14} color="#fbbf24" />
                  <Text style={styles.organizerRating}>{event.organizer.rating}</Text>
                  <Text style={styles.organizerReviews}>
                    ({event.organizer.reviews} отзывов)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Join Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.joinButton, isJoining && styles.joinButtonDisabled]}
          onPress={handleJoin}
          disabled={isJoining}
        >
          {isJoining ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.joinButtonText}>Записаться</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 48,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoCards: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  infoCardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  organizerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  organizerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  organizerInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  organizerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  organizerRating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  organizerReviews: {
    fontSize: 14,
    color: '#64748b',
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  joinButtonDisabled: {
    opacity: 0.7,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
