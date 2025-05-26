
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Your web app's Firebase configuration

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

// Explicitly check if essential Firebase config values are present
if (!apiKey) {
  throw new Error(
    "Firebase API Key is missing. Please ensure NEXT_PUBLIC_FIREBASE_API_KEY is set correctly in your .env file and that the development server was restarted."
  );
}
if (!authDomain) {
  throw new Error(
    "Firebase Auth Domain is missing. Please ensure NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is set correctly in your .env file and that the development server was restarted."
  );
}
if (!projectId) {
  // Project ID is not always strictly required for client-side auth/firestore initialization if other configs are present,
  // but it's good practice and often needed for other services.
  console.warn(
    "Firebase Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID) is not set. This might cause issues with some Firebase services."
  );
}


const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db };
