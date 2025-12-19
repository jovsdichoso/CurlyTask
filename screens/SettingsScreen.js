import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, ScrollView, Animated, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';

export default function SettingsScreen({ navigation }) {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [soundEffects, setSoundEffects] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            navigation.replace('Splash');
                        } catch (error) {
                            console.error('Sign out error:', error);
                            Alert.alert('Error', 'Failed to sign out');
                        }
                    }
                }
            ]
        );
    };

    const SettingItem = ({ icon, title, subtitle, onPress, rightElement }) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            style={tw`bg-white rounded-3xl p-4 mb-4 shadow-sm flex-row items-center`}
        >
            <View style={tw`w-12 h-12 rounded-2xl bg-teal-100 items-center justify-center mr-4`}>
                <Ionicons name={icon} size={24} color="#14B8A6" />
            </View>
            <View style={tw`flex-1`}>
                <CustomText style={tw`text-base font-semibold text-gray-800`}>{title}</CustomText>
                {subtitle && <CustomText style={tw`text-sm text-gray-500 mt-1`}>{subtitle}</CustomText>}
            </View>
            {rightElement}
        </TouchableOpacity>
    );

    return (
        <View style={tw`flex-1 bg-gray-50`}>
            {/* Decorative Pattern Background */}
            <View style={tw`absolute top-0 left-0 right-0 h-64 bg-teal-600 rounded-b-[50px] overflow-hidden`}>
                <View style={tw`absolute -top-20 -left-20 w-60 h-60 bg-teal-500 rounded-full opacity-20`} />
                <View style={tw`absolute top-40 -right-10 w-40 h-40 bg-teal-400 rounded-full opacity-20`} />
                <View style={tw`absolute top-10 right-20 w-20 h-20 bg-white rounded-full opacity-10`} />
            </View>

            {/* Header */}
            <Animated.View
                style={[
                    tw`px-6 pt-14 pb-6`,
                    { opacity: fadeAnim }
                ]}
            >
                <CustomText style={tw`text-white text-3xl font-bold`}>Settings</CustomText>
                <CustomText style={tw`text-white/80 text-base mt-1`}>Customize your experience</CustomText>
            </Animated.View>

            <ScrollView
                style={tw`flex-1 px-6`}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        tw`mt-4`,
                        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                    ]}
                >
                    {/* Preferences Section */}
                    <CustomText style={tw`text-gray-600 text-sm font-semibold mb-3 ml-2`}>PREFERENCES</CustomText>

                    <SettingItem
                        icon="notifications"
                        title="Notifications"
                        subtitle="Get reminders for your tasks"
                        rightElement={
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#D1D5DB', true: '#14B8A6' }}
                                thumbColor="white"
                            />
                        }
                    />

                    <SettingItem
                        icon="moon"
                        title="Dark Mode"
                        subtitle="Switch to dark theme"
                        rightElement={
                            <Switch
                                value={darkMode}
                                onValueChange={setDarkMode}
                                trackColor={{ false: '#D1D5DB', true: '#14B8A6' }}
                                thumbColor="white"
                            />
                        }
                    />

                    <SettingItem
                        icon="volume-high"
                        title="Sound Effects"
                        subtitle="Enable completion sounds"
                        rightElement={
                            <Switch
                                value={soundEffects}
                                onValueChange={setSoundEffects}
                                trackColor={{ false: '#D1D5DB', true: '#14B8A6' }}
                                thumbColor="white"
                            />
                        }
                    />

                    {/* Account Section */}
                    <CustomText style={tw`text-gray-600 text-sm font-semibold mb-3 ml-2 mt-6`}>ACCOUNT</CustomText>

                    <SettingItem
                        icon="person"
                        title="Edit Profile"
                        subtitle="Update your information"
                        onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
                        rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                    />

                    <SettingItem
                        icon="lock-closed"
                        title="Privacy & Security"
                        subtitle="Manage your privacy settings"
                        onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon!')}
                        rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                    />

                    {/* Support Section */}
                    <CustomText style={tw`text-gray-600 text-sm font-semibold mb-3 ml-2 mt-6`}>SUPPORT</CustomText>

                    <SettingItem
                        icon="help-circle"
                        title="Help & FAQ"
                        subtitle="Get answers to common questions"
                        onPress={() => Alert.alert('Help', 'Help center coming soon!')}
                        rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                    />

                    <SettingItem
                        icon="information-circle"
                        title="About"
                        subtitle="Version 1.0.0"
                        onPress={() => Alert.alert('About', 'CurlyTask v1.0.0\nOrganize beautifully')}
                        rightElement={<Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
                    />

                    {/* Sign Out Button */}
                    <TouchableOpacity
                        onPress={handleSignOut}
                        style={tw`bg-red-500 rounded-3xl p-4 mt-6 mb-8 flex-row items-center justify-center shadow-lg`}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={24} color="white" />
                        <CustomText style={tw`text-white text-lg font-bold ml-2`}>Sign Out</CustomText>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
}
