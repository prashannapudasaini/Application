import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// 🔥 NEW IMPORTS: Required for Web Iframe and Location Searching
import * as Location from "expo-location";
import { createElement } from "react-native";

// Only import MapView on native mobile platforms to prevent Web crashes
let MapView: any;
let Marker: any;
if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
}

export default function LocationsScreen() {
  const router = useRouter();
  const mapRef = useRef<any>(null);

  // State for the Map Modal
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Geographic Center of Nepal
  const NEPAL_REGION = {
    latitude: 28.3949,
    longitude: 84.124,
    latitudeDelta: 4.5,
    longitudeDelta: 4.5,
  };

  // Map & Search States
  const [selectedCoordinate, setSelectedCoordinate] = useState({
    latitude: 27.7172,
    longitude: 85.324,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // State to hold the finalized list of addresses
  const [savedAddresses, setSavedAddresses] = useState([
    {
      id: "1",
      type: "Home Address",
      details: "Prashant Sharma, Lazimpat, Kathmandu, Nepal",
      isDefault: true,
    },
  ]);

  const handleOpenMap = () => {
    // 🔥 FIX: No longer blocks the web! It just opens the modal natively everywhere.
    setIsMapVisible(true);
  };

  // 🔥 NEW: Map Search Execution Logic
  const executeMapSearch = async () => {
    if (!searchQuery.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);

    try {
      if (Platform.OS !== "web") {
        // Native Mobile Geocoding
        const geocodeResults = await Location.geocodeAsync(
          `${searchQuery}, Nepal`,
        );
        if (geocodeResults.length > 0) {
          const { latitude, longitude } = geocodeResults[0];
          setSelectedCoordinate({ latitude, longitude });

          // Animate Map Camera to the searched location
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            1000,
          );
        } else {
          Alert.alert(
            "Location Not Found",
            "Try entering a broader area name.",
          );
        }
      }
      // On Web, the iframe automatically re-renders with the new URL search query
    } catch (error) {
      console.warn("Geocoding Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmLocation = () => {
    setIsMapVisible(false);

    // Determine what to display based on platform context
    const locationString =
      Platform.OS === "web"
        ? searchQuery || "Custom Location, Nepal"
        : `Pinned at Lat: ${selectedCoordinate.latitude.toFixed(4)}, Lng: ${selectedCoordinate.longitude.toFixed(4)}`;

    const newAddress = {
      id: Date.now().toString(),
      type: "Custom Location",
      details: locationString,
      isDefault: false,
    };

    setSavedAddresses([...savedAddresses, newAddress]);
    setSearchQuery(""); // reset search
  };

  // 🔥 NEW: Dynamic Google Maps Iframe Renderer for Web
  const WebGoogleMap = () => {
    if (Platform.OS !== "web") return null;

    // Inject search query directly into Google Maps iframe
    const query = searchQuery
      ? encodeURIComponent(searchQuery + " Nepal")
      : "Kathmandu Nepal";
    const mapUrl = `http://googleusercontent.com/maps.google.com/maps?q=${query}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    return createElement("iframe", {
      src: mapUrl,
      style: { width: "100%", height: "100%", border: "none" },
      allowFullScreen: false,
      loading: "lazy",
    });
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

      {/* ADDRESS LIST */}
      <View style={styles.listContainer}>
        {savedAddresses.map((addr) => (
          <View key={addr.id} style={styles.addressCard}>
            <View style={styles.cardHeader}>
              <View style={styles.typeBadge}>
                <Feather
                  name={addr.type.includes("Home") ? "home" : "map-pin"}
                  size={14}
                  color="#800000"
                />
                <Text style={styles.addrType}>{addr.type}</Text>
              </View>
              {addr.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              )}
            </View>
            <Text style={styles.addrFull}>{addr.details}</Text>
          </View>
        ))}

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
      </View>

      {/* UNIFIED FULL SCREEN MAP MODAL (Web + Mobile) */}
      <Modal
        visible={isMapVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        transparent={Platform.OS === "web"}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Pin Your Address</Text>
            <TouchableOpacity onPress={() => setIsMapVisible(false)}>
              <Feather name="x" size={24} color="#050505" />
            </TouchableOpacity>
          </View>

          <View style={styles.mapWrapper}>
            {/* FLOATING SEARCH BAR */}
            <View style={styles.mapSearchBar}>
              <TextInput
                style={[
                  styles.mapSearchInput,
                  Platform.OS === "web" && ({ outlineStyle: "none" } as any),
                ]}
                placeholder="Search place in Nepal..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={executeMapSearch}
                returnKeyType="search"
              />
              <TouchableOpacity
                style={styles.mapSearchBtn}
                onPress={executeMapSearch}
                disabled={isSearching}
              >
                <Feather name="search" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {Platform.OS !== "web" ? (
              // NATIVE MOBILE: Interactive MapView
              <>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={NEPAL_REGION}
                  minZoomLevel={5}
                >
                  <Marker
                    coordinate={selectedCoordinate}
                    draggable
                    onDragEnd={(e: any) =>
                      setSelectedCoordinate(e.nativeEvent.coordinate)
                    }
                  >
                    <MaterialCommunityIcons
                      name="map-marker"
                      size={48}
                      color="#800000"
                    />
                  </Marker>
                </MapView>
                <View style={styles.floatingBanner}>
                  <Feather name="info" size={16} color="#800000" />
                  <Text style={styles.bannerText}>Hold and drag the pin</Text>
                </View>
              </>
            ) : (
              // WEB: Google Maps Iframe
              <View style={styles.map}>
                <WebGoogleMap />
              </View>
            )}
          </View>

          <View style={styles.modalFooter}>
            <Text style={styles.coordinatesText}>
              {Platform.OS !== "web"
                ? `${selectedCoordinate.latitude.toFixed(4)}, ${selectedCoordinate.longitude.toFixed(4)}`
                : searchQuery
                  ? `Location: ${searchQuery}`
                  : "Type a location above to preview"}
            </Text>
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleConfirmLocation}
            >
              <Text style={styles.confirmBtnText}>Save Location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  defaultBadge: {
    backgroundColor: "#F0F2F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultText: { fontSize: 11, fontWeight: "600", color: "#65676B" },
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

  // Map Modal Styling
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: Platform.OS === "web" ? "auto" : 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "#E4E6EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#050505" },

  mapWrapper: { flex: 1, position: "relative", backgroundColor: "#F2F2F6" },
  map: { width: "100%", height: "100%" },

  // Search Bar Styling
  mapSearchBar: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
    height: 54,
  },
  mapSearchInput: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#050505",
  },
  mapSearchBtn: {
    backgroundColor: "#800000",
    width: 54,
    height: 54,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  floatingBanner: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#050505",
    marginLeft: 8,
  },

  modalFooter: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderColor: "#E4E6EB",
  },
  coordinatesText: {
    textAlign: "center",
    fontSize: 13,
    color: "#65676B",
    marginBottom: 12,
    fontWeight: "500",
  },
  confirmBtn: {
    backgroundColor: "#800000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
