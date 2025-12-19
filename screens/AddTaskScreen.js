import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';
import axios from 'axios';

/* ============================
   CLOUDINARY CONFIG
   ============================ */

const CLOUDINARY_CLOUD_NAME = 'du1dwcrhb';
const CLOUDINARY_RAW_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'tasks_pdfs';

export default function AddTaskScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [selectedEmoji, setSelectedEmoji] = useState('📝');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // NEW: Quiz JSON input
    const [quizDataJson, setQuizDataJson] = useState('');

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

    /* ============================
       PICK PDF
       ============================ */

    const selectPDF = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
            });

            if (result.canceled) return;

            const file = result.assets[0];

            if (file.size > 10 * 1024 * 1024) {
                Alert.alert('File Too Large', 'Max PDF size is 10MB');
                return;
            }

            setPdfFile({
                uri: file.uri,
                name: file.name,
                size: file.size,
                type: file.mimeType || 'application/pdf',
            });
        } catch (error) {
            console.error('Document picker error:', error);
            Alert.alert('Error', 'Failed to pick document');
        }
    };

    const removePDF = () => {
        setPdfFile(null);
        setUploadProgress(0);
    };

    /* ============================
       UPLOAD PDF TO CLOUDINARY
       ============================ */

    const uploadPDF = async () => {
        if (!pdfFile) return null;

        try {
            setUploading(true);
            setUploadProgress(0);

            const cleanName = pdfFile.name
                .replace('.pdf', '')
                .replace(/[^a-zA-Z0-9_-]/g, '_');
            const publicId = `${Date.now()}_${cleanName}`;

            const formData = new FormData();
            formData.append('file', {
                uri:
                    Platform.OS === 'ios'
                        ? pdfFile.uri.replace('file://', '')
                        : pdfFile.uri,
                type: 'application/pdf',
                name: pdfFile.name,
            });
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'tasks');
            formData.append('public_id', publicId);
            formData.append('resource_type', 'raw');

            const response = await axios.post(CLOUDINARY_RAW_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Accept: 'application/json',
                },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percent);
                },
            });

            if (!response.data?.secure_url) {
                throw new Error('No secure_url returned from Cloudinary');
            }

            console.log('Upload successful:', response.data.secure_url);
            return response.data.secure_url;
        } catch (error) {
            console.error('Upload error:', error.response?.data || error.message);
            Alert.alert('Upload Failed', 'Could not upload PDF. Please try again.');
            return null;
        } finally {
            setUploading(false);
        }
    };

    /* ============================
       SAVE TASK WITH QUIZ JSON
       ============================ */

    const handleSaveTask = async () => {
        if (!title.trim()) {
            Alert.alert('Required', 'Task title is required');
            return;
        }

        try {
            setSaving(true);

            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'You must be logged in');
                return;
            }

            let pdfUrl = '';
            let pdfName = '';

            if (pdfFile) {
                pdfUrl = await uploadPDF();
                if (!pdfUrl) {
                    setSaving(false);
                    return;
                }
                pdfName = pdfFile.name;
            }

            // Validate quiz JSON if provided
            let validQuizJson = '';
            if (quizDataJson.trim()) {
                try {
                    JSON.parse(quizDataJson); // validate
                    validQuizJson = quizDataJson.trim();
                } catch (e) {
                    Alert.alert(
                        'Invalid JSON',
                        'Quiz JSON is not valid. Please check the format.'
                    );
                    setSaving(false);
                    return;
                }
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
                hasAttachment: !!pdfFile,
                pdfUrl,
                pdfName,
                attachmentType: pdfFile ? 'pdf' : 'none',
                quizDataJson: validQuizJson, // NEW: save quiz data
            });

            Alert.alert('Success', 'Task created successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch (error) {
            console.error('Save task error:', error);
            Alert.alert('Error', 'Failed to save task. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const getPriorityColor = (p) => {
        if (p === 'high') return 'bg-red-500';
        if (p === 'medium') return 'bg-yellow-500';
        if (p === 'low') return 'bg-green-500';
        return 'bg-gray-500';
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <KeyboardAvoidingView
            style={tw`flex-1 bg-gradient-to-br from-purple-50 to-blue-50`}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Decorative Pattern Background */}
            <View style={tw`absolute inset-0 opacity-5`}>
                <View style={tw`absolute top-10 right-10 w-32 h-32 bg-purple-500 rounded-full`} />
                <View style={tw`absolute bottom-20 left-5 w-40 h-40 bg-blue-500 rounded-full`} />
            </View>

            {/* Header */}
            <Animated.View
                style={[
                    tw`pt-12 px-6 pb-4 bg-white/80 backdrop-blur-lg shadow-sm flex-row items-center`,
                    { opacity: fadeAnim },
                ]}
            >
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={tw`bg-white/20 p-2 rounded-full`}
                >
                    <Ionicons name="arrow-back" size={24} color="#6366F1" />
                </TouchableOpacity>
                <CustomText style={tw`text-2xl font-bold text-gray-800 ml-4`}>
                    New Task
                </CustomText>
            </Animated.View>

            {/* Scrollable Content */}
            <Animated.View
                style={[
                    tw`flex-1`,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={tw`px-6 py-6`}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Emoji Selection */}
                    <View style={tw`mb-6`}>
                        <CustomText style={tw`text-gray-700 font-semibold mb-3`}>
                            Choose Icon
                        </CustomText>
                        <View style={tw`flex-row flex-wrap gap-2`}>
                            {emojis.map((emoji) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => setSelectedEmoji(emoji)}
                                    style={tw`w-14 h-14 items-center justify-center rounded-2xl ${selectedEmoji === emoji
                                            ? 'bg-indigo-100 border-2 border-indigo-600'
                                            : 'bg-gray-100'
                                        }`}
                                >
                                    <CustomText style={tw`text-2xl`}>{emoji}</CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Title Input */}
                    <View style={tw`mb-6`}>
                        <CustomText style={tw`text-gray-700 font-semibold mb-2`}>
                            Task Title *
                        </CustomText>
                        <TextInput
                            style={tw`bg-white rounded-2xl px-4 py-3 text-gray-800 shadow-sm`}
                            placeholder="Enter task title"
                            placeholderTextColor="#9CA3AF"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={100}
                        />
                    </View>

                    {/* Description Input */}
                    <View style={tw`mb-6`}>
                        <CustomText style={tw`text-gray-700 font-semibold mb-2`}>
                            Description
                        </CustomText>
                        <TextInput
                            style={tw`bg-white rounded-2xl px-4 py-3 text-gray-800 shadow-sm`}
                            placeholder="Add details"
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            maxLength={500}
                        />
                    </View>

                    {/* Quiz JSON Input (NEW) */}
                    <View style={tw`mb-6`}>
                        <CustomText style={tw`text-gray-700 font-semibold mb-2`}>
                            Quiz Data (JSON) — Optional
                        </CustomText>
                        <TextInput
                            style={tw`bg-white rounded-2xl px-4 py-3 text-gray-800 shadow-sm`}
                            placeholder='Paste quiz_data JSON here, e.g. [{"Question Number": 1, ...}]'
                            placeholderTextColor="#9CA3AF"
                            value={quizDataJson}
                            onChangeText={setQuizDataJson}
                            multiline
                            numberOfLines={6}
                            textAlignVertical="top"
                        />
                        <CustomText style={tw`text-gray-500 text-xs mt-1`}>
                            Paste the full quiz JSON array from your reviewer document.
                        </CustomText>
                    </View>

                    {/* PDF Upload Section */}
                    <View style={tw`mb-6`}>
                        <CustomText style={tw`text-gray-700 font-semibold mb-2`}>
                            Attachment (PDF)
                        </CustomText>

                        {!pdfFile ? (
                            <TouchableOpacity
                                onPress={selectPDF}
                                style={tw`bg-white rounded-2xl p-4 border-2 border-dashed border-gray-300 items-center`}
                            >
                                <Ionicons name="cloud-upload-outline" size={32} color="#6366F1" />
                                <CustomText style={tw`text-indigo-600 font-semibold mt-2`}>
                                    Tap to upload PDF
                                </CustomText>
                                <CustomText style={tw`text-gray-500 text-xs`}>
                                    Max file size: 10MB
                                </CustomText>
                            </TouchableOpacity>
                        ) : (
                            <View style={tw`bg-white rounded-2xl p-4 border border-indigo-200`}>
                                <View style={tw`flex-row items-center justify-between`}>
                                    <View style={tw`flex-row items-center flex-1`}>
                                        <Ionicons name="document-text" size={32} color="#6366F1" />
                                        <View style={tw`ml-3 flex-1`}>
                                            <CustomText
                                                style={tw`text-gray-800 font-semibold`}
                                                numberOfLines={1}
                                            >
                                                {pdfFile.name}
                                            </CustomText>
                                            <CustomText style={tw`text-gray-500 text-xs`}>
                                                {formatFileSize(pdfFile.size)}
                                            </CustomText>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        onPress={removePDF}
                                        disabled={uploading}
                                        style={tw`p-2`}
                                    >
                                        <Ionicons name="close-circle" size={24} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>

                                {uploading && (
                                    <View style={tw`mt-3`}>
                                        <View style={tw`flex-row items-center justify-between mb-1`}>
                                            <CustomText style={tw`text-indigo-600 text-sm`}>
                                                Uploading...
                                            </CustomText>
                                            <CustomText style={tw`text-indigo-600 text-sm`}>
                                                {uploadProgress}%
                                            </CustomText>
                                        </View>
                                        <View style={tw`bg-gray-200 rounded-full h-2 overflow-hidden`}>
                                            <View
                                                style={[
                                                    tw`bg-indigo-600 h-full`,
                                                    { width: `${uploadProgress}%` },
                                                ]}
                                            />
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>

                    {/* Due Date Input */}
                    <View style={tw`mb-6`}>
                        <CustomText style={tw`text-gray-700 font-semibold mb-2`}>
                            Due Date
                        </CustomText>
                        <TextInput
                            style={tw`bg-white rounded-2xl px-4 py-3 text-gray-800 shadow-sm`}
                            placeholder="e.g., Dec 25, 2025"
                            placeholderTextColor="#9CA3AF"
                            value={dueDate}
                            onChangeText={setDueDate}
                            onFocus={() => {
                                setTimeout(() => {
                                    scrollViewRef.current?.scrollToEnd({ animated: true });
                                }, 100);
                            }}
                        />
                    </View>

                    {/* Priority Selection */}
                    <View style={tw`mb-6`}>
                        <CustomText style={tw`text-gray-700 font-semibold mb-3`}>
                            Priority Level
                        </CustomText>
                        <View style={tw`flex-row gap-3`}>
                            {priorities.map((p) => (
                                <TouchableOpacity
                                    key={p}
                                    onPress={() => setPriority(p)}
                                    disabled={saving || uploading}
                                    style={tw`flex-1 py-3 rounded-2xl ${priority === p ? getPriorityColor(p) : 'bg-gray-100'
                                        } ${saving || uploading ? 'opacity-50' : ''}`}
                                >
                                    <CustomText
                                        style={tw`text-center font-semibold ${priority === p ? 'text-white' : 'text-gray-700'
                                            }`}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </CustomText>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        onPress={handleSaveTask}
                        disabled={saving || uploading}
                        style={tw`bg-indigo-600 py-4 rounded-2xl items-center shadow-lg ${saving || uploading ? 'opacity-50' : ''
                            }`}
                    >
                        {saving || uploading ? (
                            <View style={tw`flex-row items-center`}>
                                <ActivityIndicator size="small" color="#fff" />
                                <CustomText style={tw`text-white font-bold ml-2`}>
                                    {uploading ? 'Uploading...' : 'Creating...'}
                                </CustomText>
                            </View>
                        ) : (
                            <CustomText style={tw`text-white font-bold text-lg`}>
                                Create Task
                            </CustomText>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}
