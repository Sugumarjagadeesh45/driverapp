// src/Screen1.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
} from "react-native";
import { io, Socket } from "socket.io-client";
import MapView, { Marker } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { API_BASE, SOCKET_URL } from "./apiConfig";

export default function MapScreen() {
  const navigation = useNavigation<any>();
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);
  const [incomingRide, setIncomingRide] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showRideModal, setShowRideModal] = useState(false);

  // Load driver data from AsyncStorage
  useEffect(() => {
    const loadDriverData = async () => {
      try {
        const savedDriverId = await AsyncStorage.getItem("driverId");
        const savedToken = await AsyncStorage.getItem("authToken");
        
        if (savedDriverId && savedToken) {
          setDriverId(savedDriverId);
          setToken(savedToken);
          
          // Initialize socket connection
          const newSocket = io(SOCKET_URL, {
            auth: {
              token: savedToken
            }
          });
          
          newSocket.on("connect", () => {
            console.log("✅ Socket connected");
            newSocket.emit("joinDriverRoom", savedDriverId);
          });
          
          newSocket.on("newRideRequest", (ride: any) => {
            console.log("🚖 New ride request received:", ride);
            setIncomingRide(ride);
            setShowRideModal(true);
            
            // Play notification sound (optional)
            // You can add sound here if needed
          });
          
          newSocket.on("disconnect", () => {
            console.log("❌ Socket disconnected");
          });
          
          setSocket(newSocket);
        } else {
          // Redirect to login if no credentials
          navigation.replace("LoginScreen");
        }
      } catch (error) {
        console.error("Failed to load driver data", error);
        navigation.replace("LoginScreen");
      }
    };
    
    loadDriverData();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Location tracking
  useEffect(() => {
    if (!token) return;
    
    const watchId = Geolocation.watchPosition(
      async (pos) => {
        const coords = { 
          latitude: pos.coords.latitude, 
          longitude: pos.coords.longitude 
        };
        
        setCurrentLocation(coords);
        setLoading(false);
        
        if (isOnline) {
          await sendLocationToBackend(coords);
        }
      },
      (err) => {
        console.log("Location error:", err.message);
        setLoading(false);
        Alert.alert("Error", "Failed to get location.");
      },
      { 
        enableHighAccuracy: true, 
        distanceFilter: 5, 
        interval: 5000 
      }
    );
    
    return () => Geolocation.clearWatch(watchId);
  }, [isOnline, token]);

  const sendLocationToBackend = async (coords: { latitude: number; longitude: number }) => {
    if (!token) return;
    
    try {
      await axios.post(
        `${API_BASE}/drivers/update-location`,
        coords,
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );
    } catch (err) {
      console.log("Location update error:", err);
    }
  };

  const handleRideAction = async (status: "Accepted" | "Cancelled") => {
    if (!incomingRide || !token) return;
    
    try {
      const res = await axios.put(
        `${API_BASE}/drivers/${incomingRide.rideId}`,
        { status },
        { 
          headers: { 
            Authorization: `Bearer ${token}` 
          } 
        }
      );
      
      if (status === "Accepted") {
        // Start continuous location tracking for active ride
        startLocationTracking();
        navigation.navigate("ActiveRideScreen", { rideId: incomingRide.rideId });
      }
      
      setIncomingRide(null);
      setShowRideModal(false);
      Alert.alert(`Ride ${status}`, `Ride has been ${status.toLowerCase()}`);
    } catch (err: any) {
      console.log("Ride action error:", err);
      Alert.alert("Error", "Failed to update ride status");
    }
  };

  const startLocationTracking = () => {
    if (!token) return;
    
    Geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentLocation({ latitude, longitude });
        await sendLocationToBackend({ latitude, longitude });
      },
      (err) => console.log("Location tracking error:", err),
      { 
        enableHighAccuracy: true, 
        distanceFilter: 5, 
        interval: 5000 
      }
    );
  };

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    
    // When going online, update location immediately
    if (newStatus && currentLocation) {
      await sendLocationToBackend(currentLocation);
    }
  };

  if (loading || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text>Loading map...</Text>
      </View>
    );
  }

  const menuItems = [
    { label: "Payments", icon: "payment", screen: "PaymentScreen" },
    { label: "My Rides", icon: "time-to-leave", screen: "RidersScreen" },
    { label: "Refer and Earn", icon: "card-giftcard", screen: "ReferScreen" },
    { label: "Rewards", icon: "emoji-events", screen: "RewardsScreen" },
    { label: "Power Pass", icon: "bolt", screen: "PowerPassScreen" },
    { label: "Settings", icon: "settings", screen: "SettingsScreen" },
    { label: "Support", icon: "support-agent", screen: "SupportScreen" },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <MaterialIcons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        <Image source={{ uri: 'https://via.placeholder.com/35' }} style={styles.avatar} />
      </View>
      
      {/* Banner */}
      <View style={styles.banner}>
        <Text style={{ color: "#fff" }}>
          Welcome! You are {isOnline ? "Online" : "Offline"}
        </Text>
      </View>
      
      {/* Online Toggle */}
      <TouchableOpacity
        style={[styles.onlineButton, { backgroundColor: isOnline ? "green" : "red" }]}
        onPress={toggleOnlineStatus}
      >
        <Text style={{ color: "#fff" }}>
          {isOnline ? "Go Offline" : "Go Online"}
        </Text>
      </TouchableOpacity>
      
      {/* Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        region={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={currentLocation} title="You" pinColor="green" />
      </MapView>
      
      {/* Ride Request Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showRideModal}
        onRequestClose={() => setShowRideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rideModal}>
            <Text style={styles.modalTitle}>New Ride Request</Text>
            
            <View style={styles.rideDetail}>
              <Text style={styles.detailLabel}>Customer ID:</Text>
              <Text style={styles.detailValue}>{incomingRide?.customerId}</Text>
            </View>
            
            <View style={styles.rideDetail}>
              <Text style={styles.detailLabel}>Customer Name:</Text>
              <Text style={styles.detailValue}>{incomingRide?.name}</Text>
            </View>
            
            <View style={styles.rideDetail}>
              <Text style={styles.detailLabel}>Pickup Location:</Text>
              <Text style={styles.detailValue}>{incomingRide?.pickupLocation}</Text>
            </View>
            
            <View style={styles.rideDetail}>
              <Text style={styles.detailLabel}>Drop Location:</Text>
              <Text style={styles.detailValue}>{incomingRide?.dropoffLocation}</Text>
            </View>
            
            <View style={styles.rideDetail}>
              <Text style={styles.detailLabel}>Fare:</Text>
              <Text style={styles.detailValue}>${incomingRide?.fare}</Text>
            </View>
            
            <View style={styles.rideDetail}>
              <Text style={styles.detailLabel}>Distance:</Text>
              <Text style={styles.detailValue}>{incomingRide?.distance} km</Text>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: "red" }]} 
                onPress={() => handleRideAction("Cancelled")}
              >
                <Text style={styles.buttonText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "green" }]}
                onPress={() => handleRideAction("Accepted")}
              >
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Side Menu Overlay */}
      {menuVisible && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.overlayBackground} onPress={() => setMenuVisible(false)} />
          <LinearGradient colors={["#FFD54F", "#FFEE58"]} style={styles.sideMenu}>
            <View style={styles.profileSection}>
              <View style={styles.avatar} />
              <View>
                <Text style={styles.profileName}>Driver</Text>
                <Text style={styles.profilePhone}>{driverId || "Loading..."}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <ScrollView>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuRow}
                  onPress={() => {
                    setMenuVisible(false);
                    navigation.navigate(item.screen);
                  }}
                >
                  <MaterialIcons name={item.icon} size={22} color="#333" style={{ marginRight: 12 }} />
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const { width } = Dimensions.get("window");
const styles = StyleSheet.create({
  loadingContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#4caf50",
    justifyContent: "space-between",
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "bold" 
  },
  avatar: { 
    width: 35, 
    height: 35, 
    borderRadius: 17.5 
  },
  banner: { 
    backgroundColor: "#2196f3", 
    padding: 10, 
    alignItems: "center" 
  },
  onlineButton: { 
    position: "absolute", 
    top: 90, 
    right: 20, 
    padding: 10, 
    borderRadius: 5, 
    zIndex: 10 
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    flexDirection: "row",
    zIndex: 100,
  },
  overlayBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.3)" 
  },
  sideMenu: { 
    width: width * 0.7, 
    padding: 15 
  },
  profileSection: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  profileName: { 
    fontWeight: "bold", 
    fontSize: 16 
  },
  profilePhone: { 
    color: "#555" 
  },
  divider: { 
    height: 1, 
    backgroundColor: "#ccc", 
    marginVertical: 10 
  },
  menuRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 12 
  },
  menuLabel: { 
    fontSize: 15 
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  rideModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  rideDetail: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#555',
  },
  detailValue: {
    flex: 1,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});



