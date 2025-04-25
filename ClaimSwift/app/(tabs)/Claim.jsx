import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Modal,
} from "react-native";
import { ID } from "react-native-appwrite";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import { RefreshControl } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import tw from "tailwind-react-native-classnames";
import Display from "../../components/Display";
import { useGlobalContext } from "../../context/GlobalProvider";
import { checkCarinDatabase, createClaimDocument, uploadFileToStorage } from "../../lib/appwrite";
import { useNavigation } from '@react-navigation/native';
import { Link, router } from "expo-router";

const Claim = () => {

  const { user, setUser, setIsLogged } = useGlobalContext();
  const navigation = useNavigation();
  const [hasPermission, setHasPermission] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bestFrame, setBestFrame] = useState(null); // Store the best frame data
  const [refreshing, setRefreshing] = useState(false);
  const [carName, setCarName] = useState("");
  const [carModel, setCarModel] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [showEstimate, setShowEstimate] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [show, setShow] = useState(true)
  const [message, setMessage] = useState(null)
  const [notDetected, setNotDetected] = useState(false)
  const [isInDatabase, setIsInDatabase] = useState(false);
  const [checkingDatabase, setCheckingDatabase] = useState(false);
  const [fieldsDisabled, setFieldsDisabled] = useState(false); // Disable input fields
  const [showUploadSection, setShowUploadSection] = useState(false)
  const [video, setVideo] = useState(null);
  const videoRef = useRef(null);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      setHasPermission(
        cameraPermission.status === "granted" &&
        mediaPermission.status === "granted"
      );
    })();
  }, []);

  // Refresh functionality
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch(); // Define the refetch function if you need to fetch data again
    setRefreshing(false);
  };

  // Capture video from camera
  const captureVideo = async () => {
    if (hasPermission) {
      const video = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
      if (!video.canceled && video.assets && video.assets.length > 0) {
        setVideo(video)
        setVideoUri(video.assets[0].uri);
      }
    } else {
      Alert.alert(
        "Permission required",
        "Camera and media permissions are needed."
      );
    }
  };

  const refetch = () => {
    // Reset all states to simulate a refresh
    setShow(true)
    setVideoUri(null);
    setBestFrame(null);
    setShowEstimate(false);
    setFieldsDisabled(false)
    setShowUploadSection(false)
    setIsInDatabase(false)
    setCarName("");
    setCarModel("");
    setCarNumber("")
    setVideo(null)
    setMessage(null)
  };

  // Select video from gallery
  const selectVideoFromGallery = async () => {
    if (hasPermission) {
      const video = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
      if (!video.canceled && video.assets && video.assets.length > 0) {
        setVideoUri(video.assets[0].uri);
        setVideo(video)
      }
    } else {
      Alert.alert(
        "Permission required",
        "Camera and media permissions are needed."
      );
    }
  };

  // Remove video
  const removeVideo = () => {
    setVideoUri(null);
    setBestFrame(null);
    setShowEstimate(false);
    setVideo(null)
    setIsInDatabase(false)
  };

  // Upload video to Flask server
  const uploadVideo = async () => {
    if (!isInDatabase) {
      Alert.alert("Error", "Please verify car details in the database first.");
      return;
    }
    if (!videoUri || !carName || !carModel || !carNumber) {
      Alert.alert("Error", "Please upload a video and provide car details.");
      return;
    }
    try {
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "Video file does not exist");
        return;
      }
      const formData = new FormData();
      formData.append("video", {
        uri: videoUri,
        type: "video/mp4",
        name: "video.mp4",
      });
      formData.append("car_name", carName);
      formData.append("car_model", carModel);
      formData.append("car_number", carNumber);
      setLoading(true);
      const response = await axios.post("http://10.100.2.239:5000/upload_video",
        formData, {  headers: { "Content-Type": "multipart/form-data",},} );
      if (response.data.message) {
        setMessage(response.data.message);
      }
      if (response.data.best_frame) {
        setBestFrame(response.data.best_frame);
        console.log(response.data.best_frame)
        setMessage(response.data.message);
        setNotDetected(false);
        setShowEstimate(true);
        setShow(false);
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      Alert.alert("Upload Failed", "There was an error uploading the video.");
    } finally {
      setLoading(false);
    }
  };

  //check car details in database
  const checkInDatabase = async () => {
    if (!carName || !carModel || !carNumber) {
      Alert.alert("Error", "Please fill in all car details.");
      return;
    }

    try {
      setCheckingDatabase(true);
      console.log(user.$id)
      const carDetails = await checkCarinDatabase(user.$id, carNumber); // Fetch cars for the current user
      if (carDetails) {
        setIsInDatabase(true);
        setFieldsDisabled(true);
        setShowUploadSection(true);
        Alert.alert("Success", "Car details found in the database.");
      } else {
        setIsInDatabase(false);
        setFieldsDisabled(false); // Ensure fields are not disabled
        Alert.alert("Error", "Invalid details. Car not found in the database.");
      }
    } catch (error) {
      console.error("Error checking database:", error);
      Alert.alert("Error", "There was an error checking the database.");
    } finally {
      setCheckingDatabase(false);
    }
  };
  // Calculate total cost from part prices
  const totalCost = bestFrame
    ? Object.values(bestFrame.part_prices).reduce((sum, part) => sum + part.total, 0)
    : 0;



  const handleProceedRequestForClaim = async () => {
    if (!videoUri || !bestFrame) {
      Alert.alert("Error", "Please upload a video and ensure damage details are available.");
      return;
    }

    try {
      setLoading(true);
      const claimData = {
        claim_id: ID.unique(), // Auto-generate unique ID
        users: user.$id, // Associate claim with user
        Car_Brand: carName,
        Car_Model: carModel,
        car_number: carNumber,
        price_details: JSON.stringify(bestFrame.part_prices), // Store JSON as a string
        total_price: totalCost.toString(), // Store as a number (not string)
      };
      await createClaimDocument(claimData);
      // Show an alert
      Alert.alert(
        "Confirmation",
        "Are you sure you want to proceed with the claim?",
        [
          {
            text: "Cancel",
            onPress: () => setLoading(false), // Re-enable the button if canceled
            style: "cancel"
          },
          {
            text: "OK",
            onPress: () => {
              // Simulate a successful submission (e.g., API call)
              setTimeout(() => {
                // Show success prompt
                Alert.alert(
                  "Success",
                  "Claim request submitted successfully.",
                  [
                    {
                      text: "OK",
                      onPress: () => {
                        // Navigate to the "YourClaims" page
                        navigation.navigate('YourClaims');
                      }
                    }
                  ]
                );
              }, 1000); // Simulate a delay for API call or processing
            }
          }
        ]
      );
    } catch (error) {
      console.error("❌ Error submitting claim request:", error);
      Alert.alert("Error", "There was an error submitting the claim request.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to convert Base64 to File
  const base64ToFile = (base64String, filename) => {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const file = new Blob([byteArray], { type: "image/jpeg" }); // Convert to Blob
    return new File([file], filename, { type: "image/jpeg" }); // Convert to File
  };



  // const handleProceedRequestForClaim = async () => {
  //   if (!videoUri || !bestFrame) {
  //     Alert.alert("Error", "Please upload a video and ensure damage details are available.");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     // Transform price_details into the required format
  //     const priceDetails = Object.entries(bestFrame.part_prices).map(([part, details]) => ({
  //       part,
  //       price: details.price.toString(),
  //       total: details.total.toString(),
  //       repair_or_replace: details.repair_or_replace,
  //     }));

  //     // Prepare claim data
  //     const claimData = {
  //       claim_id: ID.unique(), // Randomly generated claim ID
  //       users: user.$id, // Associate claim with the current user
  //       Car_Brand: carName,
  //       Car_Model: carModel,
  //       car_number: carNumber,
  //       total_price: totalCost.toString(),
  //     };

  //     // Store claim data in Appwrite Database
  //     await createClaimDocument(claimData);

  //     Alert.alert("Success", "Claim request submitted successfully.");
  //   } catch (error) {
  //     console.error("Error submitting claim request:", error);
  //     Alert.alert("Error", "There was an error submitting the claim request.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="" style={tw`bg-opacity-95 rounded-lg p-5`}>
          <Display />
          <View>
            <TextInput
              style={tw`w-100 border border-gray-300 rounded-lg p-3 mb-4 bg-white shadow-sm`}
              placeholder="Enter Car Name"
              placeholderTextColor="#6b7280"
              value={carName}
              onChangeText={setCarName}
              editable={!fieldsDisabled} // Disable if fieldsDisabled is true
            />

            <TextInput
              style={tw`q-100 border border-gray-300 rounded-lg p-3 mb-4 bg-white shadow-sm`}
              placeholder="Enter Car Model"
              placeholderTextColor="#6b7280"
              value={carModel}
              onChangeText={setCarModel}
              editable={!fieldsDisabled} // Disable if fieldsDisabled is true
            />

            <TextInput
              style={tw`q-100 border border-gray-300 rounded-lg p-3 mb-4 bg-white shadow-sm`}
              placeholder="Enter Car Number"
              placeholderTextColor="#6b7280"
              value={carNumber}
              onChangeText={setCarNumber}
              editable={!fieldsDisabled} // Disable if fieldsDisabled is true
            />

            <TouchableOpacity
              style={tw`bg-blue-500 rounded-lg py-3 px-6 items-center shadow-lg mb-4 ${fieldsDisabled ? "opacity-50" : ""
                }`}
              onPress={checkInDatabase} // Change onPress based on state
              disabled={checkingDatabase || (isInDatabase && fieldsDisabled)} // Disable only if checking or details are found
            >
              <Text className="text-lg text-white font-psemibold">
                {checkingDatabase
                  ? "Checking..."
                  : isInDatabase
                    ? "Proceed to Upload Video"
                    : "Check in Database"}
              </Text>
            </TouchableOpacity>
          </View>

          {(videoUri && show) ? (
            <View>
              <View className="flex-row gap-4 justify-between">
                <TouchableOpacity
                  style={tw`bg-blue-500 rounded-lg py-5 px-5 items-center shadow-lg`}
                  onPress={captureVideo}
                >
                  <Text className="text-lg text-white font-psemibold">
                    Capture Again
                  </Text>
                </TouchableOpacity>
                <Text className="text-2xl mt-6 text-center text-gray-100 font-pmedium">
                  Or
                </Text>
                <TouchableOpacity
                  style={tw`bg-blue-500 rounded-lg py-5 px-5 items-center shadow-lg`}
                  onPress={selectVideoFromGallery}
                >
                  <Text className="text-lg text-white font-psemibold">
                    Upload Again
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xl pt-10 text-gray-100 font-pmedium">
                Selected Video:
              </Text>
              <Video
                source={{ uri: videoUri }}
                ref={videoRef}
                style={{
                  width: "100%",
                  height: 250,
                  borderRadius: 15,
                  marginTop: 12,
                  backgroundColor: "rgba(255,255,255,0.1)",
                }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                onLoad={() => videoRef.current.playAsync()}
              />
              <View className="flex-row justify-between gap-3 mt-3">
                <TouchableOpacity
                  style={tw`bg-red-500 rounded-lg py-3 px-6 items-center shadow-lg`}
                  onPress={removeVideo}
                >
                  <Text className="text-lg text-white font-psemibold">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-green-500 rounded-lg py-3 px-6 items-center shadow-lg`}
                  onPress={uploadVideo}
                  disabled={loading || !isInDatabase}
                >
                  <Text className="text-lg text-white font-psemibold">
                    Upload Video
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            (show && showUploadSection) && (
              <View>
                <Text className="text-xl py-4 mx-1 text-gray-100 font-pmedium">
                  Upload Video
                </Text>
                <TouchableOpacity onPress={selectVideoFromGallery}>
                  <View className="w-full h-[220px] bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center shadow-lg">
                    <View className="w-14 h-14 border border-dashed border-secondary-200 rounded-xl flex justify-center items-center">
                      <FontAwesome name="cloud-upload" size={30} color="#2980b9" />
                    </View>
                  </View>
                </TouchableOpacity>
                <Text className="text-2xl mt-10 mb-8 mx-1 text-center text-gray-100 font-pmedium">
                  Or
                </Text>
                <Text className="text-xl pb-4 mx-1 text-gray-100 font-pmedium">
                  Capture Video
                </Text>
                <TouchableOpacity onPress={captureVideo}>
                  <View className="w-full h-[220px] bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center shadow-lg">
                    <View className="w-14 h-14 border border-dashed rounded-xl border-secondary-200 flex justify-center items-center">
                      <FontAwesome name="camera" size={30} color="#2980b9" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )
          )}

          {loading && <ActivityIndicator size="large" color="#6200ee" />}

          {(showEstimate && bestFrame) ? (
            <View className="w-full">
              <Text className="text-2xl font-bold text-center text-white m-4 p-3">
                {message}
              </Text>
              <Text className="text-xl pt-10 text-gray-100 font-pmedium"> Selected Video:</Text>
              <Video
                source={{ uri: videoUri }} ref={videoRef} resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay={false}
                onLoad={() => videoRef.current.playAsync()}
              />
              <Text className="text-2xl font-bold text-center text-white m-4 p-3">
                Quotation for Damage Recovery
              </Text>

              {/* Masked Damage Image */}
              <Text className="text-xl font-bold text-center text-white mb-4">
                Masked Damage Image
              </Text>
              <Image
                source={{ uri: `data:image/jpeg;base64,${bestFrame.masked_image}` }}
                className="w-72 h-40 rounded-lg mb-4 mx-auto"
              />


              {/* Detected Parts Image */}
              <Text className="text-xl font-bold text-center text-white mb-4">
                Detected Parts Image
              </Text>
              <Image
                source={{ uri: `data:image/jpeg;base64,${bestFrame.frame}` }}
                className="w-72 h-40 rounded-lg mb-4 mx-auto"
              />

              {/* Display Part Prices */}
              <Text className="text-xl font-bold text-center border-2 border-blue-500 bg-blue-500 text-white m-4 p-3 rounded-lg shadow-lg">
                Estimated Repair Prices
              </Text>

              <View style={tw`border border-gray-300 rounded-lg mb-6 bg-white shadow-sm`}>
                <View style={tw`flex-row bg-gray-200 p-2 rounded-t-lg`}>
                  <Text style={tw`flex-1 text-center font-bold`}>Part Name</Text>
                  <Text style={tw`flex-1 text-center font-bold`}>Price per Part ($)</Text>
                  <Text style={tw`flex-1 text-center font-bold`}>Total Price ($)</Text>
                  <Text style={tw`flex-1 text-center font-bold`}>Action</Text>
                </View>
                {Object.entries(bestFrame.part_prices).map(([part, details]) => (
                  <View key={part} style={tw`flex-row p-2 border-t border-gray-300`}>
                    <Text style={tw`flex-1 text-center`}>{part}</Text>
                    <Text style={tw`flex-1 text-center`}>{details.price}</Text>
                    <Text style={tw`flex-1 text-center`}>{details.total}</Text>
                    <Text style={tw`flex-1 text-center`}>{details.repair_or_replace}</Text>
                  </View>
                ))}
              </View>

              {/* Display Total Cost */}
              <Text className="text-xl font-bold text-center text-white mb-4">
                Total Estimated Price: ₹{totalCost}
              </Text>
              <TouchableOpacity
                style={tw`bg-green-500 rounded-lg py-3 px-6 items-center shadow-lg mb-4 ${loading ? "opacity-50" : ""
                  }`}
                onPress={handleProceedRequestForClaim}
                disabled={loading || !videoUri || !bestFrame}
              >
                <Text className="text-lg text-white font-psemibold">
                  {loading ? "Submitting..." : "Proceed Request for Claim"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text className="text-2xl font-bold text-center text-white m-4 p-3">
              {message}
            </Text>
          )}

          {/* Fullscreen Modal for Image Preview */}
          <Modal visible={modalVisible} transparent={true} animationType="fade">
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.9)",
                justifyContent: "center",
                alignItems: "center",
              }}
              activeOpacity={1}
              onPress={() => setModalVisible(false)}
            >
              {selectedImage && (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                  style={{ width: "90%", height: "80%", resizeMode: "contain" }}
                />
              )}
            </TouchableOpacity>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Claim;