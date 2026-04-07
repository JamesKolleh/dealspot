# Local Deals & Coupon App

A React Native Expo app with Firebase Authentication and Firestore for a local deals marketplace.

## What’s included

- Email/password authentication
- Customer and business account roles
- Nearby deals discovery with search and category filters
- Favorite deals support
- Deal details and coupon redemption flow
- Business deal posting and listing management
- Firestore security rules to protect user and business data

## Folder structure

- `App.tsx` — root app entry
- `src/context/AuthContext.tsx` — auth state, signup/login/logout
- `src/lib/firebase.ts` — Firebase initialization
- `src/navigation/` — app navigation flows
- `src/screens/` — feature screens
- `src/components/DealCard.tsx` — reusable deal card component
- `firestore.rules` — Firestore security rules

## Firebase setup

### Complete Firebase CLI Workflow

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **List your projects**:
   ```bash
   firebase projects:list
   ```

4. **Set active project**:
   ```bash
   firebase use your-project-id
   ```

5. **Create a web app** (for Expo/React Native):
   ```bash
   firebase apps:create web "Local Deals App"
   ```

6. **Get app configuration**:
   ```bash
   firebase apps:sdkconfig WEB your-app-id
   ```
   Copy the config values to your `.env` file as `EXPO_PUBLIC_FIREBASE_*` variables.

7. **Deploy Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Manual Console Steps (Required)

Since Firebase CLI cannot enable services, you must do these in the [Firebase Console](https://console.firebase.google.com):

1. **Enable Authentication**:
   - Go to Authentication → Get started
   - Sign-in method tab → Enable Email/Password

2. **Enable Firestore Database**:
   - Go to Firestore Database → Create database
   - Choose test mode (development) or production mode
   - Select a location (e.g., `us-central1`)

### Useful Firebase CLI Commands

```bash
# Check current project
firebase use

# List all apps in project
firebase apps:list

# Deploy specific services
firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting

# View project info
firebase projects:list

# Initialize new project (if needed)
firebase init
```

## Run the app

```bash
npm install
npm start
```

## Notes

- Business accounts can post offers and manage listings.
- User accounts can browse deals, save favorites, and redeem coupons.
- Firestore collections used: `users`, `deals`, `favorites`, `redeemedCoupons`.

## Firestore security rules

- Users can read all deals.
- Users can only create/read/update/delete their own user document.
- Businesses can only create/manage deals they created.
- Favorites and redeemed coupons can only be created/read by the current user.