// // src/Screen1.tsx
// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   TouchableOpacity,
//   Image,
//   Alert,
//   Dimensions,
//   ScrollView,
// } from "react-native";
// import { io, Socket } from "socket.io-client";
// import MapView, { Marker } from "react-native-maps";
// import Geolocation from "@react-native-community/geolocation";
// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import MaterialIcons from "react-native-vector-icons/MaterialIcons";
// import LinearGradient from "react-native-linear-gradient";
// import { useNavigation } from "@react-navigation/native";
// import { API_BASE, SOCKET_URL } from "./apiConfig"; // Now this import will work

// export default function MapScreen() {
//   const navigation = useNavigation<any>();
//   const mapRef = useRef<MapView>(null);
//   const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [isOnline, setIsOnline] = useState(true);
//   const [incomingRide, setIncomingRide] = useState<any>(null);
//   const [menuVisible, setMenuVisible] = useState(false);
//   const [driverId, setDriverId] = useState<string | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [socket, setSocket] = useState<Socket | null>(null);

//   // Load driver data from AsyncStorage
//   useEffect(() => {
//     const loadDriverData = async () => {
//       try {
//         const savedDriverId = await AsyncStorage.getItem("driverId");
//         const savedToken = await AsyncStorage.getItem("authToken");
        
