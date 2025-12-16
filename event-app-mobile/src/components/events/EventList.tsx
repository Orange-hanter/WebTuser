import React, { FC, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  ActivityIndicator 
} from 'react-native';
import { EventCard } from './EventCard';
import { EmptyState } from '@/components/common';
import EventApi from '@/services/eventApi';
import type { Event } from '@/types';

interface EventListProps {
  onEventPress: (event: Event) => void;
  category?: string;
  searchQuery?: string;
}

export const EventList: FC<EventListProps> = ({ onEventPress, category, searchQuery }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 10;

  const fetchEvents = async (isRefresh = false) => {
    const currentOffset = isRefresh ? 0 : offset;
    
    try {
      let response;
      
      if (searchQuery) {
        response = await EventApi.searchEvents(searchQuery, currentOffset, LIMIT);
      } else if (category) {
        response = await EventApi.getEventsByCategory(category, currentOffset, LIMIT);
      } else {
        response = await EventApi.getEvents(currentOffset, LIMIT);
      }

      if (response.success) {
        if (isRefresh) {
          setEvents(response.data);
        } else {
          setEvents(prev => [...prev, ...response.data]);
        }
        setHasMore(response.pagination.hasMore);
        setOffset(currentOffset + LIMIT);
      }
    } catch (error) {
      console.error('Fetch events error:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setOffset(0);
    setEvents([]);
    fetchEvents(true);
  }, [category, searchQuery]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setOffset(0);
    fetchEvents(true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      fetchEvents();
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#6366f1" />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <EmptyState
        title="События не найдены"
        description="Попробуйте изменить параметры поиска или создайте своё событие"
        icon="calendar-outline"
      />
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <EventCard event={item} onPress={() => onEventPress(item)} />
      )}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#6366f1"
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
