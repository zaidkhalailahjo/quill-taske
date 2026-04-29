// js/auth.js
import { auth, db, appId, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, doc, getDoc, setDoc } from './firebase-config.js';

window.currentUserAuth = null;
window.currentUserData = null; 
window.hasPunchedInToday = true;

// التأكد من كلمة مرور النظام
window.checkSystemPassword = () => {
    const pass = document.getElementById('sysPasswordInput').value;
    if(pass === window.currentSystemPassword) { // سيتم تعريفها لاحقاً
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
    } else {
        document.getElementById('sysPassError').classList.remove('hidden');
    }
};

// تسجيل الدخول بجوجل
document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (error) { console.error(error); }
});

// مراقبة حالة المستخدم
onAuthStateChanged(auth, async (user) => {
    const loadingScreen = document.getElementById('loadingScreen');
    if(loadingScreen) loadingScreen.classList.add('hidden');
    
    if (user) {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        window.currentUserAuth = user;
        
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid));
            if (docSnap.exists()) {
                window.currentUserData = docSnap.data();
                
                if(window.currentUserData.status === 'pending') {
                    document.getElementById('pendingApprovalScreen').classList.remove('hidden');
                    return;
                }
                
                if(window.currentUserData.status === 'rejected') {
                    alert('تم رفض طلب انضمامك للنظام. يرجى مراجعة الإدارة.');
                    window.location.reload();
                    return;
                }
                
                document.getElementById('setupProfileScreen').classList.add('hidden');
                
                // تشغيل النظام
                if(typeof window.finishLoginSetup === 'function') {
                    window.finishLoginSetup();
                }
            } else {
                // مستخدم جديد يحتاج لتسجيل بياناته
                document.getElementById('setupProfileScreen').classList.remove('hidden');
            }
        } catch(e) { 
            console.error("Error fetching user data:", e); 
        }
    } else {
        document.getElementById('systemPasswordScreen').classList.remove('hidden');
    }
});

// إرسال طلب الانضمام للموظف الجديد
document.getElementById('setupProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('setupName').value;
    const role = document.getElementById('setupRole').value;
    try {
        const newUserData = {
            name: name, 
            role: role, 
            uid: window.currentUserAuth.uid, 
            email: window.currentUserAuth.email || 'no-email@company.com', 
            photoURL: window.currentUserAuth.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00839b&color=fff`,
            status: 'pending', // بانتظار موافقة المدير
            timestamp: Date.now()
        };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', window.currentUserAuth.uid), newUserData);
        document.getElementById('setupProfileScreen').classList.add('hidden');
        document.getElementById('pendingApprovalScreen').classList.remove('hidden');
    } catch(e) { console.error(e); }
});
