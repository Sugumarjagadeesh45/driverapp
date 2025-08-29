import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Transaction {
  _id: string;
  date: string;
  amount: number;
  type: "credit" | "debit";
  method: string;
}

const PaymentScreen = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const backendURL = "http://10.0.2.2:5001"; // Android emulator URL

  // Fetch wallet data
  const fetchWallet = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("driverToken"); // stored token
      if (!token) return Alert.alert("Error", "Token not found. Please login.");

      const res = await axios.get(`${backendURL}/api/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(res.data.balance);
      setTransactions(res.data.transactions);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle withdraw request
  const handleWithdraw = async () => {
    try {
      const token = await AsyncStorage.getItem("driverToken");
      if (!token) return Alert.alert("Error", "Token not found. Please login.");

      const amount = 100; // Example amount, you can take input later
      const res = await axios.post(
        `${backendURL}/api/wallet/withdraw`,
        { amount, method: "bank" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", res.data.message);
      fetchWallet(); // Refresh wallet data
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#f0fff0", "#e0f7fa"]} style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payments</Text>
      </View>

      {/* Balance Card */}
      <LinearGradient colors={["#4caf50", "#2e7d32"]} style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Withdraw</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Payment Methods */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Methods</Text>
        {[
          { label: "UPI", icon: "account-balance-wallet" },
          { label: "Bank Account", icon: "account-balance" },
          { label: "Cash", icon: "attach-money" },
        ].map((method, i) => (
          <TouchableOpacity key={i} style={styles.methodRow}>
            <MaterialIcons name={method.icon} size={22} color="#333" style={{ marginRight: 12 }} />
            <Text style={styles.methodText}>{method.label}</Text>
            <MaterialIcons name="chevron-right" size={22} color="#999" style={{ marginLeft: "auto" }} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.txRow}>
              <MaterialIcons
                name={item.type === "credit" ? "arrow-downward" : "arrow-upward"}
                size={20}
                color={item.type === "credit" ? "green" : "red"}
              />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.txMethod}>{item.method}</Text>
                <Text style={styles.txDate}>{new Date(item.date).toLocaleDateString()}</Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: item.type === "credit" ? "green" : "red" },
                ]}
              >
                {item.type === "credit" ? "+" : "-"}₹{item.amount}
              </Text>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    padding: 16,
    backgroundColor: "#fff",
    elevation: 3,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },

  balanceCard: {
    margin: 16,
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  balanceLabel: { color: "#fff", fontSize: 14 },
  balanceAmount: { color: "#fff", fontSize: 28, fontWeight: "bold", marginVertical: 10 },
  withdrawBtn: {
    backgroundColor: "#1b5e20",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 8,
  },

  section: { marginHorizontal: 16, marginTop: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 8, color: "#333" },

  methodRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 8,
    elevation: 2,
  },
  methodText: { fontSize: 15, fontWeight: "500", color: "#333" },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  txMethod: { fontSize: 14, fontWeight: "600", color: "#333" },
  txDate: { fontSize: 12, color: "#666" },
  txAmount: { fontSize: 15, fontWeight: "700" },
});

export default PaymentScreen;
