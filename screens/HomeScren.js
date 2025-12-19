import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, orderBy } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';

const DEFAULT_AVATAR = 'https://www.gravatar.com/avatar/0000000000000000000000000000000000000000000000000000000000000000?d=mp&f=y';

export default function HomeScreen({ navigation }) {
    const user = auth.currentUser;
    const [userData, setUserData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [completedToday, setCompletedToday] = useState(0);

    useEffect(() => {
        fetchUserData();
        fetchTasks();

        const unsubscribe = navigation.addListener('focus', fetchTasks);
        return unsubscribe;
    }, [navigation]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTasks();
    };

    const fetchUserData = async () => {
        try {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                setUserData(userDoc.exists() ? userDoc.data() : { username: user.displayName || 'User' });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchTasks = async () => {
        try {
            if (!user) return;

            // Get incomplete tasks
            const tasksQuery = query(
                collection(db, 'tasks'),
                where('userId', '==', user.uid),
                where('completed', '==', false),
                orderBy('createdAt', 'desc')
            );

            const snapshot = await getDocs(tasksQuery);
            const fetchedTasks = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

            // Sort by priority (high > medium > low)
            fetchedTasks.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return (priorityOrder[a.priority || 'low'] || 2) - (priorityOrder[b.priority || 'low'] || 2);
            });

            setTasks(fetchedTasks);

            // Get tasks completed today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const completedQuery = query(
                collection(db, 'tasks'),
                where('userId', '==', user.uid),
                where('completed', '==', true),
                where('completedAt', '>=', today)
            );
            const completedSnap = await getDocs(completedQuery);
            setCompletedToday(completedSnap.size);
        } catch (error) {
            Alert.alert('Error', 'Failed to load tasks.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const markTaskDone = async (taskId) => {
        try {
            await updateDoc(doc(db, 'tasks', taskId), {
                completed: true,
                completedAt: new Date(),
            });
            setCompletedToday(completedToday + 1);
            setTasks(tasks.filter(t => t.id !== taskId));
            
            // Show success feedback
            Alert.alert('Great Job!', 'Task completed successfully!', [{ text: 'OK' }]);
        } catch (error) {
            Alert.alert('Error', 'Failed to complete task.');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-500';
            case 'medium': return 'bg-yellow-500';
            case 'low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getPriorityTextColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-700';
            case 'medium': return 'text-yellow-700';
            case 'low': return 'text-green-700';
            default: return 'text-gray-700';
        }
    };

    const navigateToAddTask = () => {
        navigation.navigate('AddTask');
    };

    const navigateToTasksList = () => {
        navigation.navigate('TasksList');
    };

    if (loading) {
        return (
            <View style={tw`flex-1 bg-white items-center justify-center`}>
                <ActivityIndicator size="large" color="#10B981" />
                <CustomText style={tw`text-gray-600 mt-4`}>Loading your tasks...</CustomText>
            </View>
        );
    }

    const avatarUrl = userData?.photoURL || user?.photoURL || DEFAULT_AVATAR;
    const totalTasks = completedToday + tasks.length;
    const overallProgress = totalTasks > 0 ? Math.round((completedToday / totalTasks) * 100) : 0;

    return (
        <View style={tw`flex-1 bg-white`}>
            <ScrollView 
                style={tw`flex-1`} 
                contentContainerStyle={tw`pb-8`}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#10B981']}
                        tintColor="#10B981"
                    />
                }
            >
                {/* Header with Greeting */}
                <View style={tw`px-6 pt-12 pb-6 bg-gradient-to-b from-emerald-50 to-white`}>
                    <View style={tw`flex-row justify-between items-center`}>
                        <View style={tw`flex-1`}>
                            <CustomText style={tw`text-3xl font-bold text-gray-900`}>
                                Hello, {userData?.username || 'User'} 👋
                            </CustomText>
                            <CustomText style={tw`text-gray-600 mt-1`}>
                                {tasks.length > 0 ? `You have ${tasks.length} tasks today` : 'All caught up!'}
                            </CustomText>
                        </View>
                        <Image
                            source={{ uri: avatarUrl }}
                            style={tw`w-14 h-14 rounded-full border-2 border-white shadow-md`}
                        />
                    </View>

                    {/* Quick Actions Bar */}
                    <View style={tw`flex-row items-center mt-6`}>
                        <TouchableOpacity 
                            style={tw`flex-1 bg-white rounded-2xl px-4 py-3 flex-row items-center mr-3 shadow-sm`}
                            onPress={() => Alert.alert('Search', 'Search functionality coming soon!')}
                        >
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <CustomText style={tw`text-gray-500 ml-3`}>Search tasks...</CustomText>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={tw`bg-emerald-500 w-12 h-12 rounded-2xl items-center justify-center shadow-md`}
                            onPress={navigateToAddTask}
                        >
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Overview */}
                <View style={tw`px-6 mt-2`}>
                    <View style={tw`bg-gradient-to-r from-emerald-500 to-teal-500 rounded-3xl p-6 shadow-lg`}>
                        <View style={tw`flex-row justify-between items-center mb-4`}>
                            <View>
                                <CustomText style={tw`text-white text-lg font-semibold`}>Today's Progress</CustomText>
                                <CustomText style={tw`text-white/80 text-sm`}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', 'day': 'numeric' })}</CustomText>
                            </View>
                            <CustomText style={tw`text-white text-3xl font-bold`}>{overallProgress}%</CustomText>
                        </View>
                        
                        <View style={tw`w-full h-4 bg-white/30 rounded-full overflow-hidden mb-3`}>
                            <View 
                                style={[
                                    tw`h-full bg-white rounded-full`,
                                    { width: `${overallProgress}%` }
                                ]}
                            />
                        </View>
                        
                        <View style={tw`flex-row justify-between`}>
                            <View style={tw`items-center`}>
                                <CustomText style={tw`text-white text-2xl font-bold`}>{completedToday}</CustomText>
                                <CustomText style={tw`text-white/80 text-sm`}>Completed</CustomText>
                            </View>
                            <View style={tw`items-center`}>
                                <CustomText style={tw`text-white text-2xl font-bold`}>{tasks.length}</CustomText>
                                <CustomText style={tw`text-white/80 text-sm`}>Pending</CustomText>
                            </View>
                            <View style={tw`items-center`}>
                                <CustomText style={tw`text-white text-2xl font-bold`}>{totalTasks}</CustomText>
                                <CustomText style={tw`text-white/80 text-sm`}>Total</CustomText>
                            </View>
                        </View>
                    </View>
                </View>

                {/* My Tasks Section */}
                <View style={tw`px-6 mt-8`}>
                    <View style={tw`flex-row justify-between items-center mb-6`}>
                        <CustomText style={tw`text-2xl font-bold text-gray-900`}>My Tasks</CustomText>
                        <TouchableOpacity onPress={navigateToTasksList}>
                            <CustomText style={tw`text-emerald-600 font-semibold`}>View All</CustomText>
                        </TouchableOpacity>
                    </View>

                    {tasks.length === 0 ? (
                        <View style={tw`items-center py-12 bg-emerald-50 rounded-3xl p-8`}>
                            <View style={tw`w-24 h-24 bg-white rounded-full items-center justify-center mb-6 shadow-sm`}>
                                <Ionicons name="checkmark-done" size={48} color="#10B981" />
                            </View>
                            <CustomText style={tw`text-2xl font-bold text-gray-900 mb-2`}>All tasks completed!</CustomText>
                            <CustomText style={tw`text-gray-600 text-center mb-6`}>
                                {completedToday > 0 
                                    ? `Great work! You've completed ${completedToday} task${completedToday !== 1 ? 's' : ''} today.`
                                    : 'No pending tasks for today. Time to relax!'
                                }
                            </CustomText>
                            <TouchableOpacity 
                                onPress={navigateToAddTask}
                                style={tw`bg-emerald-500 px-6 py-3 rounded-full flex-row items-center`}
                            >
                                <Ionicons name="add" size={20} color="white" />
                                <CustomText style={tw`text-white font-semibold ml-2`}>Add New Task</CustomText>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* Priority-based Task Cards */}
                            <View style={tw`gap-4`}>
                                {tasks.map((task, index) => (
                                    <TouchableOpacity
                                        key={task.id}
                                        onPress={() => markTaskDone(task.id)}
                                        activeOpacity={0.9}
                                        style={tw`bg-white rounded-3xl p-5 shadow-sm border-l-4 ${getPriorityColor(task.priority)}`}
                                    >
                                        <View style={tw`flex-row justify-between items-start mb-3`}>
                                            <View style={tw`flex-1`}>
                                                <View style={tw`flex-row items-center mb-2`}>
                                                    <CustomText style={tw`text-2xl mr-2`}>{task.emoji || '📝'}</CustomText>
                                                    <CustomText style={tw`text-lg font-bold text-gray-900 flex-1`}>
                                                        {task.title || 'Untitled Task'}
                                                    </CustomText>
                                                </View>
                                                
                                                {task.description && (
                                                    <CustomText style={tw`text-gray-600 text-sm mb-3`}>
                                                        {task.description}
                                                    </CustomText>
                                                )}
                                                
                                                <View style={tw`flex-row items-center`}>
                                                    <View style={tw`${getPriorityColor(task.priority)}/20 px-3 py-1 rounded-full mr-3`}>
                                                        <CustomText style={tw`text-xs font-semibold ${getPriorityTextColor(task.priority)}`}>
                                                            {task.priority?.toUpperCase() || 'MEDIUM'}
                                                        </CustomText>
                                                    </View>
                                                    <View style={tw`flex-row items-center`}>
                                                        <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                                                        <CustomText style={tw`text-gray-500 text-xs ml-1`}>
                                                            {task.dueDate || 'No due date'}
                                                        </CustomText>
                                                    </View>
                                                </View>
                                            </View>
                                            
                                            <TouchableOpacity 
                                                onPress={() => markTaskDone(task.id)}
                                                style={tw`w-12 h-12 rounded-full border-2 border-emerald-200 items-center justify-center ml-2`}
                                            >
                                                <Ionicons name="checkmark" size={24} color="#10B981" />
                                            </TouchableOpacity>
                                        </View>
                                        
                                        {/* Progress indicator */}
                                        <View style={tw`flex-row items-center justify-between mt-3`}>
                                            <CustomText style={tw`text-gray-500 text-xs`}>Tap to complete</CustomText>
                                            {task.createdAt && (
                                                <CustomText style={tw`text-gray-400 text-xs`}>
                                                    Added {task.createdAt.toDate ? task.createdAt.toDate().toLocaleDateString() : 'recently'}
                                                </CustomText>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Quick Add Section */}
                            <View style={tw`mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-6`}>
                                <View style={tw`flex-row items-center justify-between`}>
                                    <View style={tw`flex-1`}>
                                        <CustomText style={tw`text-lg font-bold text-gray-900`}>Add more tasks?</CustomText>
                                        <CustomText style={tw`text-gray-600 text-sm mt-1`}>Keep your productivity going</CustomText>
                                    </View>
                                    <TouchableOpacity 
                                        onPress={navigateToAddTask}
                                        style={tw`bg-emerald-500 w-14 h-14 rounded-2xl items-center justify-center shadow-md`}
                                    >
                                        <Ionicons name="add" size={28} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </>
                    )}
                </View>

                {/* Quick Navigation Footer */}
                <View style={tw`px-6 mt-8`}>
                    <CustomText style={tw`text-xl font-bold text-gray-900 mb-4`}>Quick Access</CustomText>
                    <View style={tw`flex-row justify-between`}>
                        <TouchableOpacity 
                            onPress={navigateToTasksList}
                            style={tw`flex-1 bg-white rounded-2xl p-5 items-center mr-2 shadow-sm`}
                        >
                            <View style={tw`w-12 h-12 bg-emerald-100 rounded-full items-center justify-center mb-3`}>
                                <Ionicons name="list" size={24} color="#10B981" />
                            </View>
                            <CustomText style={tw`font-semibold text-gray-900`}>All Tasks</CustomText>
                            <CustomText style={tw`text-gray-500 text-xs mt-1`}>{totalTasks} total</CustomText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Settings')}
                            style={tw`flex-1 bg-white rounded-2xl p-5 items-center ml-2 shadow-sm`}
                        >
                            <View style={tw`w-12 h-12 bg-emerald-100 rounded-full items-center justify-center mb-3`}>
                                <Ionicons name="settings" size={24} color="#10B981" />
                            </View>
                            <CustomText style={tw`font-semibold text-gray-900`}>Settings</CustomText>
                            <CustomText style={tw`text-gray-500 text-xs mt-1`}>Customize app</CustomText>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}