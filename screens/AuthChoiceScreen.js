import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import CustomText from '../components/CustomText';
import tw from 'twrnc';

export default function AuthChoiceScreen({ navigation }) {
    return (
        <View style={tw`flex-1 bg-[#EBF4DD]`}>
            {/* Decorative Pattern - Background Circles */}
            <View style={tw`absolute w-full h-full overflow-hidden`}>
                <View style={tw`absolute w-50 h-50 bg-[#5A7863] rounded-full opacity-8 -top-12 -right-12`} />
                <View style={tw`absolute w-38 h-38 bg-[#90AB8B] rounded-full opacity-8 top-[30%] -left-19`} />
                <View style={tw`absolute w-30 h-30 bg-[#5A7863] rounded-full opacity-8 bottom-[20%] right-8`} />
                <View style={tw`absolute w-45 h-45 bg-[#3B4953] rounded-full opacity-8 -bottom-22 left-[20%]`} />
            </View>

            <View style={tw`flex-1 justify-between px-8 pt-[25%] pb-15 z-10`}>
                <View style={tw`items-center`}>
                    <Image
                        source={require('../assets/icon.png')}
                        style={tw`w-20 h-20 mb-6`}
                        resizeMode="contain"
                    />
                    <CustomText weight="bold" style={tw`text-3xl text-[#3B4953] mb-3 text-center`}>
                        Welcome to CurlyTask
                    </CustomText>
                    <CustomText weight="regular" style={tw`text-base text-[#5A7863] text-center`}>
                        Organize your tasks beautifully
                    </CustomText>
                </View>

                <View style={tw`gap-4`}>
                    <TouchableOpacity
                        style={tw`bg-[#5A7863] py-4.5 rounded-full items-center shadow-md`}
                        onPress={() => navigation.navigate('Signup')}
                        activeOpacity={0.8}
                    >
                        <CustomText weight="semibold" style={tw`text-[#EBF4DD] text-base tracking-wide`}>
                            Sign up
                        </CustomText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={tw`bg-[#90AB8B] py-4.5 rounded-full items-center shadow-md`}
                        onPress={() => navigation.navigate('Login')}
                        activeOpacity={0.8}
                    >
                        <CustomText weight="semibold" style={tw`text-[#3B4953] text-base tracking-wide`}>
                            Log in
                        </CustomText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}
