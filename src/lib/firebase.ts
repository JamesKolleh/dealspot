import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDHlKPCL3KD4yHG3pBGRQmIIMH3msd3YX8",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "dealspot-9da30.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "dealspot-9da30",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "dealspot-9da30.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "450957608071",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:450957608071:web:ca20196483c32c2fa4e422",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-13RHQFSCMS"
};

// Validate that all required config values are present
type FirebaseConfigKeys = keyof typeof firebaseConfig;

const requiredConfig: FirebaseConfigKeys[] = [
  'apiKey', 'authDomain', 'projectId', 'storageBucket',
  'messagingSenderId', 'appId'
];

const missingConfig = requiredConfig.filter(
  key => !firebaseConfig[key]
);

if (missingConfig.length > 0) {
  console.error('Missing Firebase configuration:', missingConfig);
  console.error('Current config:', firebaseConfig);
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
