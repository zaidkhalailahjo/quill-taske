// js/auth.js
import { auth, db, appId, doc, getDoc, setDoc, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from './firebase-config.js';

window.currentUserAuth = null;
window.currentUserData = null;
window.hasPunchedInToday = true;

// 1. دالة التحقق من كلمة مرور النظام (تعمل الآن بشكل مباشر)
window.checkSystemPassword = () => {
    const pass = document.getElementById('sysPasswordInput').value;
    // التحقق من الباسوورد 1112021
    if(pass === (window.currentSystemPassword || '1112021')) {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('sysPassError').classList.add('hidden');
    } else {
        document.getElementById('sysPassError').classList.remove('hidden');
    }
};

document.getElementById('googleLoginBtn')?.addEventListener('click', async () => {
    try { await signInWithPopup(auth, new GoogleAuthProvider()); } 
    catch (error) { console.error(error); }
});

onAuthStateChanged(auth, async (user) => {
    const loadingScreen = document.getElementById('loadingScreen');
    
    if (user) {
        document.getElementById('systemPasswordScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        window.currentUserAuth = user;
        
        try {
            const docSnap = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid));
            if (docSnap.exists()) {
                window.currentUserData = docSnap.data();
                
                if(window.currentUserData.status === 'pending') {
                    if(loadingScreen) loadingScreen.classList.add('hidden');
                    document.getElementById('pendingApprovalScreen').classList.remove('hidden');
                    return;
                }
                
                document.getElementById('setupProfileScreen').classList.add('hidden');
                
                // 2. تحديث الواجهة (الاسم، الصورة، صلاحيات المدير)
                if(typeof window.updateUIWithUserData === 'function') {
                    window.updateUIWithUserData();
                }

                // 3. تشغيل المحرك لجلب المهام والعملاء
                if(typeof window.startDatabaseListeners === 'function') {
                    window.startDatabaseListeners(); 
                }
            } else {
                if(loadingScreen) loadingScreen.classList.add('hidden');
                document.getElementById('setupProfileScreen').classList.remove('hidden');
            }
        } catch(e) { 
            console.error("Data error:", e); 
            if(loadingScreen) loadingScreen.classList.add('hidden');
            window.showToast('حدث خطأ في قراءة بياناتك، يرجى تحديث الصفحة', 'error');
        }
    } else {
        if(loadingScreen) loadingScreen.classList.add('hidden');
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
            name: window.escapeHTML(name), role: window.escapeHTML(role), uid: window.currentUserAuth.uid, email: window.currentUserAuth.email, 
            photoURL: window.currentUserAuth.photoURL || `https://ui-avatars.com/api/?name=${name}&background=00839b&color=fff`,
            status: 'pending', timestamp: Date.now(),
            permissions: { canAssignTasks: false, canExpenses: false, canCRM: false, canNotices: false }
        };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', window.currentUserAuth.uid), newUserData);
        window.currentUserData = newUserData;
        
        document.getElementById('setupProfileScreen').classList.add('hidden');
        document.getElementById('pendingApprovalScreen').classList.remove('hidden');
    } catch(e) { console.error(e); }
});

// إنهاء تسجيل الدخول بنجاح
window.finishLoginSetup = () => {
    localStorage.setItem('quill_user_cache_main', JSON.stringify(window.currentUserData));
    
    if(typeof window.updateUIWithUserData === 'function') window.updateUIWithUserData();
    
    window.logAction('تسجيل دخول', `سجل ${window.currentUserData.name} الدخول للنظام (المنصة الرئيسية)`);
    
    // التحقق الفوري من الحضور وتوجيه الموظف إذا لم يكن مديراً
    if(window.currentUserData.role !== 'CEO' && !window.hasPunchedInToday) {
        window.location.hash = 'attendance';
        window.checkPunchInLock();
    } else {
        window.dispatchEvent(new Event('hashchange'));
    }
    
    const loader = document.getElementById('loadingScreen');
    if(loader) loader.classList.add('hidden');
};
