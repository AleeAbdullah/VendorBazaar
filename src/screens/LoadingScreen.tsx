import { View, Image, Text } from "react-native";
import React from "react";
import Svg, { Path } from "react-native-svg";
import Spinner from "../components/spinner";
import { StatusBar } from "expo-status-bar";

const LoadingScreen = () => {
  return (
    <View className="w-screen h-screen flex items-center justify-center bg-primary relative ">
      <StatusBar style="light" backgroundColor="#000" />
      <Image
        source={require("@/assets/images/loading.png")}
        className="absolute top-0 w-full h-full"
      />
      <View className="h-[120px] items-center mb-12">
        <Text className="text-hero font-MuseoModerno_SemiBold leading-none text-white ">
          SAFE BUY
        </Text>
        <Text className="text-hero font-MuseoModerno_SemiBold leading-none text-white ">
          AFRICA
        </Text>
      </View>

      <View className=" items-center justify-center h-[100px] mt-6">
        <Spinner size={50} />
      </View>
    </View>
  );
};

export default LoadingScreen;
