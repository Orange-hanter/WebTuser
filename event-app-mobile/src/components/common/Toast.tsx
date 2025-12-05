import React, { FC, useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '@/contexts';

const TOAST_COLORS = {
  success: { bg: '#10b981', icon: 'checkmark-circle' as const },
  error: { bg: '#ef4444', icon: 'close-circle' as const },
  info: { bg: '#3b82f6', icon: 'information-circle' as const },
  warning: { bg: '#f59e0b', icon: 'warning' as const },
};

export const ToastContainer: FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <View style={styles.container}>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onRemove={removeToast}
        />
      ))}
    </View>
  );
};

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  onRemove: (id: string) => void;
}

const ToastItem: FC<ToastItemProps> = ({ id, type, message, onRemove }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRemove = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -20,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onRemove(id));
  };

  const config = TOAST_COLORS[type];

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: config.bg, opacity: fadeAnim, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={config.icon} size={24} color="white" />
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity onPress={handleRemove} style={styles.closeButton}>
        <Ionicons name="close" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  toastText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
});
