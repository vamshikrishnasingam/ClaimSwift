import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, Image, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import {} from "react-native-safe-area-context";
import { images } from "../constants";
import CustomButton from "../components/CustomButton";
import { useGlobalContext } from "../context/GlobalProvider";

const RootLayout = () => {
  const { loading, isLogged } = useGlobalContext();

  if (!loading && isLogged) return <Redirect href="/home" />;
  return (
    <SafeAreaView className="bg-primary h-full p-4">
      <ScrollView>
        <View className="w-full justify-center items-center min-h-[85vh] px-4">
          <Image
            source={images.logo}
            className="w-[130px] h-[84px]"
            resizeMode="contain"
          />
          <Image
            source={images.cards}
            className="max-w-[380px] w-full h-[300px]"
            resizeMode="contain"
          />

          <View className="relative mt-5">
            <Text className="text-3xl font-bold text-white text-center">
              Discover Your Endless Possibilities with{" "}
              <Text className="text-secondary-200">ClaimSwift</Text>
            </Text>
            <Image
              source={images.path}
              className="w-[136px] h-[15px] absolute -bottom-3 -right-8"
              resizeMode="contain"
            />
          </View>
          <Text className="text-xl text-pregular text-gray-100 mt-7 text-center">
            Empowering quick resolutions for every driver. Insurance,
            simplified.
          </Text>
          <CustomButton
            title="Continue with Email"
            handlePress={() => router.push("/sign-in")}
            containerStyles="w-full mt-7"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RootLayout;
