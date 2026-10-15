import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import { API_ENDPOINTS } from "../../constants/api";
import { SPACING } from "../../constants/theme";
import { getCategoryVisual } from "../../constants/categoryIcons";
// Uses your configured Axios service for reliable cross-platform fetching
import api from "../../services/api";

interface Category {
  id: string;
  name: string;
}

const CATEGORY_THEMES: {
  [key: string]: { icon: any; bg: string; color: string };
} = {
  milk: { icon: "bottle-tonic-outline", bg: "#EAF4F4", color: "#008080" },
  lassi: { icon: "glass-tulip", bg: "#F4E9F5", color: "#8E44AD" },
  paneer: { icon: "cube-outline", bg: "#F4F6F6", color: "#7F8C8D" },
  ghee: { icon: "pot-outline", bg: "#FFF9E6", color: "#D4AF37" },
  curd: { icon: "bowl-outline", bg: "#FFECE6", color: "#E67E22" },
  icecream: { icon: "ice-cream", bg: "#FFF3E0", color: "#F39C12" },
  butter: { icon: "cheese", bg: "#E8F5E9", color: "#2E8B57" },
  cheese: { icon: "cheese", bg: "#FFF4E6", color: "#E67E22" },
  beverages: { icon: "cup-water", bg: "#E3F2FD", color: "#1E88E5" },
  default: { icon: "food-variant", bg: "#F5F5F5", color: "#555555" },
};

export default function CategoryRow({ initialCategories }: { initialCategories?: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories || []);
  const [isLoading, setIsLoading] = useState(!initialCategories || initialCategories.length === 0);

  useEffect(() => {
    if (initialCategories && initialCategories.length > 0) {
      setCategories(initialCategories);
      setIsLoading(false);
    } else {
      fetchCategories();
    }
  }, [initialCategories]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      // Safety check prevents "Cannot read properties of undefined" crashes
      const endpoint =
        API_ENDPOINTS?.CATEGORIES || "/api/products/categories.php";

      const response = await api.get(endpoint);
      const json = response.data;

      if (json?.status === "success" || Array.isArray(json?.data)) {
        const rawList = Array.isArray(json.data)
          ? json.data
          : Array.isArray(json)
            ? json
            : [];
        const mappedData = rawList.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
        }));
        setCategories(mappedData);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTheme = (name: string) => {
    const cleanKey = name.trim().toLowerCase().replace(/\s+/g, "");
    return CATEGORY_THEMES[cleanKey] || CATEGORY_THEMES["default"];
  };

  const handleCategoryPress = (categoryName: string) => {
    router.push(
      `/products?category=${encodeURIComponent(categoryName.trim())}`,
    );
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", height: 110 }]}
      >
        <ActivityIndicator size="small" color="#800000" />
      </View>
    );
  }

  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop by category</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((item) => {
          const visual = getCategoryVisual(item.name);
          const theme = getTheme(item.name);
          const bg = visual?.bgColor || theme.bg;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.categoryItem}
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(item.name)}
            >
              <View style={[styles.circle, { backgroundColor: bg }]}>
                {visual?.icon ? (
                  <Image
                    source={visual.icon}
                    style={styles.categoryIcon}
                    contentFit="contain"
                    transition={150}
                  />
                ) : (
                  <MaterialCommunityIcons
                    name={theme.icon}
                    size={28}
                    color={theme.color}
                  />
                )}
              </View>

              <Text style={styles.categoryName} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: SPACING.m },
  header: { paddingHorizontal: SPACING.m, marginBottom: SPACING.m },
  headerTitle: { fontSize: 20, fontWeight: "900", color: "#1A1A1A" },
  scrollContent: { paddingHorizontal: SPACING.m, gap: 16 },
  categoryItem: { alignItems: "center", width: 76 },
  circle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  categoryIcon: {
    width: 44,
    height: 44,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1A1A1A",
    textAlign: "center",
  },
});
