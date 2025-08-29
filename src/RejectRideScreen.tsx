// src/RejectRideScreen.tsx
import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView 
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE } from "./apiConfig"; // Now this import will work

const RejectRideScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId } = route.params as { rideId: string };
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    const getToken = async () => {
      const savedToken = await AsyncStorage.getItem("authToken");
      setToken(savedToken);
    };
    getToken();
  }, []);

  const handleReject = async () => {
    if (!reason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }

    if (!token) {
      Alert.alert("Error", "Authentication token not found");
      return;
    }

    setLoading(true);
    try {
      await axios.put(
        `${API_BASE}/drivers/${rideId}`,
        { 
          status: "Cancelled",
          rejectionReason: reason 
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );
      
      Alert.alert("Success", "Ride has been rejected");
      navigation.goBack();
    } catch (error: any) {
      console.error("Reject ride error:", error);
      Alert.alert("Error", "Failed to reject ride");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reject Ride</Text>
      <Text style={styles.subtitle}>Please provide a reason for rejecting this ride</Text>
      
      <ScrollView style={styles.reasonContainer}>
        <TextInput
          style={styles.reasonInput}
          multiline
          numberOfLines={6}
          placeholder="Enter reason here..."
          value={reason}
          onChangeText={setReason}
        />
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.disabledButton]} 
        onPress={handleReject}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Submitting..." : "Submit Rejection"}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.cancelButton} 
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  reasonContainer: {
    marginBottom: 20,
  },
  reasonInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#e74c3c",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default RejectRideScreen;




// import React, { useState } from "react";
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { useNavigation, useRoute } from "@react-navigation/native";

// const BACKEND_URL = __DEV__ ? "http://10.0.2.2:5001" : "https://easygobackend.onrender.com";

// type RouteParams = {
//   rideId: string;
// };

// export default function RejectRideScreen() {
//   const navigation = useNavigation();
//   const route = useRoute();
//   const { rideId } = route.params as RouteParams;

//   const [reason, setReason] = useState("");
//   const [loading, setLoading] = useState(false);

//   const submitReject = async () => {
//     if (!reason.trim()) {
//       Alert.alert("Error", "Please enter a reason for rejection.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const token = await AsyncStorage.getItem("authToken");
//       if (!token) return;

//       await axios.put(
//         `${BACKEND_URL}/api/drivers/${rideId}`,
//         { status: "Cancelled", reason },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );

//       Alert.alert("Success", "Ride rejected successfully!");
//       navigation.goBack();
//     } catch (err: any) {
//       console.log(err.message);
//       Alert.alert("Error", "Failed to reject ride");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.label}>Reason for rejecting the ride:</Text>
//       <TextInput
//         style={styles.input}
//         placeholder="Enter reason..."
//         value={reason}
//         onChangeText={setReason}
//         multiline
//       />
//       <TouchableOpacity style={styles.button} onPress={submitReject} disabled={loading}>
//         <Text style={{ color: "#fff" }}>{loading ? "Submitting..." : "Submit"}</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, backgroundColor: "#fff" },
//   label: { fontSize: 16, marginBottom: 10 },
//   input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 5, padding: 10, height: 100, textAlignVertical: "top" },
//   button: { marginTop: 20, backgroundColor: "red", padding: 15, borderRadius: 5, alignItems: "center" },
// });
