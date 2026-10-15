import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

interface SkeletonProps {
  style?: ViewStyle;
}

export function SkeletonBox({ style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          backgroundColor: "#E0E0E0",
          borderRadius: RADIUS.medium,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ProductSkeleton() {
  return (
    <View style={styles.cardContainer}>
      {/* Image Skeleton */}
      <SkeletonBox style={{ width: "100%", height: 120, borderRadius: RADIUS.medium, marginBottom: 12 }} />
      
      {/* Title Skeleton */}
      <SkeletonBox style={{ width: "80%", height: 16, marginBottom: 8 }} />
      <SkeletonBox style={{ width: "60%", height: 16, marginBottom: 16 }} />
      
      {/* Price and Button Skeleton */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <SkeletonBox style={{ width: "30%", height: 18 }} />
        <SkeletonBox style={{ width: 36, height: 36, borderRadius: RADIUS.full }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.large,
    padding: SPACING.s,
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
