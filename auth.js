// js/auth.js
import { auth, db, appId } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js"; // تأكد من الاستيراد من firestore وليس auth للـ doc
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { showToast } from './ui.js';

// استيراد getDoc و doc من firestore بشكل صحيح
import { getDoc as fsGetDoc, doc as fsDoc, setDoc as fsSetDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const AppState = {
    currentUserAuth: null,
    currentUserData: null,
    hasPunchedInToday: true,
    SYSTEM_PASSWORD: '1112021'
};

window.checkSystemPassword = () =
    const input = document.getElementById('sysPasswordInput');
    const screen = document.getElementById('systemPasswordScreen');
    if(!input || !screen) return;
    
    if(input.value === AppState.SYSTEM_PASSWORD) {
        screen.classList.add('hidden');
        document.getElementById('loginScreen')?.classList.remove('hidden');
    } else {
        document.getElementById('sysPassError')?.classList.remove('hidden');
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        AppState.currentUserAuth = user;
        document.getElementById('systemPasswordScreen')?.classList.add('hidden');
        document.getElementById('loginScreen')?.classList.add('hidden');
        
        try {
            const docRef = fsDoc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
            const docSnap = await fsGetDoc(docRef);
            
            if (docSnap.exists()) {
                AppState.currentUserData = docSnap.data();
                document.getElementById('setupProfileScreen')?.classList.add('hidden');
                // استدعاء دالة البدء في app.js
                if(window.initWorkspace) window.initWorkspace(AppState.currentUserData);
            } else {
                document.getElementById('setupProfileScreen')?.classList.remove('hidden');
            }
        } catch(e) { console.error(e); }
    } else {
        document.getElementById('systemPasswordScreen')?.classList.remove('hidden');
    }
    // إخفاء اللودر
    document.getElementById('loadingScreen')?.classList.add('hidden');
});

// تكملة كود الـ submit لنموذج البروفايل هنا...
