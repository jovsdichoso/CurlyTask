import React from 'react';
import { Modal, View, TouchableOpacity, TouchableWithoutFeedback, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../CustomText';
import tw from 'twrnc';

const { width } = Dimensions.get('window');

const ViewTaskModal = ({ 
    modalVisible, 
    selectedTask, 
    onClose, 
    onToggleComplete, 
    onEdit, 
    onDelete 
}) => {
    if (!selectedTask) return null;

    const getPriorityBgColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100';
            case 'medium': return 'bg-yellow-100';
            case 'low': return 'bg-green-100';
            default: return 'bg-gray-100';
        }
    };

    const getPriorityTextColor = (priority) => {
        switch (priority) {
            case 'high': return 'text-red-800';
            case 'medium': return 'text-yellow-800';
            case 'low': return 'text-green-800';
            default: return 'text-gray-800';
        }
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high': return 'High Priority';
            case 'medium': return 'Medium Priority';
            case 'low': return 'Low Priority';
            default: return 'No Priority';
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

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={onClose}
        >
            <View style={tw`flex-1 justify-end`}>

                <TouchableWithoutFeedback onPress={onClose}>
                    <View style={tw`absolute inset-0 bg-black/50`} />
                </TouchableWithoutFeedback>
                
                <View style={tw`bg-white rounded-t-3xl max-h-4/5 overflow-hidden`}>

                    {/* Modal Header with Close Button */}
                    <View style={tw`pt-6 pb-4 px-6 border-b border-gray-100 relative`}>
                        {/* Close Button - Positioned absolutely */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={tw`absolute top-6 right-6 z-10 w-10 h-10 items-center justify-center bg-gray-100 rounded-full`}
                        >
                            <Ionicons name="close" size={24} color="#4B5563" />
                        </TouchableOpacity>
                        
                        <View style={tw`pr-10`}>
                            <View style={tw`flex-row items-start`}>
                                <CustomText style={tw`text-4xl mr-4`}>
                                    {selectedTask?.emoji || '📝'}
                                </CustomText>
                                <View style={tw`flex-1`}>
                                    <CustomText 
                                        style={tw`text-2xl font-bold text-gray-800`}
                                        numberOfLines={2}
                                    >
                                        {selectedTask?.title}
                                    </CustomText>
                                    <View style={tw`flex-row flex-wrap items-center mt-3 gap-2`}>
                                        <View style={tw`${getPriorityBgColor(selectedTask?.priority)} px-3 py-1.5 rounded-full`}>
                                            <CustomText style={tw`text-sm font-semibold ${getPriorityTextColor(selectedTask?.priority)}`}>
                                                {getPriorityLabel(selectedTask?.priority)}
                                            </CustomText>
                                        </View>
                                        <View style={tw`${selectedTask?.completed ? 'bg-green-100' : 'bg-yellow-100'} px-3 py-1.5 rounded-full`}>
                                            <CustomText style={tw`text-sm font-semibold ${selectedTask?.completed ? 'text-green-800' : 'text-yellow-800'}`}>
                                                {selectedTask?.completed ? 'Completed' : 'Pending'}
                                            </CustomText>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Modal Content */}
                    <ScrollView 
                        style={tw`px-6`} 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={tw`pb-6`}
                    >
                        {/* Description */}
                        <View style={tw`mb-6 mt-4`}>
                            <CustomText style={tw`text-lg font-semibold text-gray-700 mb-3`}>
                                Description
                            </CustomText>
                            <View style={tw`bg-gray-50 rounded-2xl p-4`}>
                                <CustomText style={tw`text-gray-600`}>
                                    {selectedTask?.description || 'No description provided'}
                                </CustomText>
                            </View>
                        </View>

                        {/* Due Date */}
                        <View style={tw`mb-6`}>
                            <CustomText style={tw`text-lg font-semibold text-gray-700 mb-3`}>
                                Due Date
                            </CustomText>
                            <View style={tw`flex-row items-center bg-gray-50 rounded-2xl p-4`}>
                                <Ionicons name="calendar-outline" size={20} color="#6B7280" style={tw`mr-3`} />
                                <CustomText style={tw`text-gray-600 flex-1`}>
                                    {getFormattedDate(selectedTask?.dueDate)}
                                </CustomText>
                            </View>
                        </View>

                        {/* Created At */}
                        {selectedTask?.createdAt && (
                            <View style={tw`mb-6`}>
                                <CustomText style={tw`text-lg font-semibold text-gray-700 mb-3`}>
                                    Created
                                </CustomText>
                                <View style={tw`flex-row items-center bg-gray-50 rounded-2xl p-4`}>
                                    <Ionicons name="time-outline" size={20} color="#6B7280" style={tw`mr-3`} />
                                    <CustomText style={tw`text-gray-600 flex-1`}>
                                        {new Date(selectedTask.createdAt.seconds * 1000).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </CustomText>
                                </View>
                            </View>
                        )}

                        {/* Completed At */}
                        {selectedTask?.completed && selectedTask?.completedAt && (
                            <View style={tw`mb-6`}>
                                <CustomText style={tw`text-lg font-semibold text-gray-700 mb-3`}>
                                    Completed
                                </CustomText>
                                <View style={tw`flex-row items-center bg-gray-50 rounded-2xl p-4`}>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" style={tw`mr-3`} />
                                    <CustomText style={tw`text-gray-600 flex-1`}>
                                        {new Date(selectedTask.completedAt.seconds * 1000).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </CustomText>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Modal Footer - Action Buttons */}
                    <View style={tw`p-6 border-t border-gray-100`}>
                        <View style={tw`flex-row gap-3`}>
                            {/* Mark Complete/Pending Button */}
                            <TouchableOpacity
                                onPress={() => onToggleComplete(selectedTask.id)}
                                style={tw`flex-1 bg-purple-600 rounded-2xl py-4 flex-row items-center justify-center`}
                            >
                                <Ionicons 
                                    name={selectedTask?.completed ? "close-circle-outline" : "checkmark-circle-outline"} 
                                    size={22} 
                                    color="white" 
                                    style={tw`mr-2`}
                                />
                                <CustomText style={tw`text-white font-semibold text-base`}>
                                    {selectedTask?.completed ? 'Mark Pending' : 'Mark Complete'}
                                </CustomText>
                            </TouchableOpacity>

                            {/* Edit Button */}
                            <TouchableOpacity
                                onPress={() => onEdit(selectedTask)}
                                style={tw`w-16 bg-blue-50 rounded-2xl items-center justify-center`}
                            >
                                <Ionicons name="pencil-outline" size={24} color="#3B82F6" />
                            </TouchableOpacity>

                            {/* Delete Button */}
                            <TouchableOpacity
                                onPress={() => onDelete(selectedTask.id)}
                                style={tw`w-16 bg-red-50 rounded-2xl items-center justify-center`}
                            >
                                <Ionicons name="trash-outline" size={24} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default ViewTaskModal;