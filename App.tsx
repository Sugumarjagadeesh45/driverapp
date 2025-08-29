// App.tsx
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./src/LoginScreen";
import Screen1 from "./src/Screen1";
import RideScreen from "./src/RideScreen";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import PaymentScreen from "./src/PaymentScreen";
import RidersScreen from "./src/RidersScreen";
import RejectRideScreen from "./src/RejectRideScreen"; // Add this import

export type RootStackParamList = {
  LoginScreen: undefined;
  Screen1: { isNewUser?: boolean; phone?: string };
  PaymentScreen: undefined;
  RidersScreen: undefined;
  RejectRideScreen: { rideId: string }; // Add this
};

const id: string = uuidv4();
console.log(id);

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="LoginScreen">
        <Stack.Screen 
          name="LoginScreen" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Screen1" 
          component={Screen1} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="RidersScreen" 
          component={RidersScreen} 
          options={{ title: "My Rides" }} 
        />
        <Stack.Screen 
          name="PaymentScreen" 
          component={PaymentScreen} 
          options={{ title: "Payments" }} 
        />
        <Stack.Screen 
          name="RejectRideScreen" 
          component={RejectRideScreen} 
          options={{ title: "Reject Ride" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


// import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import LoginScreen from "./src/LoginScreen";
// import Screen1 from "./src/Screen1";
// import RideScreen from "./src/RideScreen";
// import 'react-native-get-random-values';
// import { v4 as uuidv4 } from 'uuid';
// import PaymentScreen from "./src/PaymentScreen";
// import RidersScreen from "./src/RidersScreen";


// export type RootStackParamList = {
//   LoginScreen: undefined;
//   Screen1: { isNewUser?: boolean; phone?: string };
//   PaymentScreen: undefined;
//   RidersScreen: undefined;
// };
// const id: string = uuidv4();
// console.log(id);
// const Stack = createNativeStackNavigator<RootStackParamList>();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator initialRouteName="LoginScreen">
//         {/* ✅ Each screen must be wrapped in <Stack.Screen /> */}
//         <Stack.Screen name="LoginScreen" component={LoginScreen} />
//         <Stack.Screen name="Screen1" component={Screen1} />
//         <Stack.Screen name="RidersScreen" component={RidersScreen} />
//         <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
        

//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }
