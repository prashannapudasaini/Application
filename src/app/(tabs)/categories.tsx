import { Feather } from "@expo/vector-icons";
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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_ENDPOINTS, getImageUrl } from "../../constants/api";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";

const PASTEL_COLORS = ["#F0F8FF", "#FFF9E6", "#FFF0E6", "#F0FFF4", "#F3E5F5"];

interface Category {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}

export default function CategoriesScreen() {
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
          title: item.name || item.title,
          subtitle: item.description || "Explore fresh products",
          image: getImageUrl(item.image),
        }));
        setCategories(mappedCats);
      }
    } catch (err) {
      console.error("Categories Page Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shop by Category</Text>
      </View>

      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={18}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search categories..."
            style={styles.searchInput}
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={{ marginTop: 50 }}
          />
        ) : (
          categories.map((cat, index) => {
            const bgColor = PASTEL_COLORS[index % PASTEL_COLORS.length];
            // Safe assignment for Web
            const cleanImageUrl = cat.image ? cat.image.trim() : undefined;

            return (
              <Pressable
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: bgColor }]}
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                onPress={() =>
                  // 🔥 FIXED ROUTING: Now points to the category folder we created
                  router.push(`/category/${cat.title}`)
                }
              >
                <View style={styles.textContainer}>
                  <Text style={styles.categoryTitle}>{cat.title}</Text>
                  <Text style={styles.categorySubtitle} numberOfLines={2}>
                    {cat.subtitle}
                  </Text>
                </View>

                <View style={styles.imageWrapper}>
                  {/* Safe Fallback Logic */}
                  {!cleanImageUrl ? (
                    <View
                      style={[
                        styles.categoryImage,
                        {
                          backgroundColor: "rgba(255,255,255,0.5)",
                          justifyContent: "center",
                          alignItems: "center",
                        },
                      ]}
                    >
                      <Feather
                        name="image"
                        size={32}
                        color={COLORS.textSecondary}
                        opacity={0.3}
                      />
                    </View>
                  ) : Platform.OS === "web" ? (
                    <img
                      src={cleanImageUrl}
                      alt={cat.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      onError={(e) =>
                        ((e.target as HTMLImageElement).style.display = "none")
                      }
                    />
                  ) : (
                    <Image
                      source={{ uri: cleanImageUrl }}
                      style={styles.categoryImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.card },
  header: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  searchWrapper: { paddingHorizontal: SPACING.m, paddingBottom: SPACING.m },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.medium,
    paddingHorizontal: SPACING.m,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: { marginRight: SPACING.s },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
    outlineStyle: "none",
  },

  scrollContent: {
    paddingHorizontal: SPACING.m,
    paddingBottom: 100,
    gap: SPACING.m,
  },

  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: RADIUS.large,
    padding: SPACING.l,
    overflow: "hidden",
    minHeight: 110,
  },
  textContainer: { flex: 1, paddingRight: 80, zIndex: 2 },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    opacity: 0.8,
  },

  imageWrapper: {
    position: "absolute",
    right: -15,
    bottom: -15,
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    opacity: 0.95,
  },
  categoryImage: { width: "100%", height: "100%" },
});
