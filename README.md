## ClaimTrack

A mobile insurance claims platform built with React Native, Expo, Firebase and Node.js.

![](assets/claim.png)
![](assets/details.png)

## Overview

ClaimTrack allows insurance customers to submit claims, upload supporting documents, track claim status in real-time and communicate with claims adjusters all from a mobile app.

---

## Features

- Multi-step claim submission (Motor, Home, Health, Travel, Life)
- Document upload via camera or gallery with automatic compression
- OCR document scanning via Google Vision API
- Real-time claim status tracking with Firestore live listeners
- In-app adjuster chat
- Push notifications on status change
- Biometric authentication (Face ID / Fingerprint)
- Offline draft saving with AsyncStorage sync
- JWT-authenticated Node.js REST API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native + TypeScript + Expo|
| State Management| Zustand |
| Backend | Node.js + Express + TypeScript |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Auth | Firebase Authentication |
| OCR | Google Cloud Vision API |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli eas-cli`
- Expo Go app on your phone (for device testing)
- Firebase project with Firestore, Storage, and Authentication enabled

### Mobile Setup

```bash
cd mobile
npm install
# Add your Firebase config to src/services/firebase.ts
npx expo start
```

### Backend Setup

```bash
cd backend
npm install
# Add serviceAccountKey.json from Firebase Console
# Copy .env.example to .env and fill in values
npm run dev
```

---

## Environment Variables

**Backend `.env`:**
```
PORT=3000
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
GOOGLE_VISION_API_KEY=your_key_here
```

---

## Demo

1. Register an account — a policy number is auto-assigned
2. Tap **New Claim** → select Motor → fill in incident details
3. Upload a photo of damage using camera or gallery
4. Submit — claim appears in real-time on the Claims tab
5. Tap the claim to view the status timeline

---

## Testing on Device

```bash
# Scan the QR code with Expo Go (iOS) or the Camera app (Android)
npx expo start

# Or run directly on connected device
npx expo run:ios --device
npx expo run:android --device
```