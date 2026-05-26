import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Dimensions, Easing } from "react-native";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function SplashScreen() {
  const router = useRouter();
  
  // 🔥 Both definitions are strictly mapped and verified here
  const milkDropY = useRef(new Animated.Value(0)).current; 
  const brandingOpacity = useRef(new Animated.Value(1)).current; 

  useEffect(() => {
    // 1. Droplet animation starts from y=0 down to center bounds
    Animated.timing(milkDropY, {
      toValue: height * 0.40, 
      duration: 1200,
      easing: Easing.bezier(0.25, 1, 0.5, 1), 
      useNativeDriver: true,
    }).start();

    // 2. Fade out branding before transition
    const fadeTimer = setTimeout(() => {
      Animated.timing(brandingOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 2500);

    // 3. Move to Login page after 3 seconds total
    const transitionTimer = setTimeout(() => {
      router.replace("/auth/login");
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(transitionTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      
      {/* 🥛 Animated Milk Droplet */}
      <Animated.View style={[styles.droplet, { transform: [{ translateY: milkDropY }] }]} />

      {/* 🔴 RED BASE BRANDING */}
      <Animated.View style={[styles.brandingContainer, { opacity: brandingOpacity }]}>
        <View style={styles.emblemCircle} />
        <Text style={styles.brandText}>SITARAM</Text>
        <Text style={styles.brandTagline}>PURE DAIRY</Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#800000", 
    justifyContent: 'center',   
    alignItems: 'center' 
  },
  brandingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  emblemCircle: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    borderWidth: 2, 
    borderColor: "rgba(255,255,255,0.25)", 
    backgroundColor: "rgba(255,255,255,0.05)", 
    marginBottom: 20 
  },
  brandText: { 
    fontSize: 36, 
    fontWeight: "300", 
    color: "#FFFFFF", 
    letterSpacing: 5, 
    textAlign: "center" 
  },
  brandTagline: { 
    fontSize: 11, 
    fontWeight: "600", 
    color: "rgba(255,255,255,0.5)", 
    letterSpacing: 6, 
    textAlign: "center", 
    marginTop: 10 
  },
  droplet: {
    position: "absolute",
    left: width * 0.5 - 12,
    top: 10, 
    width: 24,
    height: 32,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    zIndex: 99, 
  },
});