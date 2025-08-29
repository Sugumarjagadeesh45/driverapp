import React, { useEffect, useState } from "react";
import MapView, { Marker, Polyline } from "react-native-maps";
import { View, StyleSheet } from "react-native";
import PolylineDecoder from "@mapbox/polyline";

const GOOGLE_API_KEY = "YOUR_API_KEY";

interface LatLng {
  lat: number;
  lng: number;
}

interface RideMapProps {
  pickup: LatLng;
  drop: LatLng;
}

export default function RideMap({ pickup, drop }: RideMapProps) {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }[]>([]);

  useEffect(() => {
    fetchRoute();
  }, []);

  const fetchRoute = async () => {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.lat},${pickup.lng}&destination=${drop.lat},${drop.lng}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.routes.length) {
        const points = PolylineDecoder.decode(
          data.routes[0].overview_polyline.points
        ).map(([lat, lng]) => ({ latitude: lat, longitude: lng }));

        setCoords(points);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: pickup.lat,
          longitude: pickup.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} title="Pickup" />
        <Marker coordinate={{ latitude: drop.lat, longitude: drop.lng }} title="Drop" />
        {coords.length > 0 && (
          <Polyline coordinates={coords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
