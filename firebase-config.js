// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCfoP0rgX8WZthQVP_AeZcxDHHCllgu3TM",
    authDomain: "quill-world.firebaseapp.com",
    projectId: "quill-world",
    storageBucket: "quill-world.firebasestorage.app",
    messagingSenderId: "339188796023",
    appId: "1:339188796023:web:e0a1ba750b49909220d472",
    measurementId: "G-BMEZ49L6CN"
};

// تهيئة المشروع الأساسي
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = 'quill-world-system';

// تهيئة مشروع التخزين المنفصل (إن وجد)
const firebaseConfigStorage = {
    apiKey: "AIzaSyBjPerebbHAtkKWJV_LFkoaL-15oTNHRdg",
    authDomain: "quill-worl.firebaseapp.com",
    projectId: "quill-worl",
    storageBucket: "quill-worl.firebasestorage.app",
    messagingSenderId: "192227363160",
    appId: "1:192227363160:web:59a620429b4bfdfb7cfd2d",
    measurementId: "G-NLY5LN0830"
};
export const appStorage = initializeApp(firebaseConfigStorage, "StorageApp");
export const dbStorage = getFirestore(appStorage);
