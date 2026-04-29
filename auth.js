// js/auth.js
import { auth, db, appId, doc, getDoc, setDoc, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from './firebase-config.js';

window.currentUserAuth = null;
window.currentUserData = null;
window.hasPunchedInToday = true;

const sysPasswordBtn = document.getElementById('sysPasswordBtn');
if(sysPasswordBtn) {
    sysPasswordBtn.addEventListener('click', () => {
        const pass = document.getElementById('sysPasswordInput').value;
        if(pass === window.currentSystemPassword) { // Variable defined in app.js
            document.getElementById('systemPasswordScreen').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('hidden');
        } else {
            document.getElementById('sysPassError').classList.remove('hidden');
        }
    });
}

document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (error) { console.error(error); }
});

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
                    return;
                }
                
                document.getElementById('setupProfileScreen').classList.add('hidden');
                
                // نبدأ بتحميل البيانات (Listeners) أولاً لكي نتفادى مشكلة البيانات المفقودة
                if(typeof window.startDatabaseListeners === 'function') {
                    window.startDatabaseListeners();
                }
                
            } else {
                document.getElementById('setupProfileScreen').classList.remove('hidden');
            }
        } catch(e) { 
            console.error("Error fetching user data:", e); 
            window.showToast('حدث خطأ في قراءة بياناتك، يرجى تحديث الصفحة', 'error');
        }
    } else {
        document.getElementById('systemPasswordScreen').classList.remove('hidden');
    }
});

document.getElementById('setupProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('setupName').value;
    const role = document.getElementById('setupRole').value;
    try {
        const newUserData = {
            name: window.escapeHTML(name), 
            role: window.escapeHTML(role), 
            uid: window.currentUserAuth.uid, 
            email: window.currentUserAuth.email || 'no-email@company.com', 
            photoURL: window.currentUserAuth.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00839b&color=fff`,
            readReceipts: {}, chatLayout: 'media-top', chatColor: 'bg-[#00839b]', lastActive: Date.now(), timestamp: Date.now(),
            status: 'pending', 
            permissions: {
                canAssignTasks: false, canExpenses: false, canCRM: false, canNotices: false, canGroups: false
            }
        };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', window.currentUserAuth.uid), newUserData);
        window.currentUserData = newUserData;
        
        document.getElementById('setupProfileScreen').classList.add('hidden');
        document.getElementById('pendingApprovalScreen').classList.remove('hidden');
    } catch(e) { console.error(e); }
});

// هذا سيُستدعى تلقائياً من app.js بعد تحميل الموظفين
window.finishLoginSetup = () => {
    localStorage.setItem('quill_user_cache_main', JSON.stringify(window.currentUserData));
    
    // تحديث الواجهة والصلاحيات
    if(typeof window.updateUIWithUserData === 'function') window.updateUIWithUserData();
    
    window.logAction('تسجيل دخول', `سجل ${window.currentUserData.name} الدخول للنظام (المنصة الرئيسية)`);
    window.dispatchEvent(new Event('hashchange'));
};
