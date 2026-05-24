import { Feather } from "@expo/vector-icons"; // Added Feather import
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { API_ENDPOINTS, getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

const PASTEL_COLORS = ["#E8F5E9", "#FFF9E6", "#FFF0E6", "#F3E5F5", "#F0F8FF"];

interface Category {
  id: string;
  name: string;
  image: string;
}

export default function CategoryRow() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center", height: 100 },
        ]}
      >
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
          // Changed to undefined to prevent the Chrome empty string error
          const cleanImageUrl = cat.image ? cat.image.trim() : undefined;

          return (
            <Pressable
              key={cat.id}
              style={styles.categoryCard}
              android_ripple={{ color: "rgba(0,0,0,0.05)", radius: 35 }}
              onPress={() =>
                router.push({
                  pathname: `/product/${cat.id}`,
                  params: { title: cat.name },
                })
              }
            >
              <View
                style={[styles.iconContainer, { backgroundColor: bgColor }]}
              >
                {/* Safe Fallback Logic */}
                {!cleanImageUrl ? (
                  <Feather
                    name="grid"
                    size={24}
                    color={COLORS.primary}
                    opacity={0.5}
                  />
                ) : Platform.OS === "web" ? (
                  <img
                    src={cleanImageUrl}
                    alt={cat.name}
                    style={{ width: 40, height: 40, objectFit: "contain" }}
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                ) : (
                  <Image
                    source={{ uri: cleanImageUrl }}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                  />
                )}
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
  scrollPadding: { paddingHorizontal: SPACING.m, gap: SPACING.l },
  categoryCard: { alignItems: "center", width: 68 },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: RADIUS.round,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACING.s,
    textAlign: "center",
  },
});
