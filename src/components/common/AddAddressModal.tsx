import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import MapComponent from "../../components/MapComponent";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const HUBS = [
  { name: "Patan", latitude: 27.6742, longitude: 85.3181 },
  { name: "Kuleshwor", latitude: 27.6970, longitude: 85.2970 },
];
const MAX_RADIUS_KM = 3;

const getDistanceKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddAddressModal({ visible, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const mapRef = useRef<any>(null);

  const [label, setLabel] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [deliveryInfo, setDeliveryInfo] = useState({
    available: false,
    distance: 0,
    hasChecked: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearchingMap(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(
            searchQuery
          )}&lat=27.7172&lon=85.3240&limit=8`
        );
        const data = await res.json();
        const formattedResults = data.features
          .map((feature: any) => {
            const props = feature.properties;
            const nameParts = [
              props.name,
              props.street,
              props.district,
              props.city,
              props.state,
            ].filter(Boolean);
            return {
              display_name: Array.from(new Set(nameParts)).join(", "),
              lat: feature.geometry.coordinates[1],
              lon: feature.geometry.coordinates[0],
            };
          })
          .filter((res: any) => res.display_name);
        setSearchResults(formattedResults);
      } catch (err) {
        console.error("Search failed:", err);
      }
      setIsSearchingMap(false);
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const checkDeliveryZone = (lat: number, lng: number) => {
    setUserLocation({ latitude: lat, longitude: lng });
    let shortestDistance = Infinity;

    HUBS.forEach((hub) => {
      const distance = getDistanceKm(lat, lng, hub.latitude, hub.longitude);
      if (distance < shortestDistance) shortestDistance = distance;
    });

    if (shortestDistance <= MAX_RADIUS_KM) {
      setDeliveryInfo({
        available: true,
        distance: Number(shortestDistance.toFixed(1)),
        hasChecked: true,
      });
    } else {
      setDeliveryInfo({
        available: false,
        distance: Number(shortestDistance.toFixed(1)),
        hasChecked: true,
      });
    }
  };

  const selectSearchResult = (result: any) => {
    checkDeliveryZone(result.lat, result.lon);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
    mapRef.current?.animateToRegion(
      {
        latitude: result.lat,
        longitude: result.lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      1000
    );
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert("Error", "You must be logged in to save an address.");
      return;
    }

    if (!label.trim()) {
      Alert.alert("Missing Label", "Please give this address a name (e.g., Home)");
      return;
    }

    if (!detailedAddress.trim()) {
      Alert.alert("Missing Address", "Please provide the flat/house number.");
      return;
    }

    if (!userLocation) {
      Alert.alert("Missing Location", "Please drop a pin on the map.");
      return;
    }

    if (!deliveryInfo.available) {
      Alert.alert(
        "Out of Zone",
        `This location is outside our ${MAX_RADIUS_KM}km delivery zone.`
      );
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post("/api/user/save_address.php", {
        user_id: Number(user.id),
        label: label.trim(),
        address: detailedAddress.trim(),
        latitude: Number(userLocation.latitude),
        longitude: Number(userLocation.longitude),
      });

      if (res.data?.status?.toLowerCase() === "success") {
        setLabel("");
        setDetailedAddress("");
        setUserLocation(null);
        setDeliveryInfo({ available: false, distance: 0, hasChecked: false });
        onSuccess();
      } else {
        Alert.alert("Save Failed", res.data?.message || "Could not save address.");
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Network Error", "Failed to contact the server.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Feather name="x" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add New Address</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: SPACING.m }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.sectionTitle}>Pin Location</Text>
          <View
            style={[
              styles.card,
              { padding: 0, height: 350, marginBottom: SPACING.m, zIndex: 10 },
            ]}
          >
            <View
              style={{ flex: 1, overflow: "hidden", borderRadius: RADIUS.large }}
            >
              {Platform.OS === "web" ? (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: "#f0f0f0",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 20,
                  }}
                >
                  <Feather
                    name="map"
                    size={40}
                    color="#ccc"
                    style={{ marginBottom: 12 }}
                  />
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#666",
                      fontWeight: "600",
                    }}
                  >
                    Please use the mobile app to set your precise GPS location.
                  </Text>
                </View>
              ) : (
                <MapComponent
                  mapRef={mapRef}
                  hubs={HUBS}
                  maxRadiusKm={MAX_RADIUS_KM}
                  userLocation={userLocation}
                  onPress={(lat, lng) => {
                    checkDeliveryZone(lat, lng);
                    setSearchResults([]);
                  }}
                />
              )}

              {Platform.OS !== "web" && !userLocation && (
                <View style={styles.mapHintBadge}>
                  <Feather name="map-pin" size={14} color={COLORS.primary} />
                  <Text style={styles.mapHintText}>Tap map to drop pin</Text>
                </View>
              )}
            </View>

            {/* SEARCH BAR */}
            {Platform.OS !== "web" && (
              <View style={styles.searchOverlay}>
                <View style={styles.searchInputWrapper}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search neighborhood..."
                    placeholderTextColor="#666"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  <View style={styles.searchIconBtn}>
                    {isSearchingMap ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Feather name="search" size={18} color="#555" />
                    )}
                  </View>
                </View>

                {searchResults.length > 0 && (
                  <ScrollView
                    style={styles.searchResultsDropdown}
                    keyboardShouldPersistTaps="handled"
                  >
                    {searchResults.map((res, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.searchResultItem}
                        onPress={() => selectSearchResult(res)}
                      >
                        <Text style={styles.searchResultText} numberOfLines={2}>
                          {res.display_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>

          {deliveryInfo.hasChecked && deliveryInfo.available && (
            <View style={styles.successAlert}>
              <Feather name="check-circle" size={18} color="#10b981" />
              <Text style={styles.successAlertText}>
                Great! We deliver to this location ({deliveryInfo.distance} km).
              </Text>
            </View>
          )}

          {deliveryInfo.hasChecked && !deliveryInfo.available && (
            <View style={styles.errorAlert}>
              <Feather name="alert-circle" size={18} color="#ef4444" />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorAlertTitle}>Out of Delivery Zone</Text>
                <Text style={styles.errorAlertText}>
                  This location is {deliveryInfo.distance} km away from our hubs.
                  We only deliver within {MAX_RADIUS_KM} km.
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionTitle}>Address Details</Text>
          <View style={styles.card}>
            <View style={styles.inputFieldBlock}>
              <Text style={styles.inputLabel}>Label (e.g. Home, Office) *</Text>
              <TextInput
                style={styles.inputBox}
                value={label}
                onChangeText={setLabel}
                placeholder="Home"
                placeholderTextColor="#888"
              />
            </View>
            <View style={[styles.inputFieldBlock, { marginBottom: 0 }]}>
              <Text style={styles.inputLabel}>Flat / House No / Landmark *</Text>
              <TextInput
                style={styles.inputBox}
                value={detailedAddress}
                onChangeText={setDetailedAddress}
                placeholder="Flat 4B, XYZ Apartments"
                placeholderTextColor="#888"
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              (!deliveryInfo.available || !label || !detailedAddress) &&
                styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!deliveryInfo.available || !label || !detailedAddress || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Save Address</Text>
            )}
          </TouchableOpacity>
        </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF8F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.m,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
  },
  backBtn: {
    padding: 8,
    borderRadius: RADIUS.round,
    backgroundColor: "#F8F8F8",
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#1A1A1A" },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: SPACING.s,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: RADIUS.large,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  searchOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  searchInputWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: RADIUS.medium,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  searchIconBtn: {
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
    borderLeftWidth: 1,
    borderLeftColor: "#EAEAEA",
  },
  searchResultsDropdown: {
    backgroundColor: "#FFF",
    marginTop: 8,
    borderRadius: RADIUS.medium,
    maxHeight: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  searchResultItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  searchResultText: { fontSize: 13, color: "#333", fontWeight: "500" },
  mapHintBadge: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  mapHintText: { fontSize: 13, fontWeight: "800", color: "#1A1A1A" },
  successAlert: {
    flexDirection: "row",
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.l,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  successAlertText: { color: "#065f46", fontSize: 14, fontWeight: "700" },
  errorAlert: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    padding: 12,
    borderRadius: RADIUS.medium,
    marginBottom: SPACING.l,
    alignItems: "flex-start",
    gap: 8,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  errorAlertTitle: { color: "#991b1b", fontSize: 14, fontWeight: "800" },
  errorAlertText: { color: "#991b1b", fontSize: 13, marginTop: 2 },
  inputFieldBlock: { marginBottom: SPACING.m },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#666",
    marginBottom: 6,
  },
  inputBox: {
    borderWidth: 1,
    borderColor: "#EAEAEA",
    borderRadius: RADIUS.medium,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#FAFAFA",
    color: "#1A1A1A",
  },
  footer: {
    padding: SPACING.m,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: RADIUS.medium,
    alignItems: "center",
  },
  saveBtnDisabled: {
    backgroundColor: "#ccc",
  },
  saveBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
  },
});
