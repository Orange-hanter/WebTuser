import React, { FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext, useToast } from '@/contexts';
import { Avatar } from '@/components/common';
import TelegramService from '@/services/telegramService';

export const ProfileScreen: FC = () => {
  const { user, logout, bindTelegram, unbindTelegram, refreshTelegramStatus } = useAuthContext();
  const { success, error: showError } = useToast();

  const handleBindTelegram = async () => {
    try {
      const link = await bindTelegram();
      if (link) {
        await TelegramService.openTelegramLink(link.deeplink);
        // Обновляем статус через несколько секунд
        setTimeout(() => refreshTelegramStatus(), 5000);
      }
    } catch (err) {
      showError('Ошибка привязки Telegram');
    }
  };

  const handleUnbindTelegram = async () => {
    try {
      await unbindTelegram();
      success('Telegram отвязан');
    } catch (err) {
      showError('Ошибка отвязки Telegram');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Профиль</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Avatar 
            name={`${user.firstName} ${user.lastName}`}
            avatarUrl={user.avatar}
            size="xl"
          />
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          {user.city && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#64748b" />
              <Text style={styles.userCity}>{user.city}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {user.bio && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>О себе</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Интересы</Text>
            <View style={styles.interestTags}>
              {user.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestTagText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Telegram Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Telegram</Text>
          <View style={styles.telegramCard}>
            <View style={styles.telegramIcon}>
              <Ionicons name="paper-plane" size={24} color="#0088cc" />
            </View>
            <View style={styles.telegramInfo}>
              {user.telegram_registered ? (
                <>
                  <Text style={styles.telegramStatus}>Подключен</Text>
                  {user.telegram_info?.username && (
                    <Text style={styles.telegramUsername}>
                      @{user.telegram_info.username}
                    </Text>
                  )}
                </>
              ) : (
                <Text style={styles.telegramStatus}>Не подключен</Text>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.telegramButton,
                user.telegram_registered && styles.telegramButtonDanger,
              ]}
              onPress={user.telegram_registered ? handleUnbindTelegram : handleBindTelegram}
            >
              <Text
                style={[
                  styles.telegramButtonText,
                  user.telegram_registered && styles.telegramButtonTextDanger,
                ]}
              >
                {user.telegram_registered ? 'Отвязать' : 'Привязать'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#64748b" />
            <Text style={styles.menuItemText}>Настройки</Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#64748b" />
            <Text style={styles.menuItemText}>Помощь</Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="document-text-outline" size={24} color="#64748b" />
            <Text style={styles.menuItemText}>О приложении</Text>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Выйти</Text>
        </TouchableOpacity>
      </ScrollView>
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  userCity: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  interestTagText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
  telegramCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  telegramIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  telegramInfo: {
    flex: 1,
    marginLeft: 12,
  },
  telegramStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  telegramUsername: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  telegramButton: {
    backgroundColor: '#0088cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  telegramButtonDanger: {
    backgroundColor: '#fee2e2',
  },
  telegramButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  telegramButtonTextDanger: {
    color: '#ef4444',
  },
  menuSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
});
