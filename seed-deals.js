#!/usr/bin/env node
/**
 * Seed sample deals into Firestore
 * Run: node seed-deals.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'dealspot-ac5b6',
});

const db = admin.firestore();

const sampleDeals = [
  {
    title: '50% Off Coffee',
    description: 'Get 50% discount on any coffee drink',
    discount: '50% off',
    category: 'Food',
    location: 'Downtown Coffee Shop',
    featured: true,
    createdBy: 'admin-demo',
    createdAt: admin.firestore.Timestamp.now(),
    expiryDate: admin.firestore.Timestamp.fromDate(new Date('2026-12-31')),
    redeemedCount: 0,
  },
  {
    title: 'Buy 1 Get 1 Pizza',
    description: 'Buy any large pizza and get another large pizza free',
    discount: 'Buy 1 Get 1',
    category: 'Food',
    location: 'Tony\'s Pizza Place',
    featured: false,
    createdBy: 'admin-demo',
    createdAt: admin.firestore.Timestamp.now(),
    expiryDate: admin.firestore.Timestamp.fromDate(new Date('2026-12-31')),
    redeemedCount: 0,
  },
  {
    title: '30% Off Clothing',
    description: 'All clothing items on sale - 30% discount',
    discount: '30% off',
    category: 'Retail',
    location: 'Fashion Hub Store',
    featured: true,
    createdBy: 'admin-demo',
    createdAt: admin.firestore.Timestamp.now(),
    expiryDate: admin.firestore.Timestamp.fromDate(new Date('2026-12-31')),
    redeemedCount: 0,
  },
  {
    title: 'Free Yoga Class',
    description: 'Try your first yoga class for free',
    discount: 'Free',
    category: 'Health',
    location: 'Zen Yoga Studio',
    featured: false,
    createdBy: 'admin-demo',
    createdAt: admin.firestore.Timestamp.now(),
    expiryDate: admin.firestore.Timestamp.fromDate(new Date('2026-12-31')),
    redeemedCount: 0,
  },
  {
    title: 'Movie Ticket Deal',
    description: 'Get 2 movie tickets for the price of 1',
    discount: '50% off',
    category: 'Entertainment',
    location: 'Cinema Palace',
    featured: false,
    createdBy: 'admin-demo',
    createdAt: admin.firestore.Timestamp.now(),
    expiryDate: admin.firestore.Timestamp.fromDate(new Date('2026-12-31')),
    redeemedCount: 0,
  },
];

async function seedDeals() {
  try {
    console.log('🌱 Seeding sample deals...');
    
    const batch = db.batch();
    
    for (const deal of sampleDeals) {
      const docRef = db.collection('deals').doc();
      batch.set(docRef, deal);
    }
    
    await batch.commit();
    console.log(`✅ Successfully added ${sampleDeals.length} sample deals!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding deals:', error);
    process.exit(1);
  }
}

seedDeals();
