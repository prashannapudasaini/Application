import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_ENDPOINTS, getImageUrl } from "../../constants/api";
import { COLORS, SPACING } from "../../constants/theme";

const PASTEL_COLORS = ["#E8F5E9", "#FFF9E6", "#FFF0E6", "#F3E5F5", "#F0F8FF"];

interface Category {
  id: string;
  name: string;
  image: string;
}

// Fallback image generator
const getRelevantImageUrl = (categoryName: string): string => {
  const query = encodeURIComponent(`${categoryName} food`);
  return `https://source.unsplash.com/featured/80x80?${query}`;
};

export default function CategoryRow() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Used to track images that fail to load
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES);
      const json = await response.json();
      if (json.status === "success") {
        const mappedCats = json.data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name || item.title,
          image: getImageUrl(item.image),
        }));
        setCategories(mappedCats);
      }
    } catch (err) {
      console.error("Category Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingCenter]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
      >
        {categories.map((cat, index) => {
          const bgColor = PASTEL_COLORS[index % PASTEL_COLORS.length];

          // Determine which image to show
          const apiImage = cat.image?.trim();
          const hasFailed = failedImages[cat.id];
          const imageUrl =
            !hasFailed && apiImage ? apiImage : getRelevantImageUrl(cat.name);

          return (
            <Pressable
              key={cat.id}
              style={styles.categoryCard}
              android_ripple={{ color: "rgba(0,0,0,0.05)", radius: 35 }}
              onPress={() =>
                // 🔥 FIX: Correct routing to the Category Products screen we just built
                router.push({
                  pathname: `/category/[id]`,
                  params: { id: cat.id, name: cat.name },
                })
              }
            >
              <View
                style={[styles.iconContainer, { backgroundColor: bgColor }]}
              >
                {/* Clean, cross-platform Image component */}
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.categoryImage}
                  resizeMode="contain"
                  onError={() => {
                    // If the primary image fails, mark it so it falls back to Unsplash
                    setFailedImages((prev) => ({ ...prev, [cat.id]: true }));
                  }}
                />
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: SPACING.l },
  loadingCenter: {
    justifyContent: "center",
    alignItems: "center",
    height: 100,
  },
  scrollPadding: { paddingHorizontal: SPACING.m, gap: SPACING.l },

  categoryCard: { alignItems: "center", width: 68 },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34, // Exactly half of width/height for a perfect circle
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  categoryImage: {
    width: 40,
    height: 40,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1A1A1A", // Matches the new Sitaram text color
    marginTop: SPACING.s,
    textAlign: "center",
  },
});
