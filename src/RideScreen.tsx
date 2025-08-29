import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../App";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height } = Dimensions.get("window");

type RideScreenRouteProp = RouteProp<RootStackParamList, "RideScreen">;

const BACKEND_URL = "http://10.0.2.2:5001/api/rides"; // ⚡ update to your backend

const RideScreen = () => {
  const route = useRoute<RideScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { ride } = route.params; // 👈 ride passed from Accept button

  const [region] = useState({
    latitude: ride?.pickup?.lat || 17.385044,
    longitude: ride?.pickup?.lng || 78.486671,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const handleRideAction = async (action: "arrived" | "start" | "complete") => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const res = await axios.post(
        `${BACKEND_URL}/${ride._id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log(`✅ Ride ${action}:`, res.data.ride);

      if (action === "complete") {
  navigation.navigate("Screen1");
}
    } catch (err: any) {
      console.log("❌ Ride action error:", err.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>On Route</Text>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <MapView style={styles.map} region={region}>
        {ride?.pickup && (
          <Marker coordinate={{ latitude: ride.pickup.lat, longitude: ride.pickup.lng }}>
            <Image source={require("../assets/11111.png")} style={{ width: 40, height: 40 }} />
          </Marker>
        )}
        {ride?.drop && (
          <Marker coordinate={{ latitude: ride.drop.lat, longitude: ride.drop.lng }}>
            <Image source={require("../assets/11111.png")} style={{ width: 40, height: 40 }} />
          </Marker>
        )}
      </MapView>

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <View style={styles.dragHandle} />

        {/* Trip Info */}
        <View style={styles.tripHeader}>
          <Text style={styles.tripType}>{ride?.vehicleType || "One Way"}</Text>
          <Text style={styles.bookingId}>#{ride?._id?.slice(-6)}</Text>
        </View>
        <Text style={styles.vehicle}>{ride?.vehicleType}</Text>

        {/* Start Time */}
        <View style={styles.infoRow}>
          <Ionicons name="time" size={20} color="#1976D2" />
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{ride?.status}</Text>
        </View>

        {/* Customer Name */}
        <View style={styles.infoRow}>
          <Ionicons name="person" size={20} color="#1976D2" />
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value}>{ride?.user?.name || "N/A"}</Text>
        </View>

        {/* Pickup */}
        <View style={styles.infoRow}>
          <Ionicons name="location" size={20} color="#1976D2" />
          <Text style={styles.value}>{ride?.pickup?.addr}</Text>
        </View>

        {/* Drop */}
        <View style={styles.infoRow}>
          <Ionicons name="flag" size={20} color="#1976D2" />
          <Text style={styles.value}>{ride?.drop?.addr}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialIcons name="phone" size={22} color="#1976D2" />
            <Text style={styles.actionText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <MaterialIcons name="directions" size={22} color="#1976D2" />
            <Text style={styles.actionText}>Get Directions</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom CTA buttons based on status */}
        {ride?.status === "accepted" && (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => handleRideAction("arrived")}>
            <Text style={styles.ctaText}>Mark Arrived</Text>
          </TouchableOpacity>
        )}
        {ride?.status === "arrived" && (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => handleRideAction("start")}>
            <Text style={styles.ctaText}>Start Ride</Text>
          </TouchableOpacity>
        )}
        {ride?.status === "ongoing" && (
          <TouchableOpacity style={styles.ctaBtn} onPress={() => handleRideAction("complete")}>
            <Text style={styles.ctaText}>Complete Ride</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default RideScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  map: { flex: 1 },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    elevation: 10,
  },
  dragHandle: {
    width: 50,
    height: 5,
    backgroundColor: "#ccc",
    alignSelf: "center",
    borderRadius: 3,
    marginBottom: 10,
  },
  tripHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tripType: { fontSize: 16, fontWeight: "600" },
  bookingId: { fontSize: 14, color: "#666" },
  vehicle: { fontSize: 14, color: "#444", marginVertical: 4 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    gap: 8,
  },
  label: { fontSize: 14, fontWeight: "500", marginLeft: 4 },
  value: { fontSize: 14, marginLeft: 8, color: "#333", flexShrink: 1 },
  actionRow: { flexDirection: "row", justifyContent: "space-around", marginTop: 12 },
  actionBtn: { alignItems: "center" },
  actionText: { fontSize: 12, color: "#1976D2", marginTop: 4 },
  ctaBtn: {
    backgroundColor: "#1976D2",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

