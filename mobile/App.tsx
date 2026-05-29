import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Image, ActivityIndicator } from 'react-native';
import Logo from './assets/logo.svg';

// Import screens
import {
  LoginScreen,
  RegisterScreen,
  DashboardScreen,
  TransactionsScreen,
  ManageScreen,
  ProfileScreen,
  CategoriesScreen,
  AccountsScreen
} from './src/screens';
import { AddTransactionModal } from './src/components/AddTransactionModal';
import { SyncStatusBanner } from './src/components/SyncStatusBanner';

import { AppContext, AppContextType, Screen, User } from './src/contexts/AppContext';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [initialType, setInitialType] = useState<'income' | 'expense'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const openAddModal = (type: 'income' | 'expense' = 'expense') => {
    setInitialType(type);
    setEditingTransaction(null);
    setAddModalVisible(true);
  };

  const openEditModal = (transaction: any) => {
    setEditingTransaction(transaction);
    setInitialType(transaction.type);
    setAddModalVisible(true);
  };

  // Internal wrapper to reset editingTransaction when closing
  const handleSetModalVisible = (visible: boolean) => {
    if (!visible) {
      setEditingTransaction(null);
    }
    setAddModalVisible(visible);
  };

  useEffect(() => {
    checkAuth();
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('isDarkMode');
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode));
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userData = await AsyncStorage.getItem('userData');

      if (token && userData) {
        setUser(JSON.parse(userData));
        setCurrentScreen('dashboard');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
    setUser(null);
    setCurrentScreen('login');
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const contextValue: AppContextType = {
    user,
    setUser,
    currentScreen,
    navigateTo,
    logout,
    refreshData,
    isAddModalVisible,
    setAddModalVisible: handleSetModalVisible,
    initialType,
    openAddModal,
    editingTransaction,
    openEditModal,
    isDarkMode,
    toggleDarkMode,
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#8B5CF6' }}>
        <Logo width={120} height={120} style={{ marginBottom: 24 }} />
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppContext.Provider value={contextValue}>
        <SafeAreaProvider>
          {currentScreen === 'login' && <LoginScreen />}
          {currentScreen === 'register' && <RegisterScreen />}
          {currentScreen === 'dashboard' && <DashboardScreen key={refreshTrigger} />}
          {currentScreen === 'transactions' && <TransactionsScreen key={refreshTrigger} />}
          {currentScreen === 'manage' && <ManageScreen />}
          {currentScreen === 'profile' && <ProfileScreen />}
          {currentScreen === 'categories' && <CategoriesScreen key={refreshTrigger} />}
          {currentScreen === 'accounts' && <AccountsScreen key={refreshTrigger} />}
          <AddTransactionModal />
          <SyncStatusBanner />
          <StatusBar style={isDarkMode ? "light" : "dark"} />
        </SafeAreaProvider>
      </AppContext.Provider>
    </GestureHandlerRootView>
  );
}
