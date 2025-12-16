import React, { FC } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthContext } from '@/contexts';
import { LoadingSpinner } from '@/components/common';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { EventDetailsScreen } from '@/screens/main';
import type { RootStackParamList } from '@/types';
import * as Linking from 'expo-linking';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep linking configuration
const linking = {
  prefixes: [Linking.createURL('/'), 'https://your-domain.com', 'eventapp://'],
  config: {
    screens: {
      Main: {
        screens: {
          Events: 'events',
          CreateEvent: 'create',
          Profile: 'profile',
        },
      },
      EventDetails: 'e/:eventId',
      PublicEvent: 'event/:eventId',
    },
  },
};

export const RootNavigator: FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return <LoadingSpinner message="Загрузка..." />;
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="EventDetails"
              component={EventDetailsScreen}
              options={{
                presentation: 'card',
                animation: 'slide_from_right',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
