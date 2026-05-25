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
import { API_ENDPOINTS } from "../../constants/api";
import { SPACING } from "../../constants/theme";

// 🔥 The Design Matrix: Keeps the UI beautiful regardless of what the DB sends
const PASTEL_PALETTE = [
  "#EAF4F4", // Soft Cyan
  "#E8F5E9", // Soft Green
  "#FFF9E6", // Soft Yellow
  "#FFECE6", // Soft Peach
  "#F4E9F5", // Soft Purple
  "#FFF3E0", // Soft Orange
];

interface Category {
  id: string;
  name: string;
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
      setIsLoading(true);
      const response = await fetch(API_ENDPOINTS.CATEGORIES);
      const json = await response.json();

      if (json.status === "success" || json.data) {
        // Adjust json.data depending on your exact API response structure
        const mappedData = json.data.map((item: any) => ({
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

  const handleCategoryPress = (categoryName: string) => {
    router.push(`/(tabs)/categories?selected=${categoryName}`);
  };

  if (isLoading) {
    return (
      <View
        style={[styles.container, { justifyContent: "center", height: 100 }]}
      >
        <ActivityIndicator size="small" color="#800000" />
      </View>
    );
  }

  // Hide entirely if no categories exist in the DB
  if (categories.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category, index) => {
          // Use modulo to endlessly loop through the colors if you have many categories
          const bgColor = PASTEL_PALETTE[index % PASTEL_PALETTE.length];

          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              activeOpacity={0.7}
              onPress={() => handleCategoryPress(category.name)}
            >
              <View style={[styles.circle, { backgroundColor: bgColor }]} />
              <Text style={styles.categoryName} numberOfLines={1}>
                {category.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: SPACING.l, marginBottom: SPACING.s },
  scrollContent: { paddingHorizontal: SPACING.m, gap: 16 },
  categoryItem: { alignItems: "center", width: 72 },
  circle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "900",
    color: "#1A1A1A",
    textAlign: "center",
  },
});
