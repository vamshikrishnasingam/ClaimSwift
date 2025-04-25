import {
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { useRef, useEffect, useState } from "react";
import * as Animatable from "react-native-animatable";
import { icons } from "../constants";
import { ResizeMode, Video } from "expo-av";

const zoomIn = {
  0: {
    scale: 0.9,
  },
  1: {
    scale: 1.1,
  },
};
const zoomOut = {
  0: {
    scale: 1,
  },
  1: {
    scale: 0.9,
  },
};
const TrendingItem = ({ activeItem, item }) => {
  const [play, setPlay] = useState(false);
  const videoRef = useRef(null);
  const [useNativeControls, setUseNativeControls] = useState(true);
  useEffect(() => {
    return () => setUseNativeControls(false);
  }, []);

  return (
    <Animatable.View
      className="mr-5 p-3"
      animation={activeItem == item.$id ? zoomIn : zoomOut}
      duration={500}
    >
      {play ? (
        <Video
          ref={videoRef}
          source={{
            uri: item.video,
          }}
          style={{
            width: 208,
            height: 288,
            borderRadius: 35,
            marginTop: 12,
            backgroundColor: "rgba(255,255,255,0.1)",
          }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={useNativeControls}
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
          className="relative justify-center items-center"
          activeOpacity={0.7}
          onPress={() => setPlay(true)}
        >
          <ImageBackground
            source={{ uri: item.thumbnail }}
            className="w-52 h-72 rounded-[40px] my-4 overflow-hidden shadow-lg shadow-black/50"
            resizeMode="cover"
            style={{
              width: 208,
              height: 288,
              borderRadius: 40,
              overflow: "hidden",
              marginTop: 12,
              shadowColor: "rgba(0, 0, 0, 0.5)",
              shadowOpacity: 0.7,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 5,
            }}
          />
          <Image
            source={icons.play}
            className="w-12 h-12 absolute"
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}
    </Animatable.View>
  );
};
const Trending = ({ posts }) => {
  const [activeItem, setActiveItem] = useState(posts[0]);

  const viewableItemsChanged = ({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveItem(viewableItems[0].key);
    }
  };
  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.$id}
      renderItem={({ item }) => (
        <TrendingItem activeItem={activeItem} item={item} />
      )}
      onViewableItemsChanged={viewableItemsChanged}
      viewabilityConfig={{
        itemVisiblePercentThreshold: 70,
      }}
      contentOffset={{ x: 170 }}
      horizontal
    />
  );
};

export default Trending;
