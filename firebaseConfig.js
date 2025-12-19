// firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
    apiKey: "AIzaSyCL_Kh2GAsLvaFIdVOzOvDTqyLa_zijkOI",
    authDomain: "curlytask.firebaseapp.com",
    projectId: "curlytask",
    storageBucket: "curlytask.firebasestorage.app",
    messagingSenderId: "859956416154",
    appId: "1:859956416154:android:5ebf8b2c344061c7b7d923",
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Initialize Auth with AsyncStorage persistence
let auth;
try {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
    });
} catch (error) {
    // If auth is already initialized, just get it
    auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
