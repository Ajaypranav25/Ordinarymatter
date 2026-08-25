/**
 * OrdinaryMatter — App Entry Point
 *
 * Wraps the app in the StoreProvider and renders the navigator.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StoreProvider } from './src/store';
import { AppNavigator } from './src/navigation';
import { notificationService } from './src/services/notifications';

export default function App() {
  useEffect(() => {
    // Initialize notifications on app start
    notificationService.init();
  }, []);

  return (
    <StoreProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </StoreProvider>
  );
}
