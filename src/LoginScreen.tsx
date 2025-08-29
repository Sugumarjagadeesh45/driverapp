// src/LoginScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Geolocation from "@react-native-community/geolocation";
import { API_BASE } from "./apiConfig"; // Now this import will work

const LoginScreen = ({ navigation }: any) => {
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!driverId || !password) {
      Alert.alert("⚠️ Error", "Please enter Driver ID and Password");
      return;
    }
    
    setLoading(true);
    
    // Get location before calling API
    Geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          console.log("Sending login request with location:", { latitude, longitude });
          
          const res = await axios.post(`${API_BASE}/drivers/login`, {
            driverId,
            password,
            latitude,
            longitude,
          });
          
          if (res.status === 200) {
            const driver = res.data.driver;
            // Save login state
            await AsyncStorage.multiSet([
              ["isRegistered", "true"],
              ["driverId", driver.driverId],
              ["driverName", driver.name],
              ["authToken", res.data.token],
            ]);
            
            Alert.alert("✅ Success", `Welcome ${driver.name || driverId}`);
            navigation.replace("Screen1", {
              isNewUser: false,
              phone: driver.phone,
            });
          } else {
            Alert.alert("❌ Login Failed", res.data.msg || "Invalid credentials");
          }
        } catch (err: any) {
          console.error("Login error", err.response || err);
          Alert.alert("❌ Network Error", 
            err.response?.data?.msg || 
            err.message || 
            "Failed to login. Please check your connection."
          );
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.log("❌ Location error:", error.message);
        setLoading(false);
        Alert.alert("❌ Error", "Please enable GPS for login");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Driver ID"
        value={driverId}
        onChangeText={setDriverId}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    padding: 20, 
    backgroundColor: "#f5f5f5" 
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginBottom: 30 
  },
  input: { 
    width: "100%", 
    padding: 12, 
    marginBottom: 15, 
    borderWidth: 1, 
    borderColor: "#ccc", 
    borderRadius: 8, 
    backgroundColor: "#fff" 
  },
  button: { 
    width: "100%", 
    padding: 15, 
    backgroundColor: "#28a745", 
    borderRadius: 8, 
    alignItems: "center" 
  },
  buttonText: { 
    color: "#fff", 
    fontWeight: "bold", 
    fontSize: 16 
  },
});


// import React, { useState } from "react";
// import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import Geolocation from "@react-native-community/geolocation";

// const API_BASE = "http://10.0.2.2:5000/api"; // backend (Android emulator)

// const LoginScreen = ({ navigation }: any) => {
//   const [driverId, setDriverId] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleLogin = async () => {
//     if (!driverId || !password) {
//       Alert.alert("⚠️ Error", "Please enter Driver ID and Password");
//       return;
//     }

//     setLoading(true);

//     // 👇 Get location before calling API
//     Geolocation.getCurrentPosition(
//       async (pos) => {
//         try {
//           const { latitude, longitude } = pos.coords;

//           const res = await axios.post(`${API_BASE}/drivers/login`, {
//             driverId,
//             password,
//             latitude,
//             longitude,
//           });

//           if (res.status === 200) {
//             const driver = res.data.driver;

//             // Save login state
//             await AsyncStorage.multiSet([
//               ["isRegistered", "true"],
//               ["driverId", driver.driverId],
//               ["driverName", driver.name],
//               ["authToken", res.data.token],
//             ]);

//             Alert.alert("✅ Success", `Welcome ${driver.name || driverId}`);
//             navigation.replace("Screen1", {
//               isNewUser: false,
//               phone: driver.phone,
//             });
//           } else {
//             Alert.alert("❌ Login Failed", res.data.msg || "Invalid credentials");
//           }
//         } catch (err: any) {
//           console.error("Login error", err.response || err.message);
//           Alert.alert("❌ Network Error", err.response?.data?.msg || err.message || "Failed to login");
//         } finally {
//           setLoading(false);
//         }
//       },
//       (error) => {
//         console.log("❌ Location error:", error.message);
//         setLoading(false);
//         Alert.alert("❌ Error", "Please enable GPS for login");
//       },
//       { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
//     );
//   };

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Driver Login</Text>

//       <TextInput
//         style={styles.input}
//         placeholder="Driver ID"
//         value={driverId}
//         onChangeText={setDriverId}
//       />

//       <TextInput
//         style={styles.input}
//         placeholder="Password"
//         value={password}
//         onChangeText={setPassword}
//         secureTextEntry
//       />

//       <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
//         {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default LoginScreen;

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20, backgroundColor: "#f5f5f5" },
//   title: { fontSize: 28, fontWeight: "bold", marginBottom: 30 },
//   input: { width: "100%", padding: 12, marginBottom: 15, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, backgroundColor: "#fff" },
//   button: { width: "100%", padding: 15, backgroundColor: "#28a745", borderRadius: 8, alignItems: "center" },
//   buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
// });
