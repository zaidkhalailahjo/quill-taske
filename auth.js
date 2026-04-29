// js/auth.js
import { auth, db, appId, doc, getDoc, setDoc, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from './firebase-config.js';

document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (error) { console.error(error); }
});

window.checkSystemPassword = () => {
    const pass = document.getElementById('sysPasswordInput').value;
    if(pass === window.currentSystemPassword) {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
    } else {
        document.getElementById('sysPassError').classList.remove('hidden');
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid));
            if (docSnap.exists()) {
                window.currentUserData = docSnap.data();
                
                if(window.currentUserData.status === 'pending') {
                    document.getElementById('pendingApprovalScreen').classList.remove('hidden');
                    return;
                }
                
                document.getElementById('setupProfileScreen').classList.add('hidden');
                // تشغيل المحرك بعد التأكد من الحساب
                window.startDatabaseListeners(); 
            } else {
                document.getElementById('setupProfileScreen').classList.remove('hidden');
                window.currentUserAuth = user; 
            }
        } catch(e) { console.error("Data error:", e); }
    } else {
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('systemPasswordScreen').classList.remove('hidden');
    }
});

// إعداد حساب جديد
document.getElementById('setupProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('setupName').value;
    const role = document.getElementById('setupRole').value;
    try {
        const newUserData = {
            name: name, role: role, uid: window.currentUserAuth.uid, email: window.currentUserAuth.email, 
            photoURL: window.currentUserAuth.photoURL || `https://ui-avatars.com/api/?name=${name}&background=00839b&color=fff`,
            status: 'pending', timestamp: Date.now(),
            permissions: { canAssignTasks: false, canExpenses: false, canCRM: false, canNotices: false }
        };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', window.currentUserAuth.uid), newUserData);
        document.getElementById('setupProfileScreen').classList.add('hidden');
        document.getElementById('pendingApprovalScreen').classList.remove('hidden');
    } catch(e) { console.error(e); }
});
