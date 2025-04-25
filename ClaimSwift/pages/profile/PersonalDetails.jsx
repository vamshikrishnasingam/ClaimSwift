import {
    View, Text, TextInput, TouchableOpacity, FlatList, Alert, Keyboard, ActivityIndicator
} from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { useGlobalContext } from "../../context/GlobalProvider";
import { fetchUserDetails, updateUsername, getCarDetails } from '../../lib/appwrite';
import { MaterialIcons } from '@expo/vector-icons';
import tw from 'tailwind-react-native-classnames';
import Claims from '../insurance/Claims'
const PersonalDetails = () => {
    const { user, setUser } = useGlobalContext();
    const [username, setUsername] = useState(user?.username || '');
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null); // Reference for the TextInput
    const [cars, setCars] = useState([]); // State to store the list of cars

    // Fetch car details when the component mounts
    useEffect(() => {
        if (user?.$id) {
            fetchCars();
        }
    }, [user?.$id]);
    useEffect(() => {
        if (isEditing) {
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 100); // Delay to ensure component is fully rendered
        }
    }, [isEditing]);

    // Fetch car details for the current user
    const fetchCars = async () => {
        try {
            const carDetails = await getCarDetails(user.$id); // Fetch cars for the current user
            setCars(carDetails);
        } catch (error) {
            console.error("Error fetching cars:", error);
        }
    };

    const handleUpdateUsername = async () => {
        try {
            const userDetails = await fetchUserDetails(user.$id);
            setUser(userDetails);
            setUsername(userDetails.username);
        } catch (error) {
            console.error("Failed to fetch user details:", error);
            Alert.alert("Error", "Failed to fetch user details");
        }
        if (!username.trim()) {
            Alert.alert("Error", "Username cannot be empty");
            return;
        }

        setLoading(true);
        try {
            const updatedUser = await updateUsername(user.$id, username);
            setUser(updatedUser);
            Alert.alert("Success", "Username updated successfully");
            setIsEditing(false);
            Keyboard.dismiss();
        } catch (error) {
            console.error("Failed to update username:", error);
            Alert.alert("Error", "Failed to update username");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={tw`p-3 bg-gray-900 flex-1`}>
            {/* Header */}
            <View >
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-3xl font-bold text-white p-3 tracking-wide">
                        👤 Your Profile
                    </Text>
                </View>

                {/* User Details Card */}
                <View
                    style={{
                        backgroundColor: "#1E293B", // Dark theme
                        padding: 20,
                        borderRadius: 12,
                        elevation: 5, // Android shadow
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.2,
                        shadowRadius: 5,
                    }}
                    className=" w-full p-5"
                >
                    {/* Section Title */}
                    <Text className="text-2xl font-bold text-gray-100 mb-4">
                        📄 User Details
                    </Text>

                    {/* Email Field */}
                    <View className="mb-6">
                        <Text className="text-xl font-medium text-gray-400">📧  Email</Text>
                        <Text className="text-xl text-gray-100 mt-1">{user?.email}</Text>
                    </View>

                    {/* Username Field */}
                    <View className="mb-6">
                        <Text className="text-xl font-medium text-gray-400">👤 Username</Text>
                        {isEditing ? (
                            <View style={tw`flex-row items-center mt-2 border border-gray-600 rounded-lg p-2 bg-gray-700`}>
                                <TextInput
                                    ref={inputRef}
                                    style={tw`flex-1 text-white text-base`}
                                    value={username}
                                    placeholder="Enter your username"
                                    placeholderTextColor="#7b7b8b"
                                    onChangeText={setUsername}
                                    onSubmitEditing={handleUpdateUsername}
                                />
                                <TouchableOpacity
                                    style={tw`bg-blue-500 px-3 py-1.5 rounded-lg ml-2`}
                                    onPress={handleUpdateUsername}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={tw`text-white font-bold`}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={tw`flex-row items-center justify-between mt-2`}>
                                <Text className="text-xl text-gray-100 mt-1">{username}</Text>
                                <TouchableOpacity
                                    style={tw`bg-blue-600 px-4 py-2 rounded-lg flex-row items-center`}
                                    onPress={() => setIsEditing(true)}
                                >
                                    <MaterialIcons name="edit" size={20} color="white" />
                                    <Text style={tw`text-white font-bold ml-2`}>Edit</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </View>
            {/* Display List of Cars */}
            <View>
                {/* Title */}
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-3xl font-bold text-white pt-5 tracking-wide">
                        🚗 Your Cars
                    </Text>
                </View>

                {/* Car List */}
                <FlatList
                    data={cars}
                    keyExtractor={(item) => item.$id}
                    renderItem={({ item }) => (
                        <View
                            className="w-full rounded-xl overflow-hidden shadow-lg mb-6"
                            style={{
                                backgroundColor: "#1E293B", // Dark background
                                padding: 15,
                                elevation: 5, // Android shadow
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                            }}
                        >
                            {/* Car Header */}
                            <View className="flex-row items-center justify-between">
                                <Text className="text-xl font-semibold text-white">
                                    {item.Brand}
                                </Text>
                                <MaterialIcons
                                    name="directions-car"
                                    size={26}
                                    color="#FFA001"
                                />
                            </View>

                            {/* Car Model & Number */}
                            <View className="mt-3">
                                <Text className="text-lg text-gray-300 font-medium">
                                    {item.Model}
                                </Text>
                                <Text
                                    className="text-base text-gray-400 mt-1"
                                    style={{
                                        backgroundColor: "#374151",
                                        paddingVertical: 5,
                                        paddingHorizontal: 10,
                                        borderRadius: 8,
                                        alignSelf: "flex-start",
                                    }}
                                >
                                    🔢 {item.car_number}
                                </Text>
                            </View>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text className="text-gray-100 text-center mt-6 text-lg">
                            🚘 No cars added yet.
                        </Text>
                    }
                />
            </View>
            <Claims/>
        </View>
    );
};

export default PersonalDetails;
