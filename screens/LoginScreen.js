import React, { useState } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const onLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            if (!userCredential.user.emailVerified) {
                await auth.signOut();
                Alert.alert(
                    'Email Not Verified',
                    'Please verify your email before logging in. Check your inbox for the verification link.',
                    [
                        {
                            text: 'Resend Email',
                            onPress: async () => {
                                try {
                                    await sendEmailVerification(userCredential.user);
                                    Alert.alert('Success', 'Verification email sent!');
                                } catch (error) {
                                    Alert.alert('Error', 'Failed to send verification email');
                                }
                            }
                        },
                        { text: 'OK' }
                    ]
                );
                return;
            }
        } catch (error) {
            let errorMessage = 'Failed to log in';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password';
                    break;
            }

            Alert.alert('Login Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={tw`flex-1 bg-[#EBF4DD]`}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Background Pattern */}
            <View style={tw`absolute w-full h-full overflow-hidden`}>
                <View style={tw`absolute w-45 h-45 bg-[#5A7863] rounded-full opacity-6 -top-10 -right-15`} />
                <View style={tw`absolute w-35 h-35 bg-[#90AB8B] rounded-full opacity-6 bottom-25 -left-12`} />
            </View>

            <ScrollView
                contentContainerStyle={tw`flex-grow`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`flex-1 px-8 pt-15 pb-10 z-10`}>
                    <View style={tw`items-center mb-12`}>
                        <Image
                            source={require('../assets/icon.png')}
                            style={tw`w-18 h-18 mb-5`}
                            resizeMode="contain"
                        />
                        <CustomText weight="bold" style={tw`text-3xl text-[#3B4953] mb-2`}>
                            Welcome back
                        </CustomText>
                        <CustomText weight="regular" style={tw`text-base text-[#5A7863] text-center`}>
                            Log in to continue your journey
                        </CustomText>
                    </View>

                    <View style={tw`mb-6`}>
                        <View style={tw`mb-5`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Email
                            </CustomText>
                            <TextInput
                                style={tw`bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-4 text-[#3B4953] text-base shadow-sm`}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor="#90AB8B"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                            />
                        </View>

                        <View style={tw`mb-5`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Password
                            </CustomText>
                            <View style={tw`relative flex-row items-center`}>
                                <TextInput
                                    style={tw`flex-1 bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-4 pr-12 text-[#3B4953] text-base shadow-sm`}
                                    value={password}
                                    onChangeText={setPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="#90AB8B"
                                    secureTextEntry={!showPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={tw`absolute right-4 p-1`}
                                    onPress={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={22}
                                        color="#5A7863"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={tw`bg-[#5A7863] py-4 rounded-full items-center shadow-lg mt-3 ${loading ? 'opacity-60' : ''}`}
                            onPress={onLogin}
                            activeOpacity={0.8}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#EBF4DD" />
                            ) : (
                                <CustomText weight="semibold" style={tw`text-[#EBF4DD] text-base tracking-wide`}>
                                    Continue
                                </CustomText>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Signup')}
                        style={tw`items-center mt-4`}
                        disabled={loading}
                    >
                        <CustomText weight="regular" style={tw`text-[#5A7863] text-sm`}>
                            New to CurlyTask?{' '}
                            <CustomText weight="semibold" style={tw`text-[#3B4953]`}>
                                Sign up
                            </CustomText>
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