//         if (savedDriverId && savedToken) {
//           setDriverId(savedDriverId);
//           setToken(savedToken);
          
//           // Initialize socket connection
//           const newSocket = io(SOCKET_URL, {
//             auth: {
//               token: savedToken
//             }
//           });
          
//           newSocket.emit("joinDriverRoom", savedDriverId);
//           newSocket.on("newRide", (ride: any) => {
//             console.log("New ride received:", ride);
//             setIncomingRide(ride);
//           });
          
//           setSocket(newSocket);
//         } else {
//           // Redirect to login if no credentials
//           navigation.replace("LoginScreen");
//         }
//       } catch (error) {
//         console.error("Failed to load driver data", error);
//         navigation.replace("LoginScreen");
//       }
//     };
    
//     loadDriverData();
    
//     return () => {
//       if (socket) {
//         socket.disconnect();
//       }
//     };
//   }, []);

//   // Location tracking
//   useEffect(() => {
//     if (!token) return;
    
//     const watchId = Geolocation.watchPosition(
//       async (pos) => {
//         const coords = { 
//           latitude: pos.coords.latitude, 
//           longitude: pos.coords.longitude 
//         };
        
//         setCurrentLocation(coords);
//         setLoading(false);
        
//         if (isOnline) {
//           await sendLocationToBackend(coords);
//         }
//       },
//       (err) => {
//         console.log("Location error:", err.message);
//         setLoading(false);
//         Alert.alert("Error", "Failed to get location.");
//       },
//       { 
//         enableHighAccuracy: true, 
//         distanceFilter: 5, 
//         interval: 5000 
//       }
//     );
    
//     return () => Geolocation.clearWatch(watchId);
//   }, [isOnline, token]);

//   const sendLocationToBackend = async (coords: { latitude: number; longitude: number }) => {
//     if (!token) return;
    
