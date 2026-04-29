// js/auth.js
import { auth, db, appId } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { showToast } from './ui.js';

// كائن مركزي لحفظ بيانات المستخدم والجلسة لتفادي تلويث الـ window
export const AppState = {
    currentUserAuth: null,
    currentUserData: null,
    hasPunchedInToday: true,
    SYSTEM_PASSWORD: '1112021'
};

// فحص كلمة مرور النظام
window.checkSystemPassword = () => {
    const pass = document.getElementById('sysPasswordInput').value;
    if(pass === AppState.SYSTEM_PASSWORD) {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('sysPassError').classList.add('hidden');
    } else {
        document.getElementById('sysPassError').classList.remove('hidden');
    }
};

// تسجيل الدخول بجوجل
document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    try { 
        await signInWithPopup(auth, new GoogleAuthProvider()); 
    } catch (error) { 
        console.error(error); 
        showToast('فشل تسجيل الدخول', 'error');
    }
});

// مراقب حالة المصادقة
onAuthStateChanged(auth, async (user) => {
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (user) {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        AppState.currentUserAuth = user;
        
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid));
            if (docSnap.exists()) {
                AppState.currentUserData = docSnap.data();
                
                if(AppState.currentUserData.status === 'pending') {
                    if(loadingScreen) loadingScreen.classList.add('hidden');
                    document.getElementById('pendingApprovalScreen').classList.remove('hidden');
                    return;
                }
                
                if(AppState.currentUserData.status === 'rejected') {
                    if(loadingScreen) loadingScreen.classList.add('hidden');
                    alert('عذراً، تم رفض طلب انضمامك للنظام.');
                    return;
                }
                
                document.getElementById('setupProfileScreen').classList.add('hidden');
                finishLoginSetup();
            } else {
                if(loadingScreen) loadingScreen.classList.add('hidden');
                document.getElementById('setupProfileScreen').classList.remove('hidden');
            }
        } catch(e) { 
            console.error("Data error:", e); 
            if(loadingScreen) loadingScreen.classList.add('hidden');
            showToast('حدث خطأ في قراءة بياناتك', 'error');
        }
    } else {
        if(loadingScreen) loadingScreen.classList.add('hidden');
        document.getElementById('systemPasswordScreen').classList.remove('hidden');
    }
});

// إكمال إنشاء الملف الشخصي
document.getElementById('setupProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('setupName').value;
    const role = document.getElementById('setupRole').value;
    
    try {
        const newUserData = {
            name: name, // تم إزالة window.escapeHTML لأن الحماية تتم عند العرض وليس التخزين
            role: role, 
            uid: AppState.currentUserAuth.uid, 
            email: AppState.currentUserAuth.email || 'no-email@company.com', 
            photoURL: AppState.currentUserAuth.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00839b&color=fff`,
            status: 'pending', 
            timestamp: Date.now(),
            permissions: { canAssignTasks: false, canExpenses: false, canCRM: false, canNotices: false, canGroups: false }
        };
        
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', AppState.currentUserAuth.uid), newUserData);
        AppState.currentUserData = newUserData;
        
        document.getElementById('setupProfileScreen').classList.add('hidden');
        document.getElementById('pendingApprovalScreen').classList.remove('hidden');
    } catch(e) { 
        console.error(e); 
        showToast('فشل إرسال الطلب', 'error');
    }
});

function finishLoginSetup() {
    // هذه الدالة سيتم استدعاؤها لاحقاً لربط الواجهة (app.js)
    if(typeof window.initWorkspace === 'function') {
        window.initWorkspace(AppState.currentUserData);
    }
    const loader = document.getElementById('loadingScreen');
    if(loader) loader.classList.add('hidden');
}
