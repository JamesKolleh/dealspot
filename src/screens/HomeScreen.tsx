import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { collection, onSnapshot, query, orderBy, setDoc, deleteDoc, doc, where } from 'firebase/firestore';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { db } from '../lib/firebase';
import { Deal } from '../types';
import DealCard from '../components/DealCard';
import { DEAL_CATEGORIES } from '../constants/categories';
import { useAuth } from '../context/AuthContext';

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [locationLabel, setLocationLabel] = useState('');

  useEffect(() => {
    // Simplified query without complex filters that require composite indexes
    const dealsQuery = query(
      collection(db, 'deals'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(dealsQuery, (snapshot) => {
      const dealList: Deal[] = snapshot.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
        .filter((deal) => {
          // Filter for non-expired deals on the client side
          const expiryDate = typeof deal.expiryDate === 'string'
            ? new Date(deal.expiryDate)
            : new Date(deal.expiryDate.seconds * 1000);
          return expiryDate > new Date();
        })
        .sort((a, b) => {
          // Sort: featured first, then by creation date
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
      console.log('🔄 Deals loaded:', dealList.length);
      setDeals(dealList);
    }, (error) => {
      console.error('❌ Error loading deals:', error);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const favoritesQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));
    return onSnapshot(favoritesQuery, (snapshot) => {
      setFavorites(snapshot.docs.map((doc) => (doc.data() as any).dealId));
    });
  }, [user]);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const address = await Location.reverseGeocodeAsync(current.coords);
        const label = address[0]?.city || address[0]?.region || 'Nearby';
        setLocationLabel(label);
      } catch {
        setLocationLabel('Nearby');
      }
    };
    loadLocation();
  }, []);

  const filteredDeals = useMemo(() => {
    return deals
      .filter((deal) => {
        const matchesSearch = deal.title.toLowerCase().includes(search.toLowerCase()) || deal.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = category === 'All' || deal.category === category;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      });
  }, [deals, search, category]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Deals in {locationLabel || 'your area'}</Text>
        <Text style={styles.subtitle}>Explore curated offers from local businesses.</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search deals or categories"
        placeholderTextColor="#999"
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.categoryRow}>
        <TouchableOpacity onPress={() => setCategory('All')} style={[styles.categoryChip, category === 'All' && styles.categoryChipActive]}>
          <Text style={[styles.categoryText, category === 'All' && styles.categoryTextActive]}>All</Text>
        </TouchableOpacity>
        {DEAL_CATEGORIES.map((item) => (
          <TouchableOpacity key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipActive]}>
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredDeals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <DealCard
            deal={item}
            isFavorite={favorites.includes(item.id)}
            onPress={() => navigation.navigate('DealDetails', { dealId: item.id })}
            onFavoritePress={async () => {
              if (!user) return;
              const favoriteId = `${user.uid}_${item.id}`;
              const favoriteRef = doc(db, 'favorites', favoriteId);
              const existingFavorite = favorites.includes(item.id);
              if (existingFavorite) {
                await deleteDoc(favoriteRef);
                return;
              }
              await setDoc(favoriteRef, {
                userId: user.uid,
                dealId: item.id,
                createdAt: new Date(),
              });
            }}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No deals match your filters.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
    marginTop: 6,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryChipActive: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  categoryText: {
    color: '#111',
  },
  categoryTextActive: {
    color: '#fff',
  },
  list: {
    paddingBottom: 30,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
    marginTop: 30,
  },
});

export default HomeScreen;
