import { View, Text, Image } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { icons } from "../constants";
import { TouchableOpacity } from "react-native";
import { Video, ResizeMode } from "expo-av";

const VideoCard = ({
  video: {
    title,
    thumbnail,
    video,
    creator: { username, avatar },
  },
}) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);
  const [useNativeControls, setUseNativeControls] = useState(true);
  useEffect(() => {
    return () => setUseNativeControls(false);
  }, []);

  return (
    <View className="flex-col items-center px-4 mb-14">
      <View className="flex-row gap-3 items-start">
        <View className="justify-center items-center flex-row flex-1">
          <View className="w-[46px] h-[46px] rounded-lg border border-secondary justify-cente items-center p-0.5">
            <Image
              source={{ uri: avatar }}
              className="w-full h-full rounded-lg"
              resizeMode="cover"
            />
          </View>
          <View className="justify-center flex-1 ml-3 gap-y-1">
            <Text className="text-sm font-psemibold text-white">{title}</Text>
            <Text className="text-xs text-gray-100 font-pregular">
              {username}
            </Text>
          </View>
        </View>
        <View className="p-2">
          <Image source={icons.menu} className="w-5 h-5" resizeMode="contain" />
        </View>
      </View>
      {play ? (
        <Video
          source={{ uri: video }}
          ref={videoRef}
          style={{
            width: "100%",
            height: "50%",
            borderRadius: 20,
            overflow: "hidden",
            marginTop: 12,
            shadowColor: "rgba(33, 33, 33, 0.5)",
            shadowOpacity: 0.7,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 5,
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
      ) : (
        <TouchableOpacity
          className="w-full h-60 rounded-xl mt-3 justify-center items-center"
          activeOpacity={0.6}
          onPress={() => setPlay(true)}
        >
          <Image
            source={{ uri: thumbnail }}
            className="w-full h-full rounded-xl mt-3"
            resizeMode="cover"
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default VideoCard;
