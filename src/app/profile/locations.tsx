import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AddAddressModal from "../../components/common/AddAddressModal";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function LocationsScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [isMapVisible, setIsMapVisible] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAddresses = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.get(`/api/user/mobile-profile.php?user_id=${user.id}&_t=${Date.now()}`);
      if (res.data?.status === "success" && res.data.data.saved_addresses) {
        setSavedAddresses(res.data.data.saved_addresses);
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
      Alert.alert("Error", "Could not load saved locations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  const handleOpenMap = () => {
    if (!user) {
      Alert.alert("Login Required", "Please login to add locations.");
      return;
    }
    if (savedAddresses.length >= 3) {
      Alert.alert("Limit Reached", "You can only save up to 3 addresses. Please delete one to add a new one.");
      return;
    }
    setIsMapVisible(true);
  };

  const handleDeleteAddress = (addressId: string | number) => {
    Alert.alert(
      "Delete Address",
      "Are you sure you want to delete this location?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const res = await api.post("/api/user/delete_address.php", {
                user_id: user?.id ? Number(user.id) : null,
                address_id: addressId,
              });

              if (res.data?.status?.toLowerCase() === "success") {
                fetchAddresses(); // This will refresh the list and reset loading
              } else {
                Alert.alert("Failed", res.data?.message || "Could not delete address.");
                setIsLoading(false);
              }
            } catch (err) {
              console.error("Delete failed:", err);
              Alert.alert("Network Error", "Could not reach the server.");
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={24} color="#050505" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Locations</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer}>
        {isLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#800000" />
          </View>
        ) : savedAddresses.length === 0 ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <Feather name="map-pin" size={48} color="#CCC" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 16, color: "#666", textAlign: "center" }}>
              You haven't saved any locations yet.
            </Text>
          </View>
        ) : (
          savedAddresses.map((addr) => (
            <View key={addr.id} style={styles.addressCard}>
              <View style={styles.cardHeader}>
                <View style={styles.typeBadge}>
                  <Feather
                    name={addr.label?.toLowerCase().includes("home") ? "home" : "map-pin"}
                    size={14}
                    color="#800000"
                  />
                  <Text style={styles.addrType}>{addr.label || "Saved Location"}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteAddress(addr.id)} style={{ padding: 4 }}>
                  <Feather name="trash-2" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
              <Text style={styles.addrFull}>{addr.address}</Text>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={handleOpenMap}
        >
          <Feather
            name="plus"
            size={18}
            color="#FFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.addText}>Add New Location</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* DYNAMIC MAP MODAL REUSING CHECKOUT LOGIC */}
      <AddAddressModal
        visible={isMapVisible}
        onClose={() => setIsMapVisible(false)}
        onSuccess={() => {
          setIsMapVisible(false);
          fetchAddresses();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E4E6EB",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#050505",
    flex: 1,
    textAlign: "center",
  },
  listContainer: { padding: 16 },
  addressCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(128,0,0,0.1)",
  },
  addrType: {
    fontSize: 13,
    fontWeight: "700",
    color: "#800000",
    marginLeft: 6,
  },
  addrFull: { fontSize: 15, color: "#050505", lineHeight: 22 },
  addBtn: {
    marginTop: 8,
    backgroundColor: "#050505",
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addText: { color: "#FFF", fontWeight: "700", fontSize: 15 },
});
