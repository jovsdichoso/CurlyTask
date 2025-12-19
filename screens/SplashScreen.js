import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Image } from 'react-native';
import CustomText from '../components/CustomText';
import tw from 'twrnc';

export default function SplashScreen({ navigation }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;
    const buttonOpacity = useRef(new Animated.Value(0)).current;
    const iconScale = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 20,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.spring(iconScale, {
                    toValue: 1,
                    tension: 15,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(buttonOpacity, {
                toValue: 1,
                duration: 500,
                delay: 200,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <View style={tw`flex-1 bg-[#EBF4DD]`}>
            <View style={tw`flex-1 justify-between items-center px-8 pt-[40%] pb-20`}>
                <Animated.View
                    style={[
                        tw`items-center`,
                        { opacity, transform: [{ translateY }] },
                    ]}
                >
                    <Animated.Image
                        source={require('../assets/icon.png')}
                        style={[
                            tw`w-30 h-30 mb-6`,
                            { transform: [{ scale: iconScale }] },
                        ]}
                        resizeMode="contain"
                    />
                    <CustomText weight="bold" style={tw`text-5xl text-[#3B4953] -tracking-wider mb-3`}>
                        CurlyTask
                    </CustomText>
                    <CustomText weight="regular" style={tw`text-base text-[#5A7863] tracking-wide`}>
                        Organize beautifully
                    </CustomText>
                </Animated.View>

                <Animated.View style={{ opacity: buttonOpacity }}>
                    <TouchableOpacity
                        style={tw`bg-[#5A7863] py-4.5 px-12 rounded-full shadow-lg`}
                        onPress={() => navigation.replace('AuthChoice')}
                        activeOpacity={0.8}
                    >
                        <CustomText weight="semibold" style={tw`text-[#EBF4DD] text-base tracking-wide`}>
                            Get Started
                        </CustomText>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </View>
    );
}