//     try {
//       await axios.post(
//         `${API_BASE}/drivers/update-location`,
//         coords,
//         { 
//           headers: { 
//             Authorization: `Bearer ${token}` 
//           } 
//         }
//       );
//     } catch (err) {
//       console.log("Location update error:", err);
//     }
//   };

//   const handleRideAction = async (status: "Accepted" | "Cancelled") => {
//     if (!incomingRide || !token) return;
    
//     try {
//       const res = await axios.put(
//         `${API_BASE}/drivers/${incomingRide._id}`,
//         { status },
//         { 
//           headers: { 
//             Authorization: `Bearer ${token}` 
//           } 
//         }
//       );
      
//       if (status === "Accepted") {
//         // Start continuous location tracking for active ride
//         startLocationTracking();
//       }
      
//       setIncomingRide(null);
//       Alert.alert(`Ride ${status}`, `Ride has been ${status.toLowerCase()}`);
//     } catch (err: any) {
//       console.log("Ride action error:", err);
//       Alert.alert("Error", "Failed to update ride status");
//     }
//   };

//   const startLocationTracking = () => {
//     if (!token) return;
    
//     Geolocation.watchPosition(
//       async (pos) => {
//         const { latitude, longitude } = pos.coords;
//         setCurrentLocation({ latitude, longitude });
//         await sendLocationToBackend({ latitude, longitude });
//       },
//       (err) => console.log("Location tracking error:", err),
//       { 
//         enableHighAccuracy: true, 
//         distanceFilter: 5, 
//         interval: 5000 
//       }
//     );
//   };

//   const toggleOnlineStatus = async () => {
//     setIsOnline(!isOnline);
    
//     // When going online, update location immediately
//     if (!isOnline && currentLocation) {
//       await sendLocationToBackend(currentLocation);
//     }
//   };

//   if (loading || !currentLocation) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#4caf50" />
//         <Text>Loading map...</Text>
//       </View>
//     );
//   }

//   const menuItems = [
//     { label: "Payments", icon: "payment", screen: "PaymentScreen" },
//     { label: "My Rides", icon: "time-to-leave", screen: "RidersScreen" },
//     { label: "Refer and Earn", icon: "card-giftcard", screen: "ReferScreen" },
//     { label: "Rewards", icon: "emoji-events", screen: "RewardsScreen" },
//     { label: "Power Pass", icon: "bolt", screen: "PowerPassScreen" },
//     { label: "Settings", icon: "settings", screen: "SettingsScreen" },
//     { label: "Support", icon: "support-agent", screen: "SupportScreen" },
//   ];

//   return (
//     <View style={{ flex: 1 }}>
//       {/* Header */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => setMenuVisible(true)}>
//           <MaterialIcons name="menu" size={28} color="#fff" />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>Driver Dashboard</Text>
//         <Image source={{ uri: 'https://via.placeholder.com/35' }} style={styles.avatar} />
//       </View>
      
//       {/* Banner */}
//       <View style={styles.banner}>
//         <Text style={{ color: "#fff" }}>
//           Welcome! You are {isOnline ? "Online" : "Offline"}
//         </Text>
//       </View>
      
//       {/* Online Toggle */}
//       <TouchableOpacity
//         style={[styles.onlineButton, { backgroundColor: isOnline ? "green" : "red" }]}
//         onPress={toggleOnlineStatus}
//       >
//         <Text style={{ color: "#fff" }}>
//           {isOnline ? "Go Offline" : "Go Online"}
//         </Text>
//       </TouchableOpacity>

//       {/* Incoming Ride Card */}
//       {incomingRide && (
//         <View style={styles.rideCard}>
//           <Text style={{ fontWeight: "bold", fontSize: 16 }}>New Ride Request</Text>
//           <Text>Customer: {incomingRide.name || "Unknown"}</Text>
//           <Text>Pickup: {incomingRide.pickupLocation || "Unknown location"}</Text>
//           <Text>Drop: {incomingRide.dropoffLocation || "Unknown location"}</Text>
//           <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
//             <TouchableOpacity 
//               style={[styles.button, { backgroundColor: "green" }]} 
//               onPress={() => handleRideAction("Accepted")}
//             >
//               <Text style={{ color: "#fff" }}>Accept</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={[styles.button, { backgroundColor: "red" }]}
//               onPress={() => navigation.navigate("RejectRideScreen", { rideId: incomingRide._id })}
//             >
//               <Text style={{ color: "#fff" }}>Reject</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {/* Map */}
//       <MapView
//         ref={mapRef}
//         style={{ flex: 1 }}
//         region={{
//           latitude: currentLocation.latitude,
//           longitude: currentLocation.longitude,
//           latitudeDelta: 0.05,
//           longitudeDelta: 0.05,
//         }}
//       >
//         <Marker coordinate={currentLocation} title="You" pinColor="green" />
//       </MapView>

