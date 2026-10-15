import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, Dimensions, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function ScanAndWinScreen() {
  const router = useRouter();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideYAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideYAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    ]).start();

    // Infinite pulsing animation for the gift icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Slow background rotation for visual flare
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });

  return (
    <View style={styles.masterContainer}>
      <LinearGradient colors={["#660000", "#800000"]} style={StyleSheet.absoluteFillObject} />

      {/* Decorative Background Elements */}
      <Animated.View style={[styles.glowBlob, { transform: [{ rotate }] }]} />

      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan & Win</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideYAnim }] }]}>
            
            <View style={styles.iconBackdrop}>
              <Animated.View style={[styles.giftIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                <LinearGradient colors={["#F6D365", "#FDA085"]} style={styles.iconGradient}>
                  <MaterialCommunityIcons name="gift-outline" size={80} color="#800000" />
                </LinearGradient>
              </Animated.View>
            </View>
            
            <Text style={styles.title}>WIN A GIFT HAMPER!</Text>
            <Text style={styles.subtitle}>
              1 Lucky Winner every 10 days! Find the barcode on any Sitaram Dairy product and scan it with your phone's camera to enter the lucky draw.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.stepsSection, { opacity: fadeAnim, transform: [{ translateY: slideYAnim }] }]}>
            <LinearGradient colors={["#FFFFFF", "#F9FAFB"]} style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>How to participate</Text>
              
              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepTitle}>Buy & Find</Text>
                  <Text style={styles.stepDescription}>Purchase any Sitaram Dairy product and locate the barcode.</Text>
                </View>
              </View>
              
              <View style={styles.stepLine} />

              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepTitle}>Scan with Camera</Text>
                  <Text style={styles.stepDescription}>Open your phone's native camera or scanner app and point it at the barcode.</Text>
                </View>
              </View>
              
              <View style={styles.stepLine} />

              <View style={styles.stepItem}>
                <View style={styles.stepNumberContainer}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepTitle}>Win Hampers!</Text>
                  <Text style={styles.stepDescription}>You are automatically entered. We announce 1 lucky winner every 10 days!</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: { flex: 1 },
  glowBlob: {
    position: "absolute",
    top: -height * 0.1,
    left: -width * 0.5,
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: "rgba(226, 178, 84, 0.08)",
  },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  backBtn: { 
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#FFF", textTransform: 'uppercase', letterSpacing: 2 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 10,
    paddingBottom: 60,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  iconBackdrop: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  giftIconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    shadowColor: "#F6D365",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 15,
  },
  iconGradient: {
    flex: 1,
    borderRadius: 65,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#E2B254",
    marginBottom: 16,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "500",
  },
  stepsSection: {
    paddingHorizontal: 20,
  },
  stepsCard: {
    borderRadius: 30,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
    elevation: 10,
  },
  stepsTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#800000",
    marginBottom: 30,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  stepNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2B254",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E2B254",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  stepNumber: {
    color: "#800000",
    fontWeight: "900",
    fontSize: 18,
  },
  stepTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#800000",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  stepLine: {
    width: 2,
    height: 30,
    backgroundColor: "rgba(128, 0, 0, 0.15)",
    marginLeft: 21,
    marginVertical: 4,
  }
});
