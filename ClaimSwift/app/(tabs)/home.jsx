import { StyleSheet, Text, View, Image, FlatList, TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { images } from "../../constants";
import SearchInput from "../../components/SearchInput";
import { useGlobalContext } from "../../context/GlobalProvider";
import Trending from "../../components/Trending";
import EmptyState from "../../components/EmptyState";
import { RefreshControl } from "react-native";
import { getAllPosts, getLastestPosts } from "../../lib/appwrite";
import useAppWrite from "../../lib/useAppWrite";
import VideoCard from "../../components/VideoCard";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

// Hero Section with Gradient
const HeroSection = () => {
  return (
    <View className="rounded-3xl p-2 mx-4 my-6">
      <Animated.Text
        className="text-5xl font-extrabold text-center text-white mb-4"
      >
        Revolutionizing Car Damage Assessment
      </Animated.Text>

      <Animated.Text
        className="text-lg text-gray-200 text-center px-6"
      >
        AI-powered technology for instant damage analysis and cost estimation.
      </Animated.Text>
    </View>
  );
};

// Features Section with Glassmorphism Cards
const FeaturesSection = () => {
  return (
    <View className="flex-row justify-center flex-wrap px-4">
      <FeatureCard
        icon="camera-alt"
        title="Instant Analysis"
        description="Upload a video and get results in seconds"
        color="#ff4757"
      />
      <FeatureCard
        icon="smart-toy"
        title="AI-Powered"
        description="Utilizing Detectron2 for precise damage detection"
        color="#1e90ff"
      />
      <FeatureCard
        icon="attach-money"
        title="Cost Estimation"
        description="Get accurate repair cost estimates instantly"
        color="#32cd32"
      />
    </View>
  );
};

// Feature Card with Glass Effect
const FeatureCard = ({ icon, title, description, color }) => (
  <Animated.View
    className="m-4 rounded-xl p-10 w-80 h-70 items-center shadow-lg"
    style={{
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      backdropFilter: "blur(10px)",
      borderWidth: 4,
      borderColor: "rgba(255, 255, 255, 0.2)",
    }}
  >
    <MaterialIcons name={icon} size={50} color={color} />
    <Text className="text-lg font-bold text-white mt-3">{title}</Text>
    <Text className="text-gray-300 text-sm text-center mt-2">{description}</Text>
  </Animated.View>
);

const Home = () => {
  const { user, setUser, setIsloggedIn } = useGlobalContext();
  const { data: posts, refetch } = useAppWrite(getAllPosts);
  const { data: latestPosts } = useAppWrite(getLastestPosts);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="bg-gray-800 h-full">
      {/* Fixed Header */}
      <View
        style={{
          backgroundColor:"#161622",
          paddingHorizontal: 16,
          paddingBottom: 4,
          borderBottomWidth: 1,
          borderBottomColor: "#333",
        }}
      >
        <View className="flex justify-between items-center flex-row">
          <View>
            <Text className="text-4xl font-extrabold text-white mt-2">
              ClaimSwift
            </Text>
            <Text className="font-medium text-xl text-gray-300 mt-1">
              Welcome Back, {user?.username}
            </Text>
          </View>

          <Image source={images.logoSmall} className="w-12 h-12" resizeMode="contain" />
        </View>

        <SearchInput />
      </View>

      {/* Scrollable Content */}
      <FlatList
        contentContainerStyle={{
          backgroundColor:"#161622",
          paddingBottom: 20, // Add padding at the bottom to avoid content being cut off
        }}
        ListHeaderComponent={() => (
          <View className="flex my-6 px-4 space-y-6">
            <HeroSection />
            <FeaturesSection />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </SafeAreaView>
  );
};

export default Home;