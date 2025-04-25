import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import { RefreshControl } from "react-native";
import CustomButton from "../../components/CustomButton";
import { useRef } from "react";
import { Image } from "react-native";
import { icons, images } from "../../constants";

const DamageDetector = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [videoUri, setVideoUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [damageResults, setDamageResults] = useState(null);
  const [damageImages, setDamageImages] = useState(null); // Store images
  const [refreshing, setRefreshing] = useState(false);
  const videoRef = useRef(null);
  const [play, setPlay] = useState(false);
  const [labels, setLabels] = useState([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate the action you want to refresh (e.g., re-fetching data)
    await refetch(); // Define the refetch function if you need to fetch data again
    setRefreshing(false);
  };

  const refetch = () => {
    // Implement your data refresh logic here if needed (e.g., fetching data from an API).
    // In this case, we're just resetting the damage results to simulate a refresh.
    setVideoUri(null);
    setDamageResults(null);
    setLabels([]);
    setDamageImages([]); // Reset images on refresh
    // Alert.alert("Data Refreshed", "You can now upload a new video.");
  };

  useEffect(() => {
    (async () => {
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const mediaPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      setHasPermission(
        cameraPermission.status === "granted" &&
        mediaPermission.status === "granted"
      );
    })();
  }, []);

  const captureVideo = async () => {
    setVideoUri(null);
    setDamageResults(null);
    setLabels([]);
    setDamageImages([]);
    if (hasPermission) {
      const video = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
      if (!video.canceled && video.assets && video.assets.length > 0) {
        setVideoUri(video.assets[0].uri);
      }
    } else {
      Alert.alert(
        "Permission required",
        "Camera and media permissions are needed."
      );
    }
  };

  const selectVideoFromGallery = async () => {
    setVideoUri(null);
    setDamageResults(null);
    setLabels([]);
    setDamageImages([]);
    if (hasPermission) {
      const video = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      });
      if (!video.canceled && video.assets && video.assets.length > 0) {
        setVideoUri(video.assets[0].uri);
      }
    } else {
      Alert.alert(
        "Permission required",
        "Camera and media permissions are needed."
      );
    }
  };

  const removeVideo = () => {
    setVideoUri(null);
    setDamageResults(null);
    setLabels([]);
    setDamageImages([]);
  };

  const uploadVideo = async () => {
    setDamageResults(null);
    setLabels([]);
    setDamageImages([]);
    if (!videoUri) {
      Alert.alert(
        "No Video Selected",
        "Please select or capture a video to upload."
      );
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
        type: "video/mp4", // Ensure the video type matches the server's expected type
        name: "video.mp4",
      });

      setLoading(true);
      const response = await axios.post(
        "http://192.168.1.47:5000/upload_video",
        //"http://172.16.23.48:5000/upload_video", // Ensure this IP matches the Flask server IP
        //"http://192.168.0.109:5000/upload_video",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data.images || response.data.frames) {
        //setDamageResults(response.data.damage_info);
        setDamageImages(response.data.frames); // Set the images received
        //setDamageImages(response.data.images);
        setLabels(response.data.labels);
      } else {
        Alert.alert("Error", "No damage information received.");
      }
    } catch (error) {
      console.error("Error uploading video:", error);
      Alert.alert("Upload Failed", "There was an error uploading the video.");
    } finally {
      setLoading(false);
    }
  };
  // Debugging step: Log the damageImages to see if they are being set correctly
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    setLoadingImages(true);
    if (damageImages) {
      setLoadingImages(false);
    }
  }, [damageImages]);

  if (hasPermission === null) {
    return <Text>Requesting permissions...</Text>;
  }

  if (hasPermission === false) {
    return <Text>No access to camera and media library</Text>;
  }

  return (
    <SafeAreaView className="bg-primary h-full">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="flex-1 p-5">
          <Text className="text-3xl text-center font-psemibold text-white mt-3 mb-3">
            Damage Detection
          </Text>
          {videoUri ? (
            <View>
              <View className="flex-row gap-4 justify-between">
                <CustomButton
                  title="Capture Again"
                  handlePress={captureVideo}
                  containerStyles="w-[150px] mt-7"
                  textStyles="text-xl text-white text-psemibold"
                />
                <Text className="text-2xl mt-12 text-center text-gray-100 font-pmedium">
                  Or
                </Text>
                <CustomButton
                  title="Upload Again"
                  handlePress={selectVideoFromGallery}
                  containerStyles="w-[150px] mt-7"
                  textStyles="text-xl text-white text-psemibold"
                />
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
                shouldPlay={false} // Initially false
                onLoad={() => videoRef.current.playAsync()} // Start manually
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) {
                    setPlay(false);
                  }
                }}
              />
              <View className="flex-row justify-between gap-3 mt-3">
                <TouchableOpacity
                  className="p-4 w-[150px] justify-center items-center"
                  style={{
                    backgroundColor: "#d32f2f",
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    marginVertical: 10,
                    alignItems: "center",
                  }}
                  onPress={removeVideo}
                >
                  <Text className="text-lg text-white font-psemibold">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="p-4 w-[150px] min-h-[62px] justify-center items-center"
                  style={[
                    {
                      backgroundColor: "#6200ee",
                      borderRadius: 8,
                      marginVertical: 10,
                      alignItems: "center",
                    },
                    loading && {
                      backgroundColor: "#9e9e9e",
                    },
                  ]}
                  onPress={uploadVideo}
                  disabled={loading}
                >
                  <Text className="text-lg text-white font-psemibold">
                    Upload Video
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-xl py-4 mx-1 text-gray-100 font-pmedium">
                Upload Video
              </Text>

              <TouchableOpacity onPress={selectVideoFromGallery}>
                <View className="w-full h-[220px] bg-black-100 rounded-2xl border border-black-200  flex justify-center items-center">
                  <View className="w-14 h-14 border border-dashed border-secondary-200 rounded-xl flex justify-center items-center">
                    <Image
                      source={icons.upload}
                      resizeMode="contain"
                      alt="upload"
                      className="w-3/4 h-3/4"
                    />
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
                <View className="w-full h-[220px] bg-black-100 rounded-2xl border border-black-200 flex justify-center items-center">
                  <View className="w-14 h-14 border border-dashed rounded-xl border-secondary-200 flex justify-center items-center">
                    <Image
                      source={icons.play}
                      resizeMode="contain"
                      alt="upload"
                      className="w-3/4 h-3/4"
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
          {loading && <ActivityIndicator size="large" color="#6200ee" />}

          {damageResults && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsHeader}>Damage Results:</Text>
              {Object.keys(damageResults).map((side, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultSide}>{side.toUpperCase()}:</Text>
                  {Object.keys(damageResults[side]).map((part, partIndex) => (
                    <Text key={partIndex} style={styles.resultText}>
                      {part.charAt(0).toUpperCase() + part.slice(1)}:{" "}
                      {damageResults[side][part]}%
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          )}
          {damageImages && damageImages.length > 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* <ScrollView>
                {damageImages.map((frame, index) => (
                  <View key={index}>
                    <Text className="text-xl text-center font-psemibold text-white mt-3 mb-3">
                      Label: {labels[index]}
                    </Text>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${frame}` }}
                      style={{ width: 350, height: 200, marginBottom: 10 }}
                    />
                  </View>
                ))}
              </ScrollView> */}
              <ScrollView>
                {damageImages.map((frame, index) => (
                  <View key={index}>
                    <Text className="text-xl text-center font-psemibold text-white mt-3 mb-3">
                      Label: {labels[index]}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedImage(frame);
                        setModalVisible(true);
                      }}
                    >
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${frame}` }}
                        style={{
                          width: 350,
                          height: 200,
                          marginBottom: 10,
                          borderRadius: 10,
                          resizeMode: "contain",
                        }}
                      />
                    </TouchableOpacity>
                  </View>
                ))}

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
              </ScrollView>
            </View>
          ) : (
            <Text className="text-xl text-center font-psemibold text-white mt-3 mb-3">
              {/* No images available */}
            </Text>
          )}
        </View>
      </ScrollView>
      {/* <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        {damageImages && damageImages.length > 0 && (
          <FlatList
            data={damageImages}
            renderItem={({ item, index }) => (
              <View key={index}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${item}` }}
                  style={{ width: 200, height: 200 }}
                />
              </View>
            )}
            ListEmptyComponent={
              <View>
                <Text className="text-white">Hello</Text>
              </View>
            }
            keyExtractor={(item, index) => index.toString()}
          />
        )}
      </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cancelButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
    width: "40%",
  },
  resultsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#e0f7fa",
    borderRadius: 10,
  },
  resultsHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00796b",
    marginBottom: 10,
    textAlign: "center",
  },
  resultItem: {
    marginBottom: 10,
  },
  resultSide: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00796b",
  },
  resultText: {
    fontSize: 14,
    color: "#004d40",
  },
});

export default DamageDetector;
