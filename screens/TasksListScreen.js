import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    ScrollView,
    Animated,
    Alert,
    RefreshControl,
    Linking,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    collection,
    query,
    where,
    getDocs,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import ViewTaskModal from '../components/modals/ViewTaskModal';
import tw from 'twrnc';
import axios from 'axios';

/* ============================
   GEMINI CONFIG (optional)
   ============================ */

const GEMINI_API_KEY = 'YOUR_GEMINI_KEY_HERE';

const GEMINI_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3-flash',
];

let lastCallTime = 0;
const MIN_DELAY_MS = 15_000;

export default function TasksListScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const modalAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    /* ============================
       INIT
       ============================ */

    useEffect(() => {
        fetchTasks();

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();

        const unsubscribe = navigation.addListener('focus', () => {
            fetchTasks();
        });

        return unsubscribe;
    }, [navigation]);

    /* ============================
       FETCH TASKS
       ============================ */

    const fetchTasks = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                Alert.alert('Error', 'You must be logged in to view tasks');
                setLoading(false);
                return;
            }

            const tasksQuery = query(
                collection(db, 'tasks'),
                where('userId', '==', user.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(tasksQuery);
            const fetchedTasks = [];
            querySnapshot.forEach((docSnap) => {
                fetchedTasks.push({ id: docSnap.id, ...docSnap.data() });
            });

            setTasks(fetchedTasks);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            Alert.alert('Error', 'Failed to load tasks. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks();
    };

    /* ============================
       GEMINI STUDY NOTES (optional)
       ============================ */

    const generateStudyNotes = async (task, modelIndex = 0) => {
        const now = Date.now();
        if (now - lastCallTime < MIN_DELAY_MS && modelIndex === 0) {
            const waitMs = MIN_DELAY_MS - (now - lastCallTime);
            Alert.alert(
                'Slow down',
                `Please wait ${Math.ceil(waitMs / 1000)} seconds before generating notes again.`
            );
            return;
        }

        try {
            setGeneratingNotes(true);

            if (modelIndex === 0) {
                setStudyNotes('');
            }

            const currentModel = GEMINI_MODELS[modelIndex];
            console.log(`🔄 Trying model: ${currentModel}`);

            const prompt = `Generate comprehensive study notes and a reviewer for the following topic: "${task.title}"
      
${task.description ? `Additional context: ${task.description}` : ''}

Please provide:
1. Key Concepts (3-5 main points)
2. Detailed Explanation
3. Important Terms and Definitions
4. Study Tips
5. Practice Questions (3-5 questions)

Format the response in a clear, organized manner suitable for studying.`;

            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1/models/${currentModel}:generateContent?key=${GEMINI_API_KEY}`,
                {
                    contents: [{ parts: [{ text: prompt }] }],
                },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 20000,
                }
            );

            lastCallTime = Date.now();

            const generatedText =
                response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedText) {
                console.log(`✅ Success with ${currentModel}`);
                setStudyNotes(generatedText);
            } else {
                throw new Error('No content generated');
            }
        } catch (error) {
            console.log(
                'AXIOS ERROR:',
                error.response?.data || error.message || error.toString()
            );

            const apiError = error.response?.data?.error;

            if (apiError?.code === 503 && modelIndex < GEMINI_MODELS.length - 1) {
                await new Promise((r) => setTimeout(r, 1000));
                return generateStudyNotes(task, modelIndex + 1);
            }

            if (apiError?.code === 429) {
                Alert.alert(
                    'Rate limit reached',
                    'You have hit the AI usage limit. Please wait a bit before trying again.'
                );
                return;
            }

            Alert.alert(
                'Generation Failed',
                apiError?.message || error.message || 'Could not generate study notes.'
            );
        } finally {
            setGeneratingNotes(false);
        }
    };

    /* ============================
       QUIZ HELPERS
       ============================ */

    const handleSelectOption = (qNumber, optionIndex) => {
        setSelectedOptions((prev) => ({
            ...prev,
            [qNumber]: optionIndex,
        }));
    };

    /* ============================
       MODAL OPEN/CLOSE
       ============================ */

    const openTaskModal = (task) => {
        setSelectedTask(task);
        setModalVisible(true);
        setStudyNotes('');

        // Parse quiz JSON for NEW schema
        try {
            if (task.quizDataJson) {
                const parsed = JSON.parse(task.quizDataJson);
                const items = Array.isArray(parsed) ? parsed : parsed.questions || [];
                setQuizItems(items);
            } else {
                setQuizItems([]);
            }
            setSelectedOptions({});
        } catch (e) {
            console.error('Failed to parse quiz JSON:', e);
            setQuizItems([]);
            setSelectedOptions({});
        }

        Animated.parallel([
            Animated.timing(modalAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeTaskModal = () => {
        Animated.parallel([
            Animated.timing(modalAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setModalVisible(false);
            setSelectedTask(null);
            setStudyNotes('');
            setQuizItems([]);
            setSelectedOptions({});
        });
    };

    /* ============================
       TASK ACTIONS
       ============================ */

    const toggleTask = async (id) => {
        try {
            const task = tasks.find((t) => t.id === id);
            if (!task) return;

            const taskRef = doc(db, 'tasks', id);
            await updateDoc(taskRef, {
                completed: !task.completed,
                completedAt: !task.completed ? new Date() : null,
            });

            setTasks(tasks.map(t =>
                t.id === id ? { ...t, completed: !t.completed } : t
            ));
        } catch (error) {
            console.error('Error toggling task:', error);
            Alert.alert('Error', 'Failed to update task. Please try again.');
        }
    };

    const deleteTask = (id) => {
        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'tasks', id));
                            setTasks(tasks.filter(task => task.id !== id));
                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task. Please try again.');
                        }
                    }
                },
            },
        ]);
    };

    const editTask = (task) => {
        Alert.alert('Edit Task', 'Edit functionality coming soon!');
    };

    // View task details in modal
    const viewTaskDetails = (task) => {
        setSelectedTask(task);
        setModalVisible(true);
    };

    // Close modal
    const closeModal = () => {
        setModalVisible(false);
        setSelectedTask(null);
    };

    /* ============================
       HELPERS
       ============================ */

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'border-red-500';
            case 'medium':
                return 'border-yellow-500';
            case 'low':
                return 'border-green-500';
            default:
                return 'border-gray-300';
        }
    };

    const getFormattedDate = (dateString) => {
        if (!dateString) return 'No due date';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getPriorityBgColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100';
            case 'medium':
                return 'bg-yellow-100';
            case 'low':
                return 'bg-green-100';
            default:
                return 'bg-gray-100';
        }
    };

    const getPriorityTextColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'text-red-700';
            case 'medium':
                return 'text-yellow-700';
            case 'low':
                return 'text-green-700';
            default:
                return 'text-gray-700';
        }
    };

    const filteredTasks =
        filter === 'all'
            ? tasks
            : tasks.filter((task) => task.priority === filter);

    const completedCount = tasks.filter((t) => t.completed).length;
    const pendingCount = tasks.filter((t) => !t.completed).length;

    const openPDF = async (url) => {
        try {
            if (!url?.startsWith('https://res.cloudinary.com/')) {
                Alert.alert('Invalid PDF URL');
                return;
            }

            const supported = await Linking.canOpenURL(url);
            if (!supported) {
                Alert.alert('Cannot open PDF');
                return;
            }

            await Linking.openURL(url);
        } catch (error) {
            console.error('Open PDF error:', error);
            Alert.alert('Error', 'Failed to open PDF.');
        }
    };


    if (loading) {
        return (
            <View style={tw`flex-1 bg-purple-50 items-center justify-center`}>
                <ActivityIndicator size="large" color="#9333EA" />
                <CustomText style={tw`text-gray-600 mt-4`}>
                    Loading tasks...
                </CustomText>
            </View>
        );
    }

    /* ============================
       MAIN RENDER
       ============================ */

    return (
        <View style={tw`flex-1 bg-gradient-to-br from-purple-50 to-blue-50`}>
            {/* Decorative background */}
            <View style={tw`absolute inset-0 opacity-5`}>
                <View style={tw`absolute top-20 left-10 w-40 h-40 bg-purple-500 rounded-full`} />
                <View style={tw`absolute bottom-40 right-10 w-60 h-60 bg-blue-500 rounded-full`} />
            </View>

            {/* Header */}
            <View style={tw`pt-12 px-6 pb-4 bg-white/80 backdrop-blur-lg shadow-sm`}>
                <View style={tw`flex-row items-center justify-between`}>
                    <CustomText style={tw`text-2xl font-bold text-gray-800`}>
                        All Tasks
                    </CustomText>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AddTask')}
                        style={tw`bg-white/20 p-3 rounded-full`}
                    >
                        <Ionicons name="add" size={24} color="#9333EA" />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={tw`flex-row justify-between mt-4`}>
                    <View style={tw`flex-1 bg-white/60 rounded-2xl p-3 mr-2`}>
                        <CustomText style={tw`text-2xl font-bold text-purple-600`}>
                            {tasks.length}
                        </CustomText>
                        <CustomText style={tw`text-gray-600 text-sm`}>Total</CustomText>
                    </View>
                    <View style={tw`flex-1 bg-white/60 rounded-2xl p-3 mx-1`}>
                        <CustomText style={tw`text-2xl font-bold text-green-600`}>
                            {completedCount}
                        </CustomText>
                        <CustomText style={tw`text-gray-600 text-sm`}>Done</CustomText>
                    </View>
                    <View style={tw`flex-1 bg-white/60 rounded-2xl p-3 ml-2`}>
                        <CustomText style={tw`text-2xl font-bold text-orange-600`}>
                            {pendingCount}
                        </CustomText>
                        <CustomText style={tw`text-gray-600 text-sm`}>Pending</CustomText>
                    </View>
                </View>

                {/* Filter */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={tw`mt-4`}
                >
                    {['all', 'high', 'medium', 'low'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            onPress={() => setFilter(f)}
                            style={tw`px-4 py-2 rounded-full mr-2 ${filter === f ? 'bg-purple-600' : 'bg-gray-100'
                                }`}
                        >
                            <CustomText
                                style={tw`${filter === f ? 'text-white' : 'text-gray-700'
                                    } font-semibold`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </CustomText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Task list */}
            <ScrollView
                contentContainerStyle={tw`px-6 py-6`}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredTasks.length === 0 ? (
                    <View style={tw`items-center justify-center py-20`}>
                        <Ionicons name="clipboard-outline" size={80} color="#D1D5DB" />
                        <CustomText style={tw`text-gray-400 text-lg mt-4`}>
                            No tasks found
                        </CustomText>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddTask')}
                            style={tw`bg-purple-600 px-6 py-3 rounded-full mt-4`}
                        >
                            <CustomText style={tw`text-white font-semibold`}>
                                Create Your First Task
                            </CustomText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    filteredTasks.map((task) => (
                        <TouchableOpacity
                            key={task.id}
                            style={[
                                tw`bg-white rounded-3xl p-4 mb-4 shadow-sm border-l-4 ${getPriorityColor(task.priority)}`,
                                { opacity: fadeAnim }
                            ]}
                        >
                            <View style={tw`flex-row items-center`}>
                                <TouchableOpacity
                                    onPress={() => toggleTask(task.id)}
                                    style={tw`w-10 h-10 rounded-full border-2 ${task.completed ? 'bg-purple-600 border-purple-600' : 'border-gray-300'} items-center justify-center mr-3`}
                                >
                                    {task.completed && <Ionicons name="checkmark" size={20} color="white" />}
                                </TouchableOpacity>

                                <View style={tw`flex-1`}>
                                    <View style={tw`flex-row items-center mb-1`}>
                                        <CustomText style={tw`text-2xl mr-2`}>{task.emoji || '📝'}</CustomText>
                                        <CustomText style={tw`text-base font-semibold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'} flex-1`}>
                                            {task.title}
                                        </CustomText>
                                    </View>
                                    <CustomText style={tw`text-sm text-gray-500`}>
                                        Due: {task.dueDate || 'No due date'}
                                    </CustomText>
                                </View>

                                <View style={tw`flex-row gap-2`}>
                                    <TouchableOpacity
                                        onPress={() => editTask(task)}
                                        style={tw`bg-blue-50 p-2 rounded-full`}
                                    >
                                        <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => deleteTask(task.id)}
                                        style={tw`bg-red-50 p-2 rounded-full`}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Description */}
                            {task.description && (
                                <View style={tw`mt-3 ml-13 bg-gray-50 rounded-2xl p-3`}>
                                    <CustomText style={tw`text-sm text-gray-600`}>{task.description}</CustomText>
                                </View>
                            )}

                            {/* PDF Attachment */}
                            {task.hasAttachment && task.pdfUrl && (
                                <View style={tw`mt-3 ml-13 bg-indigo-50 rounded-2xl p-3`}>
                                    <View style={tw`flex-row items-center justify-between`}>
                                        <View style={tw`flex-row items-center flex-1`}>
                                            <Ionicons name="document-text-outline" size={18} color="#4F46E5" />
                                            <CustomText numberOfLines={1} style={tw`ml-2 text-sm text-indigo-700 flex-1`}>
                                                {task.pdfName || 'Attached PDF'}
                                            </CustomText>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => openPDF(task.pdfUrl)}
                                            style={tw`bg-indigo-600 px-3 py-1.5 rounded-full`}
                                        >
                                            <CustomText style={tw`text-white text-xs font-semibold`}>View</CustomText>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </Animated.View>
                    ))
                )}
                <View style={tw`h-6`} />
            </ScrollView>
        </View>
    );
}