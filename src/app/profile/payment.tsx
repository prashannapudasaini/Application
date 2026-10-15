import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useCart } from '../../context/CartContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function PaymentScreen() {
  const { cartTotal } = useCart(); // Automatically pulls the total from your CartProvider

  const methods = ['eSewa', 'PhonePe', 'Bank Transfer'];

  return (
    <View style={styles.container}>
      <Text style={styles.totalText}>Total to Pay: ₹{cartTotal.toFixed(2)}</Text>
      {methods.map(method => (
        <TouchableOpacity key={method} style={styles.methodBtn} onPress={() => alert(`Redirecting to ${method}...`)}>
          <Text style={styles.methodText}>{method}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    padding: SPACING.l,
    justifyContent: 'center',
  },
  totalText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  methodBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.medium,
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  methodText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});