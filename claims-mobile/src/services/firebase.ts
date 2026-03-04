import { initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { Claim, Message } from '../types';

//Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCc6eyWQZCcWiY2YCaUFb_1fLX9wZDoRVw",
  authDomain: "claimstrack.firebaseapp.com",
  projectId: "claimstrack",
  storageBucket: "claimstrack.firebasestorage.app",
  messagingSenderId: "488121460286",
  appId: "1:488121460286:web:0e7b55fab5f4f42ae2936f"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth

export const loginUser = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const registerUser = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logoutUser = () => signOut(auth);

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) =>
  onAuthStateChanged(auth, callback);

// Claims

export const createClaim = async (claimData: Omit<Claim, 'id'>) => {
  const docRef = await addDoc(collection(db, 'claims'), {
    ...claimData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateClaim = async (claimId: string, updates: Partial<Claim>) => {
  await updateDoc(doc(db, 'claims', claimId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};



export const getUserClaims = (
  userId: string,
  callback: (claims: Claim[]) => void
) => {
  const q = query(collection(db, 'claims'), where('userId', '==', userId));
  return onSnapshot(q, (snapshot) => {
    const claims = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
      updatedAt: d.data().updatedAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    })) as Claim[];
    claims.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    callback(claims);
  });
};

export const getClaimById = async (claimId: string): Promise<Claim | null> => {
  const docSnap = await getDoc(doc(db, 'claims', claimId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Claim;
};

export const listenToClaim = (
  claimId: string,
  callback: (claim: Claim) => void
) => {
  return onSnapshot(doc(db, 'claims', claimId), (docSnap) => {
    if (docSnap.exists()) {
      callback({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() ?? '',
        updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() ?? '',
      } as Claim);
    }
  });
};



//Messages

export const sendMessage = async (
  claimId: string,
  message: Omit<Message, 'id'>
) => {
  await addDoc(collection(db, 'claims', claimId, 'messages'), {
    ...message,
    timestamp: serverTimestamp(),
  });
};

export const listenToMessages = (
  claimId: string,
  callback: (messages: Message[]) => void
) => {
  const q = query(
    collection(db, 'claims', claimId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      timestamp:
        d.data().timestamp?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    })) as Message[];
    callback(messages);
  });
};



//Storage

export const uploadDocument = (
  uri: string,
  path: string,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          onProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        reject,
        async () => {
          resolve(await getDownloadURL(uploadTask.snapshot.ref));
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};