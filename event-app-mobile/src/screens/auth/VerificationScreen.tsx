import React, { FC, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthContext } from '@/contexts';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Verification'>;

const CODE_LENGTH = 6;

export const VerificationScreen: FC<Props> = ({ route, navigation }) => {
  const { email } = route.params;
  const { verify, resendCode, error } = useAuthContext();
  const [code, setCode] = useState<string[]>(new Array(CODE_LENGTH).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when code is complete
    if (newCode.every(digit => digit) && newCode.join('').length === CODE_LENGTH) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const codeToVerify = fullCode || code.join('');
    
    if (codeToVerify.length !== CODE_LENGTH) {
      setLocalError('Введите полный код');
      return;
    }

    setLocalError('');
    setIsSubmitting(true);

    try {
      await verify(codeToVerify, 'email');
      navigation.navigate('ProfileStep1');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка верификации');
      setCode(new Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendCode(email);
      setResendCooldown(60);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Ошибка отправки кода');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={48} color="#6366f1" />
          </View>
          <Text style={styles.title}>Подтверждение</Text>
          <Text style={styles.subtitle}>
            Мы отправили код на{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => (inputRefs.current[index] = ref)}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
                localError && styles.codeInputError,
              ]}
              value={digit}
              onChangeText={text => handleCodeChange(text.slice(-1), index)}
              onKeyPress={e => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isSubmitting}
            />
          ))}
        </View>

        {/* Error Message */}
        {(localError || error) && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{localError || error}</Text>
          </View>
        )}

        {/* Verify Button */}
        <TouchableOpacity
          style={[styles.button, isSubmitting && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Подтвердить</Text>
          )}
        </TouchableOpacity>

        {/* Resend Code */}
        <TouchableOpacity
          style={styles.resendContainer}
          onPress={handleResendCode}
          disabled={resendCooldown > 0}
        >
          <Text style={styles.resendText}>
            {resendCooldown > 0
              ? `Отправить повторно через ${resendCooldown}с`
              : 'Отправить код повторно'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  email: {
    color: '#6366f1',
    fontWeight: '600',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1e293b',
  },
  codeInputFilled: {
    borderColor: '#6366f1',
  },
  codeInputError: {
    borderColor: '#ef4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  button: {
    backgroundColor: '#6366f1',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  resendText: {
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '500',
  },
});
