import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

const { width } = Dimensions.get("window");

const ORIGINAL_DATA = [
  {
    id: "hero",
    isFullImageBanner: true,
    image: require("../../../assets/images/hero_banner.jpeg"),
    duration: 10000,
  },
  {
    id: "0",
    tagline: "Pure. Fresh. Healthy.",
    title: "SITARAM DAIRY",
    subtitle: "Goodness in every drop.",
    badge: "SUBSCRIBE NOW",
    action: "/plan/curate",
    image: {
      uri: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80",
    },
    duration: 5000,
  },
  {
    id: "1",
    tagline: "HEALTHY & TASTY",
    title: "Premium Butter",
    subtitle: "Only bulk orders are available.",
    badge: "Order: 015213049",
    image: require("../../../assets/images/butter.webp"),
    duration: 5000,
  },
  {
    id: "2",
    tagline: "MADE FROM PURE MILK",
    title: "Premium Ice Cream",
    subtitle: "Only bulk orders are available.",
    badge: "Order: 015213049",
    image: require("../../../assets/images/icecream.webp"),
    duration: 5000,
  },
];

// Double the data to create the illusion of an infinite forward loop
const CAROUSEL_DATA = [...ORIGINAL_DATA, ...ORIGINAL_DATA];

export default function HeroBanner() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const duration = CAROUSEL_DATA[currentIndex]?.duration || 5000;
    const timer = setTimeout(() => {
      // Calculate next index
      const nextIndex =
        currentIndex === CAROUSEL_DATA.length - 1 ? 0 : currentIndex + 1;

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });

      setCurrentIndex(nextIndex);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => {
        if (item.action) {
          router.push(item.action as any);
        }
      }}
      style={styles.carouselItemContainer}
    >
      {item.isFullImageBanner ? (
        <View style={[styles.bannerContainer, { padding: 0, backgroundColor: 'transparent' }]}>
          <Image
            source={item.image}
            style={{ width: '100%', height: '100%', borderRadius: RADIUS.large }}
            contentFit="cover"
          />
        </View>
      ) : (
        <View style={styles.bannerContainer}>
          <View style={styles.textContainer}>
            <Text style={styles.tagline}>{item.tagline}</Text>
            <Text style={styles.brandTitle}>{item.title}</Text>
            <Text style={styles.subText}>{item.subtitle}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          </View>
          {Platform.OS === "web" ? (
            <img
              src={item.image.uri || item.image}
              alt={item.title}
              loading="lazy"
              style={{
                position: "absolute",
                right: -10,
                bottom: -5,
                width: 140,
                height: 140,
                objectFit: "contain",
                zIndex: 1,
              }}
            />
          ) : (
            <Image
              source={item.image}
              style={styles.bannerImage}
              contentFit="contain"
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={CAROUSEL_DATA}
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      getItemLayout={(data, index) => ({
        length: width,
        offset: width * index,
        index,
      })}
    />
  );
}

const styles = StyleSheet.create({
  carouselItemContainer: { width: width },
  bannerContainer: {
    backgroundColor: COLORS.bannerBg || "#F8F1E5",
    borderRadius: RADIUS.large,
    marginHorizontal: SPACING.m,
    marginTop: SPACING.m,
    padding: SPACING.m,
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 140,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    zIndex: 2,
    paddingRight: 100,
  },
  tagline: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: "800",
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },
  subText: { fontSize: 10, color: COLORS.textSecondary, marginBottom: 10 },
  badge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.small,
    alignSelf: "flex-start",
  },
  badgeText: { color: "#FFF", fontSize: 9, fontWeight: "900" },
  bannerImage: {
    position: "absolute",
    right: -10,
    bottom: -5,
    width: 140,
    height: 140,
    zIndex: 1,
  },
});
