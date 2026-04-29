// js/auth-logic.js
import { auth, db, appId } from './firebase-config.js';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showToast } from './ui-logic.js';

export let currentUserData = null;

window.checkSystemPassword = () => {
    const pass = document.getElementById('sysPasswordInput').value;
    if(pass === '1112021') {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
    } else {
        document.getElementById('sysPassError').classList.remove('hidden');
    }
};

document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (e) { console.error(e); }
});

onAuthStateChanged(auth, async (user) => {
    const loader = document.getElementById('loadingScreen');
    if (user) {
        document.getElementById('systemPasswordScreen')?.classList.add('hidden');
        document.getElementById('loginScreen')?.classList.add('hidden');
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid));
            if (docSnap.exists()) {
                currentUserData = docSnap.data();
                document.getElementById('setupProfileScreen')?.classList.add('hidden');
                // استدعاء دالة التشغيل
                if(window.initApp) window.initApp(currentUserData);
            } else {
                document.getElementById('setupProfileScreen')?.classList.remove('hidden');
            }
        } catch(e) { console.error(e); }
    } else {
        document.getElementById('systemPasswordScreen')?.classList.remove('hidden');
    }
    if(loader) loader.classList.add('hidden');
});

document.getElementById('setupProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('setupName').value;
    const role = document.getElementById('setupRole').value;
    const newUserData = {
        name: name, role: role, uid: auth.currentUser.uid, 
        photoURL: auth.currentUser.photoURL || `https://ui-avatars.com/api/?name=${name}&background=00839b&color=fff`,
        timestamp: Date.now()
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', auth.currentUser.uid), newUserData);
    location.reload();
});
