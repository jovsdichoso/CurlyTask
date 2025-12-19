import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    TouchableOpacity,
    ScrollView,
    Animated,
    Alert,
    RefreshControl,
    Linking
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
    orderBy
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import ViewTaskModal from '../components/modals/ViewTaskModal';
import tw from 'twrnc';

export default function TasksListScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('all'); // all, high, medium, low
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

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

    // Fetch tasks from Firestore
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

    // Toggle task completion
    const toggleTask = async (id) => {
        try {
            const task = tasks.find(t => t.id === id);
            const taskRef = doc(db, 'tasks', id);

            await updateDoc(taskRef, {
                completed: !task.completed,
                completedAt: !task.completed ? new Date() : null
            });

            setTasks(tasks.map(t =>
                t.id === id ? { ...t, completed: !t.completed } : t
            ));
            
            // Update selected task if it's the one being toggled
            if (selectedTask?.id === id) {
                setSelectedTask(prev => ({ ...prev, completed: !prev.completed }));
            }

        } catch (error) {
            console.error('Error toggling task:', error);
            Alert.alert('Error', 'Failed to update task. Please try again.');
        }
    };

    // Delete task
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
                            
                            // Close modal if the deleted task is currently selected
                            if (selectedTask?.id === id) {
                                setModalVisible(false);
                                setSelectedTask(null);
                            }

                        } catch (error) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    // Edit task (placeholder)
    const editTask = (task) => {
        // Navigate to edit screen (you can create this later)
        setModalVisible(false);
        Alert.alert('Edit Task', 'Edit functionality coming soon!');
        // navigation.navigate('EditTask', { taskId: task.id, task });
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

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'border-red-500';
            case 'medium': return 'border-yellow-500';
            case 'low': return 'border-green-500';
            default: return 'border-gray-300';
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

    const filteredTasks = filter === 'all'
        ? tasks
        : tasks.filter(task => task.priority === filter);

    const completedCount = tasks.filter(t => t.completed).length;
    const pendingCount = tasks.filter(t => !t.completed).length;

    // Open PDF properly
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
            <View style={tw`flex-1 bg-white items-center justify-center`}>
                <CustomText style={tw`text-gray-600`}>Loading tasks...</CustomText>
            </View>
        );
    }

    return (
        <View style={tw`flex-1 bg-white`}>
            {/* Decorative Background */}
            <View style={tw`absolute top-0 left-0 right-0 h-72 bg-purple-600 rounded-b-[50px] overflow-hidden`}>
                <View style={tw`absolute -top-20 -left-20 w-60 h-60 bg-purple-500 rounded-full opacity-20`} />
                <View style={tw`absolute top-40 -right-10 w-40 h-40 bg-purple-400 rounded-full opacity-20`} />
                <View style={tw`absolute top-10 right-20 w-20 h-20 bg-white rounded-full opacity-10`} />
            </View>

            {/* Header */}
            <Animated.View style={[tw`px-6 pt-14 pb-6`, { opacity: fadeAnim }]}>
                <View style={tw`flex-row items-center justify-between mb-4`}>
                    <CustomText style={tw`text-white text-3xl font-bold`}>All Tasks</CustomText>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('AddTask')}
                        style={tw`bg-white/20 p-3 rounded-full`}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                <View style={tw`bg-white/10 backdrop-blur rounded-3xl p-4 flex-row justify-around`}>
                    <View style={tw`items-center`}>
                        <CustomText style={tw`text-white text-2xl font-bold`}>{tasks.length}</CustomText>
                        <CustomText style={tw`text-white/80 text-sm`}>Total</CustomText>
                    </View>
                    <View style={tw`items-center`}>
                        <CustomText style={tw`text-white text-2xl font-bold`}>{completedCount}</CustomText>
                        <CustomText style={tw`text-white/80 text-sm`}>Done</CustomText>
                    </View>
                    <View style={tw`items-center`}>
                        <CustomText style={tw`text-white text-2xl font-bold`}>{pendingCount}</CustomText>
                        <CustomText style={tw`text-white/80 text-sm`}>Pending</CustomText>
                    </View>
                </View>
            </Animated.View>

            {/* Filter Tabs */}
            <View style={tw`flex-row px-6 mb-4 gap-2`}>
                {['all', 'high', 'medium', 'low'].map((f) => (
                    <TouchableOpacity
                        key={f}
                        onPress={() => setFilter(f)}
                        style={tw`px-4 py-2 rounded-full ${filter === f ? 'bg-purple-600' : 'bg-gray-100'}`}
                    >
                        <CustomText style={tw`text-sm font-semibold ${filter === f ? 'text-white' : 'text-gray-600'}`}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </CustomText>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Tasks List */}
            <ScrollView
                style={tw`flex-1 px-6`}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#9333EA"
                    />
                }
            >
                {filteredTasks.length === 0 ? (
                    <View style={tw`items-center mt-20`}>
                        <CustomText style={tw`text-6xl mb-4`}>📋</CustomText>
                        <CustomText style={tw`text-gray-400 text-lg mb-2`}>No tasks found</CustomText>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('AddTask')}
                            style={tw`bg-purple-600 px-6 py-3 rounded-full mt-4`}
                        >
                            <CustomText style={tw`text-white font-semibold`}>Create Your First Task</CustomText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    filteredTasks.map((task) => (
                        <TouchableOpacity
                            key={task.id}
                            onPress={() => viewTaskDetails(task)}
                            activeOpacity={0.7}
                        >
                            <Animated.View
                                style={[
                                    tw`bg-white rounded-3xl p-4 mb-4 shadow-sm border-l-4 ${getPriorityColor(task.priority)}`,
                                    { opacity: fadeAnim }
                                ]}
                            >
                                <View style={tw`flex-row items-center`}>
                                    <TouchableOpacity
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            toggleTask(task.id);
                                        }}
                                        style={tw`w-10 h-10 rounded-full border-2 ${task.completed ? 'bg-purple-600 border-purple-600' : 'border-gray-300'
                                            } items-center justify-center mr-3`}
                                    >
                                        {task.completed && <Ionicons name="checkmark" size={20} color="white" />}
                                    </TouchableOpacity>

                                    <View style={tw`flex-1`}>
                                        <View style={tw`flex-row items-center mb-1`}>
                                            <CustomText style={tw`text-2xl mr-2`}>{task.emoji || '📝'}</CustomText>
                                            <CustomText style={tw`text-base font-semibold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'
                                                } flex-1`}>
                                                {task.title}
                                            </CustomText>
                                        </View>
                                        <CustomText style={tw`text-sm text-gray-500`}>
                                            Due: {getFormattedDate(task.dueDate)}
                                        </CustomText>
                                    </View>

                                    <View style={tw`flex-row gap-2`}>
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                editTask(task);
                                            }}
                                            style={tw`bg-blue-50 p-2 rounded-full`}
                                        >
                                            <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={(e) => {
                                                e.stopPropagation();
                                                deleteTask(task.id);
                                            }}
                                            style={tw`bg-red-50 p-2 rounded-full`}
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Show description if exists */}
                                {task.description && (
                                    <View style={tw`mt-3 ml-13 bg-gray-50 rounded-2xl p-3`}>
                                        <CustomText 
                                            style={tw`text-sm text-gray-600`}
                                            numberOfLines={2}
                                        >
                                            {task.description}
                                        </CustomText>
                                    </View>
                                )}
                            </Animated.View>
                        </TouchableOpacity>
                    ))
                )}
                <View style={tw`h-6`} />
            </ScrollView>

            {/* Task Details Modal */}
            <ViewTaskModal
                modalVisible={modalVisible}
                selectedTask={selectedTask}
                onClose={closeModal}
                onToggleComplete={toggleTask}
                onEdit={editTask}
                onDelete={deleteTask}
            />
        </View>
    );
}