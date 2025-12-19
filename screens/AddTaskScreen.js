import React, { useState, useRef, useEffect } from 'react';
import {
    View, TouchableOpacity, TextInput, ScrollView, Animated,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';
import axios from 'axios';

const GEMINI_API_KEY = 'AIzaSyCsEWJVf98n5CNMYLgZTH7BBhKl7kQLW6A'; 
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const CLOUDINARY_RAW_URL = `https://api.cloudinary.com/v1_1/du1dwcrhb/raw/upload`;
const CLOUDINARY_UPLOAD_PRESET = 'tasks_pdfs';

export default function AddTaskScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');
    const [selectedEmoji, setSelectedEmoji] = useState('📝');
    const [saving, setSaving] = useState(false);
    const [pdfFile, setPdfFile] = useState(null);
    const [quizDataJson, setQuizDataJson] = useState('');

    const generateQuizFromPDF = async (uri) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(blob);
            });

            // STRICT PROMPT: Ensure correctAnswer matches an option string exactly
            const prompt = `Extract 10 multiple-choice questions. 
            Format the response as a raw JSON array ONLY.
            Example: [{"questionNumber": 1, "question": "What is X?", "options": ["A", "B"], "correctAnswer": "A"}]
            IMPORTANT: Do not include letters like 'A.' inside the options array values.`;

            const aiResponse = await axios.post(GEMINI_URL, {
                contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "application/pdf", data: base64Data } }] }]
            });

            const rawText = aiResponse.data.candidates[0].content.parts[0].text;
            return rawText.replace(/```json|```/g, "").trim();
        } catch (error) {
            console.error("AI Error:", error.message);
            return null;
        }
    };

    const handleSaveTask = async () => {
        if (!title.trim()) return Alert.alert('Error', 'Title is required');
        setSaving(true);

        try {
            let finalQuiz = quizDataJson;
            let uploadedUrl = '';

            if (pdfFile && !quizDataJson) {
                const aiResult = await generateQuizFromPDF(pdfFile.uri);
                if (aiResult) finalQuiz = aiResult;
            }

            if (pdfFile) {
                const cleanUri = Platform.OS === 'android' ? pdfFile.uri : pdfFile.uri.replace('file://', '');
                const formData = new FormData();
                formData.append('file', { uri: cleanUri, type: 'application/pdf', name: pdfFile.name || 'upload.pdf' });
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const cloudRes = await axios.post(CLOUDINARY_RAW_URL, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedUrl = cloudRes.data.secure_url;
            }

            await addDoc(collection(db, 'tasks'), {
                userId: auth.currentUser.uid,
                title: title.trim(),
                description: description.trim(),
                dueDate: dueDate || 'No due date',
                priority,
                emoji: selectedEmoji,
                completed: false,
                createdAt: serverTimestamp(),
                pdfUrl: uploadedUrl,
                pdfName: pdfFile?.name || '',
                quizDataJson: finalQuiz,
                hasAttachment: !!pdfFile
            });

            navigation.goBack();
        } catch (error) {
            Alert.alert('Save Failed', error.message);
        } finally { setSaving(false); }
    };

    return (
        <KeyboardAvoidingView style={tw`flex-1 bg-purple-50`} behavior="padding">
            <ScrollView contentContainerStyle={tw`p-6`}>
                <CustomText style={tw`text-2xl font-bold mb-6`}>New Task</CustomText>
                <TextInput style={tw`bg-white p-4 rounded-2xl mb-4 shadow-sm`} placeholder="Title" value={title} onChangeText={setTitle} />
                
                <TouchableOpacity 
                    onPress={async () => {
                        const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
                        if (!res.canceled) setPdfFile(res.assets[0]);
                    }}
                    style={tw`bg-white p-8 rounded-2xl border-2 border-dashed border-purple-300 items-center mb-6`}
                >
                    <Ionicons name="document-attach" size={32} color="#9333EA" />
                    <CustomText style={tw`mt-2`}>{pdfFile ? pdfFile.name : 'Upload PDF'}</CustomText>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleSaveTask} disabled={saving} style={tw`bg-purple-600 p-4 rounded-2xl items-center`}>
                    {saving ? <ActivityIndicator color="#fff" /> : <CustomText style={tw`text-white font-bold`}>Create Task</CustomText>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}