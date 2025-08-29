import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

const BACKEND_AVAILABLE_RIDES = __DEV__
  ? "http://10.0.2.2:5001/api/drivers/available-rides"
  : "https://easygobackend.onrender.com/api/drivers/available-rides";

const BACKEND_RIDE_STATUS = __DEV__
  ? "http://10.0.2.2:5001/api/rides"
  : "https://easygobackend.onrender.com/api/rides";

interface Ride {
  _id: string;
  user: { name: string; phone: string };
  pickup: { addr: string };
  drop: { addr: string };
  price: number;
  distanceKm: number;
}

export default function RidersScreen() {
  const navigation = useNavigation<any>();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch available rides
  const fetchRides = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const res = await axios.get(BACKEND_AVAILABLE_RIDES, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRides(res.data.rides || []);
    } catch (err: any) {
      console.log("❌ Fetch rides error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
    const interval = setInterval(fetchRides, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Handle ride accept / reject
  const handleRideAction = async (rideId: string, status: "Accepted" | "Cancelled") => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const res = await axios.put(
        `${BACKEND_RIDE_STATUS}/${rideId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", `Ride ${status.toLowerCase()}!`);
      // Update local state
      setRides((prev) => prev.filter((r) => r._id !== rideId));

      if (status === "Accepted") {
        navigation.navigate("RideScreen", { ride: res.data.ride });
      }
    } catch (err: any) {
      console.log("❌ Ride action error:", err.message);
      Alert.alert("Error", "Failed to update ride status.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={{ marginTop: 10 }}>Loading rides...</Text>
      </View>
    );
  }

  if (!rides.length) {
    return (
      <View style={styles.loadingContainer}>
        <Text>No rides available right now.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <FlatList
        data={rides}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.rideCard}>
            <Text style={styles.rideTitle}>🚖 New Ride Request</Text>
            <Text>Customer: {item.user?.name}</Text>
            <Text>Pickup: {item.pickup?.addr}</Text>
            <Text>Drop: {item.drop?.addr}</Text>
            <Text>Fare: ₹{item.price}</Text>
            <Text>Distance: {item.distanceKm} km</Text>

            <View style={{ flexDirection: "row", marginTop: 10 }}>
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => handleRideAction(item._id, "Accepted")}
              >
                <Text style={{ color: "#fff" }}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleRideAction(item._id, "Cancelled")}
              >
                <Text style={{ color: "#fff" }}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: "blue" }]}
                onPress={() => Linking.openURL(`tel:${item.user?.phone}`)}
              >
                <Text style={{ color: "#fff" }}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  rideCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 3,
  },
  rideTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  acceptBtn: {
    flex: 1,
    backgroundColor: "green",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginRight: 5,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: "red",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginLeft: 5,
  },
});
