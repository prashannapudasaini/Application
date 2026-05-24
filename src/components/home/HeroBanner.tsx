import { Image, StyleSheet, Text, View } from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

export default function HeroBanner() {
  return (
    <View style={styles.bannerContainer}>
      {/* Left Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.tagline}>Pure. Fresh. Healthy.</Text>
        <Text style={styles.brandTitle}>SITARAM DAIRY</Text>
        <Text style={styles.subText}>Goodness in every drop.</Text>

        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>UP TO 20% OFF</Text>
        </View>
      </View>

      {/* Right Side Image Placeholder */}
      {/* Note: We use a placeholder URL here. Once you have the actual transparent PNG of the dairy products, you will replace this URI. */}
      <Image
        source={{
          uri: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80",
        }}
        style={styles.bannerImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: COLORS.bannerBg,
    borderRadius: RADIUS.large,
    marginHorizontal: SPACING.m,
    marginTop: SPACING.m,
    padding: SPACING.m,
    flexDirection: "row",
    overflow: "hidden", // Keeps the image inside the rounded corners
    minHeight: 140,
    position: "relative",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    zIndex: 2, // Keeps text above the image
    paddingRight: 60, // Space for the image
  },
  tagline: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "700",
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 12,
  },
  discountBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: RADIUS.small,
    alignSelf: "flex-start",
  },
  discountText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bannerImage: {
    position: "absolute",
    right: -20,
    bottom: -10,
    width: 140,
    height: 140,
    borderRadius: 70, // Making the placeholder round so it looks nice until you add the real PNG
    opacity: 0.9,
  },
});
