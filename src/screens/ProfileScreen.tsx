import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Deal } from '../types';
import QRCode from 'react-qr-code';

const ProfileScreen = () => {
  const { user, logout } = useAuth();
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [postedDeals, setPostedDeals] = useState<Deal[]>([]);
  const [redeemedCoupons, setRedeemedCoupons] = useState<any[]>([]);
  const [businessRedeemed, setBusinessRedeemed] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const favQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    const unsubscribeFav = onSnapshot(favQuery, (snapshot) => setFavoritesCount(snapshot.size));

    const dealsQuery = query(collection(db, 'deals'), where('createdBy', '==', user.uid));
    const unsubscribeDeals = onSnapshot(dealsQuery, (snapshot) => {
      setPostedDeals(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
    });

    const redeemedQuery = query(collection(db, 'redeemedCoupons'), where('userId', '==', user.uid));
    const unsubscribeRedeemed = onSnapshot(redeemedQuery, (snapshot) => {
      setRedeemedCoupons(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
    });

    return () => {
      unsubscribeFav();
      unsubscribeDeals();
      unsubscribeRedeemed();
    };
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'business' || postedDeals.length === 0) return;
    const dealIds = postedDeals.map(d => d.id);
    const businessQuery = query(collection(db, 'redeemedCoupons'), where('dealId', 'in', dealIds));
    const unsubscribeBusiness = onSnapshot(businessQuery, (snapshot) => {
      setBusinessRedeemed(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) })));
    });
    return unsubscribeBusiness;
  }, [user, postedDeals]);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleDelete = async (dealId: string) => {
    Alert.alert('Delete deal', 'Are you sure you want to remove this deal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteDoc(doc(db, 'deals', dealId));
        },
      },
    ]);
  };

  const handleOpenScanner = () => {
    navigation.navigate('Scanner');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.role}>{user?.role === 'business' ? 'Business account' : 'Customer account'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{favoritesCount}</Text>
          <Text style={styles.statLabel}>Favorites</Text>
        </View>
        {user?.role === 'business' && (
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{postedDeals.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My deals</Text>
        {user?.role === 'business' ? (
          postedDeals.length ? (
            <FlatList
              data={postedDeals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.dealRow}>
                  <View>
                    <Text style={styles.dealTitle}>{item.title}</Text>
                    <Text style={styles.dealMeta}>{item.discount} • {item.location}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <Text style={styles.emptyText}>You have not posted any deals yet.</Text>
          )
        ) : (
          <Text style={styles.emptyText}>Switch to a business account to post and manage deals.</Text>
        )}
      </View>

      {user?.role === 'business' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Redeemed coupons</Text>
            <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner}>
              <Text style={styles.scanButtonText}>Open Scanner</Text>
            </TouchableOpacity>
          </View>
          {businessRedeemed.length ? (
            <FlatList
              data={businessRedeemed}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const deal = postedDeals.find(d => d.id === item.dealId);
                const qrData = JSON.stringify({
                  code: item.redemptionCode,
                  deal: item.dealTitle,
                });
                return (
                  <View style={styles.couponRow}>
                    <View style={styles.couponInfo}>
                      <Text style={styles.couponTitle}>{deal?.title || 'Unknown deal'}</Text>
                      <Text style={styles.couponCode}>Code: {item.redemptionCode}</Text>
                      <Text style={styles.couponMeta}>Redeemed: {new Date(item.redeemedAt.seconds * 1000).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.qrContainer}>
                      <Text style={styles.qrLabel}>Scan to Verify</Text>
                      <QRCode 
                        value={qrData} 
                        size={70} 
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <Text style={styles.emptyText}>No coupons redeemed yet.</Text>
          )}
        </View>
      )}

      {user?.role !== 'business' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My redeemed coupons</Text>
          {redeemedCoupons.length ? (
            <FlatList
              data={redeemedCoupons}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const qrData = JSON.stringify({
                  code: item.redemptionCode,
                  deal: item.dealTitle,
                });
                return (
                  <View style={styles.couponRow}>
                    <View style={styles.couponInfo}>
                      <Text style={styles.couponTitle}>{item.dealTitle}</Text>
                      <Text style={styles.couponMeta}>{item.dealDiscount} • Redeemed: {new Date(item.redeemedAt.seconds * 1000).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.qrContainer}>
                      <Text style={styles.qrLabel}>Scan to Verify</Text>
                      <QRCode 
                        value={qrData} 
                        size={80} 
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                      />
                    </View>
                  </View>
                );
              }}
            />
          ) : (
            <Text style={styles.emptyText}>You have not redeemed any coupons yet.</Text>
          )}
        </View>
      )}

      <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F6F8FB',
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  email: {
    color: '#666',
    marginBottom: 8,
  },
  role: {
    color: '#0A84FF',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    color: '#666',
    marginTop: 6,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButton: {
    backgroundColor: '#0A84FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  dealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dealTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  dealMeta: {
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  emptyText: {
    color: '#666',
    lineHeight: 22,
  },
  couponRow: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  couponInfo: {
    marginBottom: 8,
  },
  qrContainer: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginTop: 8,
  },
  qrLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  couponTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  couponCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A84FF',
    marginTop: 4,
  },
  couponMeta: {
    color: '#666',
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default ProfileScreen;
