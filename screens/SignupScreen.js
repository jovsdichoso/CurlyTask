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
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import CustomText from '../components/CustomText';
import tw from 'twrnc';

export default function SignupScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [course, setCourse] = useState('');
    const [hobbies, setHobbies] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const validatePassword = (pass) => {
        const hasUpperCase = /[A-Z]/.test(pass);
        const hasLowerCase = /[a-z]/.test(pass);
        const hasNumber = /[0-9]/.test(pass);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
        const hasMinLength = pass.length >= 8;

        return {
            hasUpperCase,
            hasLowerCase,
            hasNumber,
            hasSpecialChar,
            hasMinLength,
            isStrong: hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasMinLength,
        };
    };

    const passwordStrength = validatePassword(password);
    const showValidation = password.length > 0;

    const onSignup = async () => {
        if (!email || !password || !confirmPassword || !username) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!passwordStrength.isStrong) {
            Alert.alert('Weak Password', 'Please create a strong password meeting all requirements');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: username
            });

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: email,
                username: username,
                course: course || '',
                hobbies: hobbies || '',
                createdAt: new Date().toISOString(),
                emailVerified: false
            });

            await sendEmailVerification(user);
            await auth.signOut();

            Alert.alert(
                'Verification Email Sent',
                `Welcome ${username}! Please check your email and verify your account before logging in.`,
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Login')
                    }
                ]
            );
        } catch (error) {
            let errorMessage = 'Failed to create account';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'This email is already registered';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Email/password accounts are not enabled';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak';
                    break;
                default:
                    errorMessage = error.message;
            }

            Alert.alert('Signup Error', errorMessage);
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
                <View style={tw`absolute w-40 h-40 bg-[#5A7863] rounded-full opacity-6 -top-8 -left-12`} />
                <View style={tw`absolute w-30 h-30 bg-[#90AB8B] rounded-full opacity-6 top-[40%] -right-10`} />
                <View style={tw`absolute w-35 h-35 bg-[#3B4953] rounded-full opacity-6 bottom-15 left-[30%]`} />
            </View>

            <ScrollView
                contentContainerStyle={tw`flex-grow`}
                showsVerticalScrollIndicator={false}
            >
                <View style={tw`px-8 pt-12 pb-10 z-10`}>
                    <View style={tw`items-center mb-8`}>
                        <Image
                            source={require('../assets/icon.png')}
                            style={tw`w-18 h-18 mb-5`}
                            resizeMode="contain"
                        />
                        <CustomText weight="bold" style={tw`text-3xl text-[#3B4953] mb-2`}>
                            Create Account
                        </CustomText>
                        <CustomText weight="regular" style={tw`text-base text-[#5A7863] text-center`}>
                            Join us and start organizing
                        </CustomText>
                    </View>

                    <View style={tw`mb-5`}>
                        {/* Username Field */}
                        <View style={tw`mb-4`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Username <CustomText style={tw`text-red-500 text-sm`}>*</CustomText>
                            </CustomText>
                            <TextInput
                                style={tw`bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-3.5 text-[#3B4953] text-base shadow-sm`}
                                value={username}
                                onChangeText={setUsername}
                                placeholder="Your display name"
                                placeholderTextColor="#90AB8B"
                                editable={!loading}
                            />
                        </View>

                        {/* Email Field */}
                        <View style={tw`mb-4`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Email <CustomText style={tw`text-red-500 text-sm`}>*</CustomText>
                            </CustomText>
                            <TextInput
                                style={tw`bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-3.5 text-[#3B4953] text-base shadow-sm`}
                                value={email}
                                onChangeText={setEmail}
                                placeholder="you@example.com"
                                placeholderTextColor="#90AB8B"
                                autoCapitalize="none"
                                keyboardType="email-address"
                                editable={!loading}
                            />
                        </View>

                        {/* Course Field */}
                        <View style={tw`mb-4`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Course <CustomText style={tw`text-[#90AB8B] text-xs`}>(optional)</CustomText>
                            </CustomText>
                            <TextInput
                                style={tw`bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-3.5 text-[#3B4953] text-base shadow-sm`}
                                value={course}
                                onChangeText={setCourse}
                                placeholder="e.g., Computer Science"
                                placeholderTextColor="#90AB8B"
                                editable={!loading}
                            />
                        </View>

                        {/* Hobbies Field */}
                        <View style={tw`mb-4`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Hobbies <CustomText style={tw`text-[#90AB8B] text-xs`}>(optional)</CustomText>
                            </CustomText>
                            <TextInput
                                style={tw`bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-3.5 text-[#3B4953] text-base shadow-sm`}
                                value={hobbies}
                                onChangeText={setHobbies}
                                placeholder="e.g., Reading, Coding, Music"
                                placeholderTextColor="#90AB8B"
                                editable={!loading}
                            />
                        </View>

                        {/* Password Field */}
                        <View style={tw`mb-4`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Password <CustomText style={tw`text-red-500 text-sm`}>*</CustomText>
                            </CustomText>
                            <View style={tw`relative flex-row items-center`}>
                                <TextInput
                                    style={tw`flex-1 bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-3.5 pr-12 text-[#3B4953] text-base shadow-sm`}
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

                            {/* Password Strength Indicator */}
                            {showValidation && (
                                <View style={tw`mt-3 px-1`}>
                                    <ValidationItem text="At least 8 characters" valid={passwordStrength.hasMinLength} />
                                    <ValidationItem text="One uppercase letter" valid={passwordStrength.hasUpperCase} />
                                    <ValidationItem text="One lowercase letter" valid={passwordStrength.hasLowerCase} />
                                    <ValidationItem text="One number" valid={passwordStrength.hasNumber} />
                                    <ValidationItem text="One special character" valid={passwordStrength.hasSpecialChar} />
                                </View>
                            )}
                        </View>

                        {/* Confirm Password Field */}
                        <View style={tw`mb-4`}>
                            <CustomText weight="medium" style={tw`text-[#3B4953] text-sm mb-2`}>
                                Confirm Password <CustomText style={tw`text-red-500 text-sm`}>*</CustomText>
                            </CustomText>
                            <View style={tw`relative flex-row items-center`}>
                                <TextInput
                                    style={tw`flex-1 bg-white border-[1.5px] border-[#90AB8B] rounded-2xl px-4.5 py-3.5 pr-12 text-[#3B4953] text-base shadow-sm`}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="••••••••"
                                    placeholderTextColor="#90AB8B"
                                    secureTextEntry={!showConfirmPassword}
                                    editable={!loading}
                                />
                                <TouchableOpacity
                                    style={tw`absolute right-4 p-1`}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                                        size={22}
                                        color="#5A7863"
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={tw`bg-[#5A7863] py-4 rounded-full items-center shadow-lg mt-5 ${loading ? 'opacity-60' : ''}`}
                            onPress={onSignup}
                            activeOpacity={0.8}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#EBF4DD" />
                            ) : (
                                <CustomText weight="semibold" style={tw`text-[#EBF4DD] text-base tracking-wide`}>
                                    Create account
                                </CustomText>
                            )}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        style={tw`items-center mt-6`}
                        disabled={loading}
                    >
                        <CustomText weight="regular" style={tw`text-[#5A7863] text-sm`}>
                            Already have an account?{' '}
                            <CustomText weight="semibold" style={tw`text-[#3B4953]`}>
                                Log in
                            </CustomText>
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Validation Item Component
const ValidationItem = ({ text, valid }) => (
    <View style={tw`flex-row items-center mb-1.5`}>
        <Ionicons
            name={valid ? 'checkmark-circle' : 'close-circle-outline'}
            size={16}
            color={valid ? '#5A7863' : '#90AB8B'}
        />
        <CustomText
            weight="regular"
            style={tw`ml-2 text-xs ${valid ? 'text-[#5A7863]' : 'text-[#90AB8B]'}`}
        >
            {text}
        </CustomText>
    </View>
);
