import React from "react";
import { View, Text, TouchableOpacity, Image, Animated } from "react-native";
import { icons } from "../constants";
import { useGlobalContext } from "../context/GlobalProvider";
import tw from "tailwind-react-native-classnames";

const CustomTabBar = ({ selectedTab, setSelectedTab, setShowSidebar }) => {
  const tabs = [
    { label: "Personal Details", icon: icons.profile },
    { label: "Documents", icon: icons.bookmark },
    { label: "Your Vehicles", icon: icons.home },
   // { label: "Insurance", icon: icons.plus },
    { label: "Claims", icon: icons.play },
  ];


  const { user, setUser, setIsLogged } = useGlobalContext();

  return (
    <View
      style={{
        backgroundColor: "#1a1a1a", // Dark background
        flex: 1,
        paddingVertical: 20,
        paddingHorizontal: 10,
      }}
    >
      
      {tabs.map((tab, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            setSelectedTab(tab.label);
            setShowSidebar(false); // Close sidebar when a tab is selected
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 12,
            paddingHorizontal: 15,
            marginVertical: 5,
            backgroundColor: selectedTab === tab.label ? "#007bff" : "transparent",
            borderRadius: 8,
            marginHorizontal: 5,
            transform: [
              {
                scale: selectedTab === tab.label ? 1.02 : 1, // Slight scale effect for active tab
              },
            ],
          }}
          activeOpacity={0.7}
        >
          <Image
            source={tab.icon}
            style={{
              width: 24,
              height: 24,
              tintColor: selectedTab === tab.label ? "#fff" : "#888",
              marginRight: 12,
            }}
            resizeMode="contain"
          />
          <Text
            style={{
              color: selectedTab === tab.label ? "#fff" : "#888",
              fontSize: 16,
              fontWeight: selectedTab === tab.label ? "600" : "500",
              fontFamily: "Inter-Medium", // Use a modern font
            }}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default CustomTabBar;