//       {/* Side Menu Overlay */}
//       {menuVisible && (
//         <View style={styles.menuOverlay}>
//           <TouchableOpacity style={styles.overlayBackground} onPress={() => setMenuVisible(false)} />
//           <LinearGradient colors={["#FFD54F", "#FFEE58"]} style={styles.sideMenu}>
//             <View style={styles.profileSection}>
//               <View style={styles.avatar} />
//               <View>
//                 <Text style={styles.profileName}>Driver</Text>
//                 <Text style={styles.profilePhone}>{driverId || "Loading..."}</Text>
//               </View>
//             </View>
//             <View style={styles.divider} />
//             <ScrollView>
//               {menuItems.map((item, index) => (
//                 <TouchableOpacity
//                   key={index}
//                   style={styles.menuRow}
//                   onPress={() => {
//                     setMenuVisible(false);
//                     navigation.navigate(item.screen);
//                   }}
//                 >
//                   <MaterialIcons name={item.icon} size={22} color="#333" style={{ marginRight: 12 }} />
//                   <Text style={styles.menuLabel}>{item.label}</Text>
//                 </TouchableOpacity>
//               ))}
//             </ScrollView>
//           </LinearGradient>
//         </View>
//       )}
//     </View>
//   );
// }

// const { width } = Dimensions.get("window");
// const styles = StyleSheet.create({
//   loadingContainer: { 
//     flex: 1, 
//     justifyContent: "center", 
//     alignItems: "center" 
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 10,
//     backgroundColor: "#4caf50",
//     justifyContent: "space-between",
//   },
//   rideCard: { 
//     position: "absolute", 
//     bottom: 50, 
//     left: 20, 
//     right: 20, 
//     backgroundColor: "#fff", 
//     padding: 15, 
//     borderRadius: 10, 
//     zIndex: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   button: { 
//     paddingVertical: 8, 
//     paddingHorizontal: 15, 
//     borderRadius: 5, 
//     minWidth: 100, 
//     alignItems: "center" 
//   },
//   headerTitle: { 
//     color: "#fff", 
//     fontSize: 18, 
//     fontWeight: "bold" 
//   },
//   avatar: { 
//     width: 35, 
//     height: 35, 
//     borderRadius: 17.5 
//   },
//   banner: { 
//     backgroundColor: "#2196f3", 
//     padding: 10, 
//     alignItems: "center" 
//   },
//   onlineButton: { 
//     position: "absolute", 
//     top: 90, 
//     right: 20, 
//     padding: 10, 
//     borderRadius: 5, 
//     zIndex: 10 
//   },
//   menuOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     bottom: 0,
//     right: 0,
//     flexDirection: "row",
//     zIndex: 100,
//   },
//   overlayBackground: { 
//     flex: 1, 
//     backgroundColor: "rgba(0,0,0,0.3)" 
//   },
//   sideMenu: { 
//     width: width * 0.7, 
//     padding: 15 
//   },
//   profileSection: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     marginBottom: 10 
//   },
//   profileName: { 
//     fontWeight: "bold", 
//     fontSize: 16 
//   },
//   profilePhone: { 
//     color: "#555" 
//   },
//   divider: { 
//     height: 1, 
//     backgroundColor: "#ccc", 
//     marginVertical: 10 
//   },
//   menuRow: { 
//     flexDirection: "row", 
//     alignItems: "center", 
//     paddingVertical: 12 
//   },
//   menuLabel: { 
//     fontSize: 15 
//   },
// });
