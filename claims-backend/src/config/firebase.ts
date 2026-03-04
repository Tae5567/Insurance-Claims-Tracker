import * as admin from 'firebase-admin';
import path from 'path';

const serviceAccount = require('../../serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const db = admin.firestore();
export const auth = admin.auth();
export const messaging = admin.messaging();
export const storage = admin.storage();

export default admin;