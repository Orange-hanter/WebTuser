import React, { FC } from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  name?: string;
  avatarUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
}

const SIZE_MAP = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

const FONT_SIZE_MAP = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
};

export const Avatar: FC<AvatarProps> = ({ name, avatarUrl, size = 'md', onPress }) => {
  const dimension = SIZE_MAP[size];
  const fontSize = FONT_SIZE_MAP[size];
  
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const content = avatarUrl ? (
    <Image
      source={{ uri: avatarUrl }}
      style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
    />
  ) : name ? (
    <View
      style={[
        styles.placeholder,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
    </View>
  ) : (
    <View
      style={[
        styles.placeholder,
        { width: dimension, height: dimension, borderRadius: dimension / 2 },
      ]}
    >
      <Ionicons name="person" size={dimension * 0.5} color="#94a3b8" />
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#e2e8f0',
  },
  placeholder: {
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#64748b',
    fontWeight: '600',
  },
});
