import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ScrollView, SafeAreaView, RefreshControl } from "react-native";
import { fetchUserClaims } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import { MaterialIcons } from "@expo/vector-icons";
import tw from "tailwind-react-native-classnames";

const YourClaims = () => {
  const { user } = useGlobalContext();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Fetch claims function
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const userClaims = await fetchUserClaims(user.$id);
      setClaims(userClaims);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh Functionality
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchClaims();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const renderClaimItem = ({ item }) => {
    const statusColors = {
      Approved: "bg-green-600",
      Rejected: "bg-red-600",
      Pending: "bg-yellow-600",
    };

    return (
      <TouchableOpacity
        onPress={() => setSelectedClaim(item)}
        style={tw`bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-700 my-2`}
      >
        <View style={tw`flex-row justify-between items-center`}>
          <View>
            <Text style={tw`text-lg font-bold text-white`}>Claim ID</Text>
            <Text style={tw`text-sm text-gray-400 mt-1`}>{item.claim_id}</Text>
            <Text style={tw`text-sm text-gray-400 mt-1`}>
              Car: {item.Car_Brand} - {item.Car_Model}
            </Text>
          </View>
          <View style={tw`px-3 py-1 rounded-full ${statusColors[item.status] || "bg-gray-600"}`}>
            <Text style={tw`text-sm text-white font-semibold`}>{item.status || "Pending"}</Text>
          </View>
        </View>

        {/* Car Details */}
        <View style={tw`mt-3`}>
          <Text style={tw`text-gray-400 text-sm`}>🔢 Number: {item.car_number}</Text>
          <Text style={tw`text-gray-400 text-sm`}>💰 Price: ₹{item.total_price}</Text>
        </View>

        {/* Small Right Arrow Indicator */}
        <MaterialIcons
          name="keyboard-arrow-right"
          size={30}
          color="#bbb"
          style={tw`absolute bottom-2 right-2 opacity-75`}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-black`}>
        <Text style={tw`text-white text-lg`}>Loading claims...</Text>
      </View>
    );
  }

  if (selectedClaim) {
    // Render Claim Details
    const claim = selectedClaim;
    const priceDetails = JSON.parse(claim.price_details);
    return (
      <SafeAreaView style={tw`flex-1 bg-gray-900 pt-14`}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => setSelectedClaim(null)} style={tw`flex-row items-center p-2`}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
          <Text style={tw`text-lg font-semibold text-white ml-2`}>Back to Claim Details</Text>
        </TouchableOpacity>

        <ScrollView
          style={tw`flex-1`}
          contentContainerStyle={tw`flex-grow min-h-full p-4`}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Claim Details */}
          <View style={tw`bg-gray-800 p-5 rounded-2xl shadow-md border border-gray-800`}>
            <Text style={tw`text-2xl font-bold text-white mb-4`}>Claim Details</Text>
            <Text style={tw`text-gray-400`}>Claim ID: <Text style={tw`text-white`}>{claim.claim_id}</Text></Text>
            <Text style={tw`text-gray-400`}>Car: <Text style={tw`text-white`}>{claim.Car_Brand} {claim.Car_Model}</Text></Text>
            <Text style={tw`text-gray-400`}>Car Number: <Text style={tw`text-white`}>{claim.car_number}</Text></Text>
            <Text style={tw`text-gray-400`}>Total Price: <Text style={tw`text-white`}>₹{claim.total_price}</Text></Text>

            {/* Status Badge */}
            <View style={tw`mt-4`}>
              <View style={tw`px-3 py-1 rounded-full ${claim.status === "Approved" ? "bg-green-600" : claim.status === "Rejected" ? "bg-red-600" : "bg-yellow-600"}`}>
                <Text style={tw`text-white font-semibold`}>Status: {claim.status || "Pending"}</Text>
              </View>
            </View>
          </View>

          {/* Display Images */}
          <Text style={tw`text-lg font-bold text-white mt-6 p-2`}>Price Breakdown:</Text>
          <View style={tw`bg-gray-800 p-4 rounded-2xl shadow-md border border-gray-700`}>
            {/* Show Header Only If Data Exists */}
            {Object.keys(priceDetails).length > 0 && (
              <View style={tw`flex-row border-b border-gray-600 pb-2 mb-2`}>
                <Text style={tw`flex-1 text-white font-bold text-center`}>🛠 Part</Text>
                <Text style={tw`flex-1 text-white font-bold text-center`}>💰 Price</Text>
                <Text style={tw`flex-1 text-white font-bold text-center`}>💵 Total</Text>
                <Text style={tw`flex-1 text-white font-bold text-center`}>🔧 Action</Text>
              </View>
            )}

            {/* Table Rows */}
            {Object.entries(priceDetails).map(([partName, detail], index) => (
              <View key={index} style={tw`flex-row border-b border-gray-700 py-2`}>
                <Text style={tw`flex-1 text-gray-300 text-center`}>{partName}</Text>
                <Text style={tw`flex-1 text-gray-300 text-center`}>₹{detail.price}</Text>
                <Text style={tw`flex-1 text-gray-300 text-center`}>₹{detail.total}</Text>
                <Text style={tw`flex-1 text-gray-300 text-center capitalize`}>{detail.repair_or_replace}</Text>
              </View>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-900 pt-14`}>
      {/* Added Fixed Header */}
      <View style={tw`p-4 bg-gray-800 border-b border-gray-700`}>
        <Text style={tw`text-2xl font-bold text-white text-center`}>Your Claims</Text>
      </View>

      <FlatList
        data={claims}
        renderItem={renderClaimItem}
        keyExtractor={(item) => item.claim_id}
        contentContainerStyle={{ flexGrow: 1, padding: 10 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

export default YourClaims;
