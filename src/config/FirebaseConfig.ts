// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage} from "@firebase/storage";
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import app from '@react-native-firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBYzMe-ekoaR_pRQw3IchnS6qQ_W5UR2ms",
    authDomain: "construction-database-5ef54.firebaseapp.com",
    databaseURL: "https://construction-database-5ef54-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "construction-database-5ef54",
    storageBucket: "construction-database-5ef54.firebasestorage.app",
    messagingSenderId: "348686132981",
    appId: "1:348686132981:web:f699838548694e0a8d47bc",
    measurementId: "G-3MJFQ9R50Q"
};

// Initialize Firebase - React Native Firebase auto-initializes
export const FIREBASE_APP = app;
export const FIREBASE_AUTH = auth;
export const FIREBASE_DB = firestore;
export const FIREBASE_STRGE = storage; 