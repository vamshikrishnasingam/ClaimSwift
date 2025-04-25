import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, Modal, Alert } from "react-native";
import { addCarDetails, getCarDetails, deleteCarDetails, updateCarDetails } from "../../lib/appwrite";
import { useGlobalContext } from "../../context/GlobalProvider";
import FormField from "../../components/FormField";
import { MaterialIcons, Feather } from '@expo/vector-icons';

const YourCarDetails = () => {
    const { user } = useGlobalContext();
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [carNumber, setCarNumber] = useState("");
    const [cars, setCars] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);

    useEffect(() => {
        if (user?.$id) {
            fetchCars();
        }
    }, [user?.$id]);

    const fetchCars = async () => {
        try {
            const carDetails = await getCarDetails(user.$id);
            setCars(carDetails);
        } catch (error) {
            console.error("Error fetching cars:", error);
        }
    };

    const resetFormFields = () => {
        setBrand("");
        setModel("");
        setCarNumber("");
    };

    const handleAddCar = async () => {
        if (!brand || !model || !carNumber) {
            alert("Please fill all fields");
            return;
        }

        try {
            await addCarDetails(user.$id, brand, model, carNumber);
            alert("Car details added successfully!");
            resetFormFields();
            setIsModalVisible(false);
            fetchCars();
        } catch (error) {
            console.error("Error adding car details:", error);
            alert("Failed to add car details");
        }
    };

    const handleDeleteCar = async (carId) => {
        Alert.alert(
            "Delete Car",
            "Are you sure you want to delete this car?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: async () => {
                        try {
                            await deleteCarDetails(carId);
                            alert("Car deleted successfully!");
                            fetchCars();
                        } catch (error) {
                            console.error("Error deleting car:", error);
                            alert("Failed to delete car");
                        }
                    },
                },
            ]
        );
    };

    const handleEditCar = (car) => {
        setSelectedCar(car);
        setBrand(car.Brand);
        setModel(car.Model);
        setCarNumber(car.car_number);
        setIsEditModalVisible(true);
    };

    const handleUpdateCar = async () => {
        if (!brand || !model || !carNumber) {
            alert("Please fill all fields");
            return;
        }

        try {
            await updateCarDetails(selectedCar.$id, brand, model, carNumber);
            alert("Car details updated successfully!");
            setIsEditModalVisible(false);
            resetFormFields();
            fetchCars();
        } catch (error) {
            console.error("Error updating car details:", error);
            alert("Failed to update car details");
        }
    };

    return (
        <View className="flex-1 p-5">
            {/* Heading and Add Car Button */}
            <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-psemibold text-white">Your Cars</Text>
                <TouchableOpacity
                    className="bg-green-500 px-4 p-2 rounded-lg border-2 rounded-xl mr-2"
                    onPress={() => setIsModalVisible(true)}
                >
                    <Text className="text-white font-psemibold text-xl">Add Car</Text>
                </TouchableOpacity>
            </View>

            {/* Display List of Cars */}
            <FlatList
                data={cars}
                keyExtractor={(item) => item.$id}
                renderItem={({ item }) => (
                    <View
                        className="w-full rounded-xl overflow-hidden shadow-lg mb-6"
                        style={{
                            backgroundColor: "#1E293B",
                            padding: 15,
                            elevation: 5,
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
                            <Text className="text-lg text-gray-300 font-medium mb-2">
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

                        {/* Delete and Edit Buttons */}
                        <View className="flex-row justify-end mt-4 gap-4">
                            <TouchableOpacity
                                className="bg-red-500 px-4 py-2 rounded-lg"
                                onPress={() => handleDeleteCar(item.$id)}
                            >
                                {/* Delete Icon */}
                                <MaterialIcons name="delete" size={24} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-blue-500 px-4 py-2 rounded-lg"
                                onPress={() => handleEditCar(item)}
                            >
                                {/* Edit Icon */}
                                <Feather name="edit" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                ListEmptyComponent={
                    <Text className="text-gray-100 text-center mt-6 text-lg">
                        🚘 No cars added yet.
                    </Text>
                }
            />

            {/* Add Car Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setIsModalVisible(false);
                    resetFormFields();
                }}
            >
                <View className="flex-1 p-5 justify-center items-center bg-gray-500">
                    <View className="w-full rounded-xl p-5"
                        style={{
                            backgroundColor: "#161625",
                        }}>
                        <Text className="text-white text-2xl font-psemibold mb-6 text-center">
                            Add Car Details
                        </Text>

                        {/* Input Form */}
                        <FormField
                            title="Brand"
                            value={brand}
                            placeholder="Enter car brand"
                            handleChangeText={setBrand}
                            otherStyles="m-4"
                        />
                        <FormField
                            title="Model"
                            value={model}
                            placeholder="Enter car model"
                            handleChangeText={setModel}
                            otherStyles="m-4"
                        />
                        <FormField
                            title="Car Number"
                            value={carNumber}
                            placeholder="Enter car number"
                            handleChangeText={setCarNumber}
                            otherStyles="m-4"
                        />

                        {/* Add Car and Close Buttons */}
                        <View className="flex-row justify-between mt-6 gap-4">
                            <TouchableOpacity
                                className="flex-1 bg-red-500 p-3 rounded-xl"
                                onPress={() => {
                                    setIsModalVisible(false);
                                    resetFormFields();
                                }}
                            >
                                <Text className="text-white text-center font-psemibold text-lg">
                                    Close
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-green-500 p-3 rounded-xl ml-2"
                                onPress={handleAddCar}
                            >
                                <Text className="text-white text-center font-psemibold text-lg">
                                    Add Car
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Car Modal */}
            <Modal
                visible={isEditModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setIsEditModalVisible(false);
                    resetFormFields();
                }}
            >
                <View className="flex-1 p-4 justify-center items-center bg-gray-500">
                    <View className="w-full rounded-xl p-5"
                        style={{
                            backgroundColor: "#161625",
                        }}>
                        <Text className="text-white text-2xl font-psemibold mb-6 text-center">
                            Edit Car Details
                        </Text>

                        {/* Input Form */}
                        <FormField
                            title="Brand"
                            value={brand}
                            placeholder="Enter car brand"
                            handleChangeText={setBrand}
                            otherStyles="m-4"
                        />
                        <FormField
                            title="Model"
                            value={model}
                            placeholder="Enter car model"
                            handleChangeText={setModel}
                            otherStyles="m-4"
                        />
                        <FormField
                            title="Car Number"
                            value={carNumber}
                            placeholder="Enter car number"
                            handleChangeText={setCarNumber}
                            otherStyles="m-4"
                        />

                        {/* Update and Close Buttons */}
                        <View className="flex-row justify-between mt-6 gap-4">
                            <TouchableOpacity
                                className="flex-1 bg-red-500 p-3 rounded-xl"
                                onPress={() => {
                                    setIsEditModalVisible(false);
                                    resetFormFields();
                                }}
                            >
                                <Text className="text-white text-center font-psemibold text-lg">
                                    Close
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="flex-1 bg-green-500 p-3 rounded-xl ml-2"
                                onPress={handleUpdateCar}
                            >
                                <Text className="text-white text-center font-psemibold text-lg">
                                    Update
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default YourCarDetails;