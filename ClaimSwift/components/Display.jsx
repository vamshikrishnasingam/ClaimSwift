import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import tw from "tailwind-react-native-classnames";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const AnimatedIcon = Animated.createAnimatedComponent(FontAwesome);

const Claim = () => {
  // Animation values for each icon
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);

  // Animate icons on mount
  useEffect(() => {
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1, // Infinite loop
      true // Reverse animation
    );

    scale2.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500, delay: 200 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    scale3.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500, delay: 400 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  // Animated styles for each icon
  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
  }));

  return (
      <View style={tw`bg-white bg-opacity-95 border border-primary-3 rounded-lg p-4 mb-7`}>
        <Text style={tw`text-2xl font-bold text-center text-gray-800 mb-4`}>
          Smart Damage Detection Dashboard
        </Text>
        <Text style={tw`text-center text-gray-700 text-base mb-6`}>
          Welcome to our cutting-edge vehicle damage detection system. Powered by advanced Detectron2 AI technology,
          this tool revolutionizes the way we assess and estimate vehicle repairs.
        </Text>
        <View style={tw`flex-row justify-around mb-6`}>
          <View style={tw`items-center w-1/3`}>
            <AnimatedIcon
              name="tachometer"
              size={30}
              color="#3498db"
              style={[styles.icon, animatedStyle1]}
            />
            <Text style={tw`font-bold mt-2 text-gray-800`}>Fast Analysis</Text>
            <Text style={tw`text-center text-gray-600`}>Get results in seconds</Text>
          </View>
          <View style={tw`items-center w-1/3`}>
            <AnimatedIcon
              name="bullseye"
              size={30}
              color="#3498db"
              style={[styles.icon, animatedStyle2]}
            />
            <Text style={tw`font-bold mt-2 text-gray-800`}>High Accuracy</Text>
            <Text style={tw`text-center text-gray-600`}>Powered by Detectron2 AI</Text>
          </View>
          <View style={tw`items-center w-1/3`}>
            <AnimatedIcon
              name="dollar-sign"
              size={30}
              color="#3498db"
              style={[styles.icon, animatedStyle3]}
            />
            <Text style={tw`font-bold mt-2 text-gray-800`}>Cost Estimation</Text>
            <Text style={tw`text-center text-gray-600`}>Instant repair quotes</Text>
          </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginBottom: 10,
  },
});

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Claim />
    </GestureHandlerRootView>
  );
}