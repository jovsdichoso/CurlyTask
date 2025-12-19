import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import CustomText from './components/CustomText';
import SplashScreenComponent from './screens/SplashScreen';
import AuthChoiceScreen from './screens/AuthChoiceScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScren';
import AddTaskScreen from './screens/AddTaskScreen';
import TasksListScreen from './screens/TasksListScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const { width } = Dimensions.get('window');

// Layout constants
const tabCount = 4;
const iconWidth = 45;
const iconHeight = 40;
const tabBarWidth = width * 0.75; // 75% of screen width
const tabSpacing = tabBarWidth / tabCount;
const maxSafeScale = Math.min((tabSpacing / iconWidth) * 0.8, 1.3);

// Animated Tab Icon
const AnimatedTabIcon = ({ focused, iconName, iconSize = 20 }) => {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: focused ? Math.min(1.2, maxSafeScale) : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 6,
    }).start();

    Animated.timing(opacityValue, {
      toValue: focused ? 1 : 0.6,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View
      style={{
        width: iconWidth,
        height: iconHeight,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View
        style={{ opacity: opacityValue, transform: [{ scale: scaleValue }] }}
      >
        <Ionicons
          name={iconName}
          size={iconSize}
          color={focused ? '#10B981' : '#9CA3AF'}
        />
      </Animated.View>
    </View>
  );
};

// Animated Background Indicator
const AnimatedBackground = ({ state }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const targetPosition =
      state.index * tabSpacing + tabSpacing / 2 - iconWidth / 2;

    const backgroundMaxScale = Math.min(
      (tabSpacing / iconWidth) * 0.9,
      1.15
    );

    Animated.parallel([
      Animated.spring(translateX, {
        toValue: targetPosition,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }),
      Animated.sequence([
        Animated.timing(scaleX, {
          toValue: backgroundMaxScale,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleX, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [state.index]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 7,
        left: 0,
        width: iconWidth,
        height: iconHeight,
        borderRadius: 22,
        backgroundColor: '#D1FAE5',
        transform: [{ translateX }, { scaleX }],
        shadowColor: '#10B981',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
      }}
    />
  );
};

// Custom Tab Bar with Animation
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View
      style={{
        position: 'absolute',
        bottom: 25,
        width: tabBarWidth,
        alignSelf: 'center',
        backgroundColor: 'transparent',
      }}
    >
      <View
        style={{
          height: 54,
          backgroundColor: '#FFFFFF',
          borderRadius: 40,
          overflow: 'hidden',
          shadowColor: '#10B981',
          shadowOpacity: 0.15,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 12,
          elevation: 8,
          position: 'relative',
        }}
      >
        <AnimatedBackground state={state} />

        <View
          style={{
            flexDirection: 'row',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'space-around',
          }}
        >
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const onPress = () => {
              if (!isFocused) navigation.navigate(route.name);
            };

            const icons = {
              Home: 'home',
              Tasks: 'checkbox',
              AddTask: 'add-circle',
              Settings: 'settings',
            };

            return (
              <View
                key={route.key}
                style={{
                  width: iconWidth,
                  height: iconHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onTouchStart={onPress}
              >
                <AnimatedTabIcon
                  focused={isFocused}
                  iconName={isFocused ? icons[route.name] : `${icons[route.name]}-outline`}
                  iconSize={20}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Main App Tabs
function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksListScreen} />
      <Tab.Screen name="AddTask" component={AddTaskScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Poppins-Regular': require('./assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('./assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('./assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('./assets/fonts/Poppins-Bold.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.warn('Error loading fonts:', error);
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (!fontsLoaded || initializing) {
    return null;
  }

  const isAuthenticated = user && user.emailVerified;

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainTabs />
      ) : (
        <>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreenComponent} />
            <Stack.Screen name="AuthChoice" component={AuthChoiceScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </Stack.Navigator>
        </>
      )}
    </NavigationContainer>
  );
}