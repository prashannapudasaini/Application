import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS } from "../../constants/api";
import { RADIUS, SPACING } from "../../constants/theme";

// 🔥 The UI Matrix: Pairs colors with relevant icons to wrap dynamic data
const UI_MATRIX = [
  { icon: "bottle-wine-outline", bgColor: "#EAF4F4", iconColor: "#008080" },
  { icon: "cup-water", bgColor: "#E8F5E9", iconColor: "#2E7D32" },
  { icon: "cube-outline", bgColor: "#FFF9E6", iconColor: "#F57F17" },
  { icon: "cheese", bgColor: "#FFECE6", iconColor: "#D84315" },
  { icon: "bowl-outline", bgColor: "#F4E9F5", iconColor: "#6A1B9A" },
  { icon: "pot-mix-outline", bgColor: "#FFF3E0", iconColor: "#E65100" },
  { icon: "cupcake", bgColor: "#FCE4EC", iconColor: "#C2185B" },
  { icon: "ice-cream", bgColor: "#E3F2FD", iconColor: "#1565C0" },
];

interface DynamicCategory {
  id: string;
  name: string;
  itemCount: number; // Defaults to 0 if API doesn't provide it
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<DynamicCategory[]>([]);
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
        const mappedData = json.data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          itemCount: item.product_count || 0, // Maps product count if available
        }));
        setCategories(mappedData);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCategoryCard = ({
    item,
    index,
  }: {
    item: DynamicCategory;
    index: number;
  }) => {
    // Loop through the UI matrix based on the index to assign styling
    const design = UI_MATRIX[index % UI_MATRIX.length];

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => console.log(`Navigating to category: ${item.name}`)}
      >
        <View
          style={[styles.iconContainer, { backgroundColor: design.bgColor }]}
        >
          <MaterialCommunityIcons
            name={design.icon as any}
            size={32}
            color={design.iconColor}
          />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.categoryName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemCount}>
            {item.itemCount > 0 ? `${item.itemCount} Items` : "View Products"}
          </Text>
        </View>

        <View style={styles.arrowBox}>
          <Feather name="chevron-right" size={16} color="#800000" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop by Category</Text>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => router.push("/(tabs)")}
        >
          <Feather name="search" size={20} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#800000" />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centerBox}>
          <Text style={styles.emptyText}>No categories available.</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryCard}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: "#FAF8F5",
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
  },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1A1A1A" },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { padding: SPACING.m, paddingBottom: 100 },
  columnWrapper: { justifyContent: "space-between", marginBottom: SPACING.m },
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: "relative",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.m,
  },
  cardTextContainer: { marginBottom: 4 },
  categoryName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  itemCount: { fontSize: 12, fontWeight: "600", color: "#888" },
  arrowBox: {
    position: "absolute",
    bottom: SPACING.m,
    right: SPACING.m,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFF0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#666", fontSize: 15, fontWeight: "600" },
});
