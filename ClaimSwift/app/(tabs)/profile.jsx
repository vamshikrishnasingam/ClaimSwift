import {
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGlobalContext } from "../../context/GlobalProvider";
import EmptyState from "../../components/EmptyState";
import { getUserPosts, signOut } from "../../lib/appwrite";
import useAppWrite from "../../lib/useAppWrite";
import VideoCard from "../../components/VideoCard";
import InfoBox from "../../components/InfoBox";
import { icons } from "../../constants";
import { router } from "expo-router";
import CustomTabBar from "../../components/CustomTabBar";
import PersonalDetails from "../../pages/profile/PersonalDetails";
import YourCarDetails from "../../pages/profile/YourCarDetails";
import YourDocuments from "../../pages/documents/YourDocuments";
import Claims from "../../pages/insurance/Claims";
import tw from "tailwind-react-native-classnames";

const { width, height } = Dimensions.get("window"); // Get screen dimensions

const Profile = () => {
  const { user, setUser, setIsLogged } = useGlobalContext();
  const { data: posts, refetch } = useAppWrite(() => getUserPosts(user.$id));
  const [selectedTab, setSelectedTab] = useState("Personal Details");
  const [refreshing, setRefreshing] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // State to control sidebar visibility

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const logout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            await signOut();
            setUser(null);
            setIsLogged(false);
            router.replace("/sign-in");
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderContent = () => {
    switch (selectedTab) {
      case "Personal Details":
        return <PersonalDetails />;
      case "Documents":
        return <YourDocuments />
      case "Your Vehicles":
        return <YourCarDetails />;
      case "Insurance":
        return <Text style={{ padding: 10 }}>Insurance Content</Text>;
      case "Claims":
        return <Claims />
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="bg-gray-900 h-full">
      {/* Header Section */}
      <View className="flex-row justify-between items-center p-3 px-5 bg-primary" style={{
        borderBottomWidth: 2,
        borderBottomColor: "#FFA001",
      }}>
        {/* Sidebar Toggle Button */}
        <TouchableOpacity onPress={() => setShowSidebar(!showSidebar)} className="flex-row items-center">
          <View
            className="w-12 h-12 border rounded-lg justify-center items-center bg-gray-800"
            style={{
              borderWidth: 2,
              borderColor: "white", // Brighter border for visibility
              shadowColor: "white", // Optional glow effect
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.8,
              shadowRadius: 3,
            }}
          >
            <Image
              source={icons?.sidebar}
              resizeMode="contain"
              className="w-8 h-8"
              style={{
                tintColor: "white", // Brightens the icon
                opacity: 0.9, // Slightly boosts visibility
              }}
            />
          </View>
        </TouchableOpacity>

        {/* Username and Member Info */}
        <TouchableOpacity className="flex-row items-center">
          <InfoBox
            title={user?.username}
            subtitle="Member"
            containerStyles="m-2"
            textStyles="text-xl"
          />
        </TouchableOpacity>
        {/* Logout Button */}
        <TouchableOpacity onPress={logout} className="flex-row items-center">
          <Image
            source={icons.logout}
            resizeMode="contain"
            className="w-7 h-7"
          />
        </TouchableOpacity>
      </View>

      {/* Sidebar */}
      {showSidebar && (
        <SafeAreaView
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: width * 0.7, // 70% of screen width
            height: height, // Full screen height
            backgroundColor: "#161622",
            zIndex: 10, // Ensure it appears above other content
            shadowColor: "#000",
            shadowOffset: { width: 2, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 5,
            elevation: 10,
          }}
        >
          {/* Vertical Line (Divider) */}
          <View
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 1, // Line thickness
              backgroundColor: "#161622",
            }}
          />
          <View className="w-full">
            {/* Header Section */}
            <View className="p-4"
              style={{
                borderBottomWidth: 2,
                borderBottomColor: "#FFA001",
              }}>
              <Text style={tw`text-xl font-bold text-white`}>{user?.username || "User"}</Text>
              <Text style={tw`text-sm text-gray-400`}>{user?.email || "user@example.com"}</Text>
            </View>
          </View>
          <CustomTabBar
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            setShowSidebar={setShowSidebar} // Pass function to close sidebar on tab selection
          />
        </SafeAreaView>
      )}

      {/* Overlay to close sidebar when clicking outside */}
      {showSidebar && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: width * 0.7, // Start from the right edge of the sidebar
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent overlay
            zIndex: 5, // Below the sidebar but above other content
          }}
          onPress={() => setShowSidebar(false)} // Close sidebar when overlay is pressed
          activeOpacity={1}
        />
      )}

      {/* Main Content */}
      <FlatList
        ListHeaderComponent={() => (
          <View className="w-full">{renderContent()}</View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
};

export default Profile;