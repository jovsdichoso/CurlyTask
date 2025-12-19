import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, ScrollView, Animated, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';

export default function AddTaskScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [selectedEmoji, setSelectedEmoji] = useState('📝');
    const [saving, setSaving] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const scrollViewRef = useRef(null);

    const emojis = ['📝', '💼', '🎯', '💪', '📚', '🏃', '🎨', '🍳', '🛒', '🎮', '✈️', '💡'];
    const priorities = ['low', 'medium', 'high'];

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

    const handleSaveTask = async () => {
        if (!title.trim()) {
            Alert.alert('Required Field', 'Please enter a task title');
            return;
        }

        try {
            setSaving(true);
            const user = auth.currentUser;

            if (!user) {
                Alert.alert('Error', 'You must be logged in to create tasks');
                return;
            }

            await addDoc(collection(db, 'tasks'), {
                userId: user.uid,
                title: title.trim(),
                description: description.trim(),
                dueDate: dueDate.trim() || 'No due date',
                priority,
                emoji: selectedEmoji,
                completed: false,
                createdAt: serverTimestamp(),
                completedAt: null
            });

            Alert.alert('Success', 'Task created successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            console.error('Error saving task:', error);
            Alert.alert('Error', 'Failed to save task. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <View style={tw`flex-1 bg-white`}>
            {/* Decorative Pattern Background - Fixed Position */}
            <View style={tw`absolute top-0 left-0 right-0 h-60 bg-indigo-600 rounded-b-[50px] overflow-hidden z-0`}>
                <View style={tw`absolute -top-20 -left-20 w-60 h-60 bg-indigo-500 rounded-full opacity-20`} />
                <View style={tw`absolute top-40 -right-10 w-40 h-40 bg-indigo-400 rounded-full opacity-20`} />
                <View style={tw`absolute top-10 right-20 w-20 h-20 bg-white rounded-full opacity-10`} />
            </View>

            {/* Header - Fixed Position */}
            <Animated.View
                style={[
                    tw`flex-row items-center justify-between px-6 pt-14 pb-6 z-10`,
                    { opacity: fadeAnim }
                ]}
            >
                <TouchableOpacity onPress={() => navigation.goBack()} style={tw`bg-white/20 p-2 rounded-full`}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <CustomText style={tw`text-white text-2xl font-bold`}>New Task</CustomText>
                <View style={tw`w-10`} />
            </Animated.View>

            {/* Scrollable Content with KeyboardAvoidingView */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'android' ? 'padding' : undefined}
                style={tw`flex-1`}
                keyboardVerticalOffset={Platform.OS === 'android' ? 10 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={tw`flex-1 px-6`}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={tw`pb-10`}
                    bounces={false}
                >
                    <Animated.View
                        style={[
                            tw`mt-6`,
                            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        {/* Emoji Selection */}
                        <CustomText style={tw`text-gray-700 text-base font-semibold mb-3`}>Choose Icon</CustomText>
                        <View style={tw`flex-row flex-wrap gap-3 mb-6`}>
                            {emojis.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => setSelectedEmoji(emoji)}
                                    style={tw`w-14 h-14 items-center justify-center rounded-2xl ${selectedEmoji === emoji ? 'bg-indigo-100 border-2 border-indigo-600' : 'bg-gray-100'
                                        }`}
                                >
                                    <CustomText style={tw`text-2xl`}>{emoji}</CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Title Input */}
                        <CustomText style={tw`text-gray-700 text-base font-semibold mb-3`}>Task Title *</CustomText>
                        <TextInput
                            style={tw`bg-gray-50 rounded-2xl px-5 py-4 text-base mb-6 border border-gray-200`}
                            placeholder="e.g., Complete project report"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                            editable={!saving}
                            returnKeyType="next"
                        />

                        {/* Description Input */}
                        <CustomText style={tw`text-gray-700 text-base font-semibold mb-3`}>Description</CustomText>
                        <TextInput
                            style={tw`bg-gray-50 rounded-2xl px-5 py-4 text-base mb-6 border border-gray-200`}
                            placeholder="Add details..."
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            editable={!saving}
                        />

                        {/* Due Date Input */}
                        <CustomText style={tw`text-gray-700 text-base font-semibold mb-3`}>Due Date</CustomText>
                        <TextInput
                            style={tw`bg-gray-50 rounded-2xl px-5 py-4 text-base mb-6 border border-gray-200`}
                            placeholder="e.g., Today, Tomorrow, Dec 25"
                            placeholderTextColor="#9CA3AF"
                            value={dueDate}
                            onChangeText={setDueDate}
                            editable={!saving}
                            returnKeyType="done"
                            onFocus={() => {
                                // Auto-scroll to bottom when this field is focused
                                setTimeout(() => {
                                    scrollViewRef.current?.scrollToEnd({ animated: true });
                                }, 100);
                            }}
                        />

                        {/* Priority Selection */}
                        <CustomText style={tw`text-gray-700 text-base font-semibold mb-3`}>Priority Level</CustomText>
                        <View style={tw`flex-row gap-3 mb-8`}>
                            {priorities.map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setPriority(p)}
                                    disabled={saving}
                                    style={tw`flex-1 py-3 rounded-2xl ${priority === p ? getPriorityColor(p) : 'bg-gray-100'
                                        }`}
                                >
                                    <CustomText style={tw`text-center font-semibold ${priority === p ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            onPress={handleSaveTask}
                            disabled={saving}
                            style={tw`bg-indigo-600 rounded-2xl py-4 items-center mb-8 shadow-lg ${saving ? 'opacity-50' : ''}`}
                            activeOpacity={0.8}
                        >
                            <CustomText style={tw`text-white text-lg font-bold`}>
                                {saving ? 'Creating...' : 'Create Task'}
                            </CustomText>
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
