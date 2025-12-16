import React, { FC, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EventApi from '@/services/eventApi';
import { useToast } from '@/contexts';
import type { CreateEventData, MainTabParamList } from '@/types';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

type Props = BottomTabScreenProps<MainTabParamList, 'CreateEvent'>;

const EVENT_TYPES = ['Спорт', 'Музыка', 'Искусство', 'Образование', 'Технологии', 'Другое'];

export const CreateEventScreen: FC<Props> = ({ navigation }) => {
  const { success, error: showError } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateEventData>>({
    type: '',
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    priceType: 'free',
    needReg: false,
    dynamicFields: {},
  });

  const updateField = (field: keyof CreateEventData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.type || !formData.date || !formData.location) {
      showError('Заполните все обязательные поля');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await EventApi.createEvent(formData as CreateEventData);
      if (response.success) {
        success('Событие создано!');
        navigation.navigate('Events');
      } else {
        showError(response.error || 'Ошибка создания события');
      }
    } catch (err) {
      showError('Ошибка создания события');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Создать событие</Text>
            <Text style={styles.subtitle}>Заполните информацию о вашем событии</Text>
          </View>

          {/* Type Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Тип события *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeContainer}
            >
              {EVENT_TYPES.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => updateField('type', type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Название *</Text>
            <TextInput
              style={styles.input}
              placeholder="Введите название события"
              placeholderTextColor="#94a3b8"
              value={formData.title}
              onChangeText={(value) => updateField('title', value)}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Описание</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Расскажите о событии подробнее"
              placeholderTextColor="#94a3b8"
              value={formData.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Date & Time */}
          <View style={styles.row}>
            <View style={[styles.section, styles.flex]}>
              <Text style={styles.label}>Дата *</Text>
              <TextInput
                style={styles.input}
                placeholder="ДД.ММ.ГГГГ"
                placeholderTextColor="#94a3b8"
                value={formData.date}
                onChangeText={(value) => updateField('date', value)}
              />
            </View>
            <View style={[styles.section, styles.flex]}>
              <Text style={styles.label}>Время</Text>
              <TextInput
                style={styles.input}
                placeholder="ЧЧ:ММ"
                placeholderTextColor="#94a3b8"
                value={formData.time}
                onChangeText={(value) => updateField('time', value)}
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Место *</Text>
            <View style={styles.inputWithIcon}>
              <Ionicons name="location-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.inputInner}
                placeholder="Введите адрес или место"
                placeholderTextColor="#94a3b8"
                value={formData.location}
                onChangeText={(value) => updateField('location', value)}
              />
            </View>
          </View>

          {/* Price Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Стоимость</Text>
            <View style={styles.priceTypeContainer}>
              {[
                { key: 'free', label: 'Бесплатно', icon: 'gift-outline' },
                { key: 'paid', label: 'Платно', icon: 'card-outline' },
                { key: 'donation', label: 'Донат', icon: 'heart-outline' },
              ].map(({ key, label, icon }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.priceTypeButton,
                    formData.priceType === key && styles.priceTypeButtonActive,
                  ]}
                  onPress={() => updateField('priceType', key)}
                >
                  <Ionicons
                    name={icon as any}
                    size={20}
                    color={formData.priceType === key ? '#6366f1' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.priceTypeText,
                      formData.priceType === key && styles.priceTypeTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color="white" />
                <Text style={styles.submitButtonText}>Создать событие</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
  },
  inputInner: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#1e293b',
  },
  typeContainer: {
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  priceTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priceTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
  },
  priceTypeButtonActive: {
    borderColor: '#6366f1',
    backgroundColor: '#eef2ff',
  },
  priceTypeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  priceTypeTextActive: {
    color: '#6366f1',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
