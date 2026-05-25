import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BASE_URL, getImageUrl } from "../../constants/api";
import { COLORS, SPACING } from "../../constants/theme";

// Matches standard category data structure
interface Category {
  id: string;
  name: string;
  image: string | null;
}

// Beautiful stock images as fallbacks just in case your DB is missing images
const FALLBACK_IMAGES: Record<string, string> = {
  default:
    "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
  milk: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=400&q=80",
  paneer:
    "https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=400&q=80",
  ghee: "https://images.unsplash.com/photo-1605297833075-84ab8e833441?auto=format&fit=crop&w=400&q=80",
  curd: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=400&q=80",
  butter:
    "https://images.unsplash.com/photo-1589131744924-b8f882414712?auto=format&fit=crop&w=400&q=80",
};

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetching from your standard API structure
      const response = await fetch(`${BASE_URL}/api/categories/index.php`);
      const json = await response.json();

      if (json.status === "success") {
        setCategories(json.data);
      } else {
        loadFallbackData();
      }
    } catch (err) {
      console.error("Category Fetch Error:", err);
      loadFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const loadFallbackData = () => {
    setCategories([
      { id: "1", name: "Fresh Milk", image: null },
      { id: "2", name: "Paneer & Tofu", image: null },
      { id: "3", name: "Pure Ghee", image: null },
      { id: "4", name: "Curd & Yogurt", image: null },
      { id: "5", name: "Dairy Butter", image: null },
      { id: "6", name: "Sweets", image: null },
    ]);
  };

  // Smart image resolver
  const resolveImage = (catName: string, dbImage: string | null) => {
    if (dbImage && dbImage.length > 5) {
      return { uri: getImageUrl(dbImage) };
    }

    const nameLower = catName.toLowerCase();
    if (nameLower.includes("milk")) return { uri: FALLBACK_IMAGES.milk };
    if (nameLower.includes("paneer") || nameLower.includes("cheese"))
      return { uri: FALLBACK_IMAGES.paneer };
    if (nameLower.includes("ghee")) return { uri: FALLBACK_IMAGES.ghee };
    if (nameLower.includes("curd") || nameLower.includes("yogurt"))
      return { uri: FALLBACK_IMAGES.curd };
    if (nameLower.includes("butter")) return { uri: FALLBACK_IMAGES.butter };

    return { uri: FALLBACK_IMAGES.default };
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/category/[id]",
          params: { id: item.id, name: item.name },
        })
      }
    >
      <View style={styles.imageContainer}>
        <Image
          source={resolveImage(item.name, item.image)}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.imageOverlay} />
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.categoryName} numberOfLines={1}>
          {item.name}
        </Text>
        <Feather name="chevron-right" size={18} color="#A11217" />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* 🌟 Redesigned Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Categories</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#A11217" />
            <Text style={styles.loadingText}>Loading categories...</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
            columnWrapperStyle={styles.rowWrapper}
            renderItem={renderCategory}
            ListEmptyComponent={
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>No categories found.</Text>
                <TouchableOpacity
                  onPress={fetchCategories}
                  style={styles.retryBtn}
                >
                  <Text style={styles.retryText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF8F5", // Warm Sitaram Background
  },

  header: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    backgroundColor: "#FAF8F5",
    borderBottomWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1A1A1A",
    textTransform: "uppercase",
  },

  content: {
    flex: 1,
  },
  gridContainer: {
    padding: SPACING.m,
    paddingBottom: 100,
  },
  rowWrapper: {
    justifyContent: "space-between",
    marginBottom: SPACING.m,
  },

  // 🌟 Premium Card Styles
  card: {
    width: "48%",
    backgroundColor: "#FFF",
    borderRadius: 24, // High rounded corners
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  imageContainer: {
    width: "100%",
    height: 140,
    backgroundColor: "#F8F8F8",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.m,
  },
  categoryName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "900",
    color: "#1A1A1A",
    marginRight: SPACING.xs,
  },

  // State Styles
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
    marginTop: 100,
  },
  loadingText: {
    marginTop: SPACING.m,
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.m,
    fontWeight: "600",
    fontSize: 15,
  },
  retryBtn: {
    backgroundColor: "#800000", // Dark red
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryText: {
    color: "#FFF",
    fontWeight: "900",
    fontSize: 14,
  },
});
