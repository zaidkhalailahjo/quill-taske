import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithCustomToken, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCfoP0rgX8WZthQVP_AeZcxDHHCllgu3TM",
    authDomain: "quill-world.firebaseapp.com",
    projectId: "quill-world",
    storageBucket: "quill-world.firebasestorage.app",
    messagingSenderId: "339188796023",
    appId: "1:339188796023:web:e0a1ba750b49909220d472",
    measurementId: "G-BMEZ49L6CN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'quill-world-system';

export { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signInWithCustomToken, signInAnonymously };
export { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc, query, orderBy, limit, where };
