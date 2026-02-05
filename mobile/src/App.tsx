/**
 * Project Prism - Main App Entry Point
 * 
 * MERGED & IMPROVED: Clean app structure with:
 * - Panic mode wrapper
 * - Navigation flow
 * - Error boundaries
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import { MapScreen } from './screens/Map/MapScreen';
import { TribesScreen } from './screens/Tribes/TribesScreen';
import { SettingsScreen } from './screens/Settings/SettingsScreen';
import { ChatScreen } from './screens/Chat/ChatScreen';

// Services
import { panicService } from './utils/PanicService';
import { storageService } from './utils/StorageService';
import { signalProtocol } from './crypto/SignalProtocol';

// Theme
import { COLORS } from './theme/constants';

// =============================================================================
// NAVIGATION SETUP
// =============================================================================

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Custom Tab Bar
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => {
  const icons: Record<string, string> = {
    map: '🗺️',
    tribes: '🏕️',
    aid: '🤝',
    settings: '⚙️',
  };
  
  return (
    <View style={styles.tabIcon}>
      <Text style={{ fontSize: 24, opacity: focused ? 1 : 0.5 }}>{icons[name]}</Text>
      {focused && <View style={styles.tabIndicator} />}
    </View>
  );
};

// Main Tab Navigator
const MainTabs: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarShowLabel: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
    })}
  >
    <Tab.Screen name="map" component={MapScreen} />
    <Tab.Screen name="tribes" component={TribesScreen} />
    <Tab.Screen name="aid" component={MutualAidPlaceholder} />
    <Tab.Screen name="settings" component={SettingsWrapper} />
  </Tab.Navigator>
);

// Placeholder for Mutual Aid (reuse from other codebase)
const MutualAidPlaceholder: React.FC = () => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderIcon}>🤝</Text>
    <Text style={styles.placeholderTitle}>Mutual Aid</Text>
    <Text style={styles.placeholderText}>Community gifting network coming soon</Text>
  </View>
);

// Settings wrapper to handle navigation
const SettingsWrapper: React.FC = () => {
  const handleNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
  };
  
  return <SettingsScreen onNavigate={handleNavigate} />;
};

// =============================================================================
// DECOY CALCULATOR
// =============================================================================

const DecoyCalculator: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [display, setDisplay] = useState('0');
  
  const handlePress = (value: string) => {
    if (value === 'C') {
      setDisplay('0');
    } else if (value === '=') {
      // Secret exit: type "1969" and press =
      if (display === '1969') {
        onExit();
      }
    } else if (display === '0') {
      setDisplay(value);
    } else {
      setDisplay(display + value);
    }
  };

  const buttons = [
    ['C', '±', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '='],
  ];

  return (
    <View style={styles.calculator}>
      <View style={styles.calcDisplay}>
        <Text style={styles.calcDisplayText}>{display}</Text>
      </View>
      <View style={styles.calcButtons}>
        {buttons.map((row, i) => (
          <View key={i} style={styles.calcRow}>
            {row.map((btn) => (
              <View
                key={btn}
                style={[
                  styles.calcButton,
                  ['÷', '×', '-', '+', '='].includes(btn) && styles.calcButtonOp,
                  btn === '0' && styles.calcButtonZero,
                ]}
              >
                <Text
                  style={styles.calcButtonText}
                  onPress={() => handlePress(btn)}
                >
                  {btn}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

// =============================================================================
// MAIN APP
// =============================================================================

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showDecoy, setShowDecoy] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize services
      await signalProtocol.initialize();
      await panicService.initialize();

      // Set up panic listener
      panicService.addListener((event) => {
        if (event.action === 'decoy' || event.action === 'hide') {
          setShowDecoy(true);
        }
      });

      // Check if user has account
      const hasAccount = await signalProtocol.hasAccount();
      setIsAuthenticated(hasAccount);

    } catch (error) {
      console.error('[App] Initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExitDecoy = () => {
    setShowDecoy(false);
  };

  // Show loading
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <Text style={styles.loadingIcon}>🏳️‍🌈</Text>
        <Text style={styles.loadingText}>Prism</Text>
      </View>
    );
  }

  // Show decoy calculator in panic mode
  if (showDecoy) {
    return (
      <>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <DecoyCalculator onExit={handleExitDecoy} />
      </>
    );
  }

  // Main app
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="Chat" component={ChatScreen as any} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  loadingText: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    height: 80,
    paddingBottom: 20,
  },
  tabIcon: {
    alignItems: 'center',
  },
  tabIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 4,
  },
  placeholder: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  placeholderTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  placeholderText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  calculator: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'flex-end',
  },
  calcDisplay: {
    padding: 20,
    alignItems: 'flex-end',
  },
  calcDisplayText: {
    color: '#fff',
    fontSize: 70,
    fontWeight: '200',
  },
  calcButtons: {
    padding: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calcButton: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calcButtonOp: {
    backgroundColor: '#FF9500',
  },
  calcButtonZero: {
    width: 160,
  },
  calcButtonText: {
    color: '#fff',
    fontSize: 30,
  },
});

export default App;
