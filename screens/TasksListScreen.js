import React, { useState, useEffect, useRef } from 'react';
import {
    View, TouchableOpacity, ScrollView, Animated, Alert,
    RefreshControl, Linking, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    collection, query, where, getDocs, updateDoc,
    deleteDoc, doc, orderBy,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';
import axios from 'axios';

const GEMINI_API_KEY = 'AIzaSyCsEWJVf98n5CNMYLgZTH7BBhKl7kQLW6A';

export default function TasksListScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    // QUIZ STATE
    const [quizItems, setQuizItems] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({}); // Format: { [questionNumber]: selectedIndex }

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const modalAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(300)).current;

    useEffect(() => {
        fetchTasks();
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
        return navigation.addListener('focus', fetchTasks);
    }, [navigation]);

    const fetchTasks = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return setLoading(false);

            const qRef = query(collection(db, 'tasks'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(qRef);
            const fetched = [];
            querySnapshot.forEach((docSnap) => fetched.push({ id: docSnap.id, ...docSnap.data() }));
            setTasks(fetched);
        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSelectOption = (qNumber, optionIndex) => {
        // Prevent changing the answer once selected
        if (selectedOptions[qNumber] !== undefined) return;

        setSelectedOptions((prev) => ({
            ...prev,
            [qNumber]: optionIndex,
        }));
    };

    const openTaskModal = (task) => {
        setSelectedTask(task);
        setSelectedOptions({}); // Reset quiz progress for new modal

        try {
            if (task.quizDataJson) {
                const parsed = JSON.parse(task.quizDataJson);
                const items = Array.isArray(parsed) ? parsed : (parsed.questions || []);
                setQuizItems(items);
            } else {
                setQuizItems([]);
            }
        } catch (e) {
            console.error('Quiz JSON Parse Error:', e);
            setQuizItems([]);
        }

        setModalVisible(true);
        Animated.parallel([
            Animated.timing(modalAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();
    };

    const closeTaskModal = () => {
        Animated.parallel([
            Animated.timing(modalAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 300, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            setModalVisible(false);
            setSelectedTask(null);
            setQuizItems([]);
        });
    };

    const toggleTask = async (id) => {
        const task = tasks.find((t) => t.id === id);
        if (!task) return;
        await updateDoc(doc(db, 'tasks', id), { completed: !task.completed });
        fetchTasks();
    };

    const deleteTask = async (id) => {
        Alert.alert('Delete', 'Delete this task?', [
            { text: 'Cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await deleteDoc(doc(db, 'tasks', id));
                    fetchTasks();
                    closeTaskModal();
                }
            }
        ]);
    };

    return (
        <View style={tw`flex-1 bg-purple-50`}>
            <ScrollView
                contentContainerStyle={tw`p-6`}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTasks} />}
            >
                {tasks.map((task) => (
                    <TouchableOpacity
                        key={task.id}
                        onPress={() => openTaskModal(task)}
                        style={tw`bg-white p-4 rounded-3xl mb-4 shadow-sm border-l-4 border-purple-500`}
                    >
                        <View style={tw`flex-row items-center`}>
                            <CustomText style={tw`text-2xl mr-3`}>{task.emoji || '📝'}</CustomText>
                            <View style={tw`flex-1`}>
                                <CustomText style={tw`text-lg font-bold text-gray-800`}>{task.title}</CustomText>
                                {task.quizDataJson ? <CustomText style={tw`text-indigo-500 text-xs`}>✨ AI Quiz Ready</CustomText> : null}
                            </View>
                            <Ionicons name={task.completed ? "checkmark-circle" : "ellipse-outline"} size={24} color="#9333EA" />
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="none" onRequestClose={closeTaskModal}>
                <View style={tw`flex-1 bg-black/50 justify-end`}>
                    <Animated.View style={[tw`bg-white rounded-t-3xl p-6`, { height: '85%', opacity: modalAnim, transform: [{ translateY: slideAnim }] }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={tw`flex-row justify-between items-center mb-6`}>
                                <CustomText style={tw`text-2xl font-bold text-gray-800`}>{selectedTask?.title}</CustomText>
                                <TouchableOpacity onPress={closeTaskModal}><Ionicons name="close-circle" size={30} color="#D1D5DB" /></TouchableOpacity>
                            </View>

                            {/* --- FIXED QUIZ SECTION --- */}
                            {quizItems.length > 0 ? (
                                <View style={tw`mb-6`}>
                                    <CustomText style={tw`text-purple-700 font-bold mb-4`}>Reviewer Quiz</CustomText>
                                    {quizItems.map((q, qIdx) => {
                                        const qNum = q.questionNumber || (qIdx + 1);
                                        const userSelection = selectedOptions[qNum];
                                        const isAnswered = userSelection !== undefined;

                                        return (
                                            <View key={qNum} style={tw`mb-6 bg-gray-50 p-4 rounded-2xl`}>
                                                <CustomText style={tw`font-bold text-gray-800 mb-3`}>{qNum}. {q.question}</CustomText>

                                                {q.options.map((opt, optIdx) => {
                                                    const isThisSelected = userSelection === optIdx;
                                                    // Standardize comparison by trimming whitespace
                                                    const isCorrect = opt.trim() === q.correctAnswer.trim();

                                                    let btnStyle = 'bg-white border-gray-200';
                                                    let textStyle = 'text-gray-700';

                                                    // Only highlight green/red AFTER the user picks an option
                                                    if (isAnswered) {
                                                        if (isCorrect) {
                                                            btnStyle = 'bg-green-100 border-green-500';
                                                            textStyle = 'text-green-800 font-bold';
                                                        } else if (isThisSelected) {
                                                            btnStyle = 'bg-red-100 border-red-500';
                                                            textStyle = 'text-red-800';
                                                        }
                                                    }

                                                    return (
                                                        <TouchableOpacity
                                                            key={optIdx}
                                                            disabled={isAnswered}
                                                            onPress={() => handleSelectOption(qNum, optIdx)}
                                                            style={tw`flex-row items-center p-3 rounded-xl border-2 mb-2 ${btnStyle}`}
                                                        >
                                                            <CustomText style={tw`mr-3 ${textStyle}`}>{String.fromCharCode(65 + optIdx)}.</CustomText>
                                                            <CustomText style={tw`flex-1 ${textStyle}`}>{opt}</CustomText>
                                                            {isAnswered && isCorrect && <Ionicons name="checkmark-circle" size={18} color="green" />}
                                                            {isAnswered && isThisSelected && !isCorrect && <Ionicons name="close-circle" size={18} color="red" />}
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        );
                                    })}
                                </View>
                            ) : (
                                <CustomText style={tw`text-gray-400 italic text-center py-10`}>No quiz data found for this task.</CustomText>
                            )}

                            <TouchableOpacity
                                onPress={() => deleteTask(selectedTask?.id)}
                                style={tw`bg-red-50 p-4 rounded-2xl flex-row items-center justify-center mt-4`}
                            >
                                <Ionicons name="trash" size={20} color="#EF4444" />
                                <CustomText style={tw`text-red-600 font-bold ml-2`}>Delete Task</CustomText>
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>
        </View>
    );
}