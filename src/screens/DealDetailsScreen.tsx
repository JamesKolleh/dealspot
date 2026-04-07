import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Deal } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'DealDetails'>;

const DealDetailsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { dealId } = route.params;
  const { user } = useAuth();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    const loadDeal = async () => {
      const dealSnap = await getDoc(doc(db, 'deals', dealId));
      if (dealSnap.exists()) {
        setDeal({ id: dealSnap.id, ...(dealSnap.data() as any) });
      }
    };
    loadDeal();
  }, [dealId]);

  useEffect(() => {
    if (!user) return;
    const favoriteId = `${user.uid}_${dealId}`;
    getDoc(doc(db, 'favorites', favoriteId)).then((snapshot) => setFavorite(snapshot.exists()));
    getDoc(doc(db, 'redeemedCoupons', favoriteId)).then((snapshot) => setRedeemed(snapshot.exists()));
  }, [dealId, user]);

  const handleFavorite = async () => {
    if (!user) return;
    const favoriteRef = doc(db, 'favorites', `${user.uid}_${dealId}`);
    if (favorite) {
      await deleteDoc(favoriteRef);
      setFavorite(false);
      return;
    }
    await setDoc(favoriteRef, { userId: user.uid, dealId, createdAt: new Date() });
    setFavorite(true);
  };

  const handleRedeem = async () => {
    if (!user || !deal) return;
    const expiryDate = typeof deal.expiryDate === 'string'
      ? new Date(deal.expiryDate)
      : new Date(deal.expiryDate.seconds * 1000);

    if (expiryDate < new Date()) {
      Alert.alert('Expired', 'This deal has already expired.');
      return;
    }
    if (redeemed) {
      Alert.alert('Already redeemed', 'You have already redeemed this coupon.');
      return;
    }

    // Generate a unique 6-character redemption code
    const redemptionCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await setDoc(doc(db, 'redeemedCoupons', `${user.uid}_${dealId}`), {
      userId: user.uid,
      dealId,
      redeemedAt: new Date(),
      redemptionCode,
      createdBy: deal.createdBy,
      dealTitle: deal.title,
      dealDiscount: deal.discount,
    });
    await updateDoc(doc(db, 'deals', dealId), { redeemedCount: increment(1) });
    setRedeemed(true);
    Alert.alert('Coupon redeemed', `Your redemption code is: ${redemptionCode}. Show this to the merchant.`);
  };

  if (!deal) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading offer...</Text>
      </View>
    );
  }

  const expiryText = typeof deal.expiryDate === 'string'
    ? new Date(deal.expiryDate).toLocaleDateString()
    : new Date(deal.expiryDate.seconds * 1000).toLocaleDateString();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.discount}>{deal.discount}</Text>
        <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
          <Text style={styles.favoriteText}>{favorite ? 'Unfavorite' : 'Favorite'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{deal.title}</Text>
      <Text style={styles.category}>{deal.category}</Text>
      <Text style={styles.description}>{deal.description}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Location</Text>
        <Text style={styles.metaValue}>{deal.location}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Expires</Text>
        <Text style={styles.metaValue}>{expiryText}</Text>
      </View>
      <TouchableOpacity onPress={handleRedeem} style={[styles.redeemButton, redeemed && styles.redeemButtonDisabled]} disabled={redeemed}>
        <Text style={styles.redeemButtonText}>{redeemed ? 'Redeemed' : 'Redeem Coupon'}</Text>
      </TouchableOpacity>
      <Text style={styles.footerText}>This coupon is redeemable by customers and tracked in your account.</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    color: '#0A84FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  discount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A84FF',
  },
  favoriteButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  favoriteText: {
    color: '#0A84FF',
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#0A84FF',
    fontWeight: '700',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  metaRow: {
    marginBottom: 16,
  },
  metaLabel: {
    color: '#888',
    marginBottom: 4,
  },
  metaValue: {
    fontWeight: '600',
    color: '#111',
  },
  redeemButton: {
    backgroundColor: '#0A84FF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
  },
  redeemButtonDisabled: {
    backgroundColor: '#A3BFFA',
  },
  redeemButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  footerText: {
    color: '#666',
    marginTop: 20,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default DealDetailsScreen;
