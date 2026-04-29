// js/auth.js
import { auth, db, appId, doc, getDoc, setDoc, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from './firebase-config.js';

window.currentUserAuth = null;
window.currentUserData = null;
window.hasPunchedInToday = true;

// 🔴 تم حل مشكلة الباسوورد هنا، يقبل 1112021 بشكل فوري
window.checkSystemPassword = () => {
    const pass = document.getElementById('sysPasswordInput').value;
    if(pass === '1112021' || pass === window.currentSystemPassword) {
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
                
                if(window.currentUserData.status === 'rejected') {
                    if(loadingScreen) loadingScreen.classList.add('hidden');
                    alert('عذراً، تم رفض طلب انضمامك للنظام.');
                    return;
                }
                
                document.getElementById('setupProfileScreen').classList.add('hidden');
                window.finishLoginSetup();
            } else {
                if(loadingScreen) loadingScreen.classList.add('hidden');
                document.getElementById('setupProfileScreen').classList.remove('hidden');
            }
        } catch(e) { 
            console.error("Data error:", e); 
            if(loadingScreen) loadingScreen.classList.add('hidden');
        }
    } else {
        if(loadingScreen) loadingScreen.classList.add('hidden');
        document.getElementById('systemPasswordScreen').classList.remove('hidden');
    }
});

document.getElementById('setupProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('setupName').value;
    const role = document.getElementById('setupRole').value;
    try {
        const newUserData = {
            name: window.escapeHTML(name), role: window.escapeHTML(role), uid: window.currentUserAuth.uid, email: window.currentUserAuth.email || 'no-email@company.com', 
            photoURL: window.currentUserAuth.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00839b&color=fff`,
            status: 'pending', timestamp: Date.now(),
            permissions: { canAssignTasks: false, canExpenses: false, canCRM: false, canNotices: false, canGroups: false }
        };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', window.currentUserAuth.uid), newUserData);
        window.currentUserData = newUserData;
        
        document.getElementById('setupProfileScreen').classList.add('hidden');
        document.getElementById('pendingApprovalScreen').classList.remove('hidden');
    } catch(e) { console.error(e); }
});

window.finishLoginSetup = () => {
    // تحديث الواجهة وتعبئة اسم وصورة المستخدم (سواء مدير أو موظف)
    if(typeof window.updateUIWithUserData === 'function') window.updateUIWithUserData();
    
    // بدء الاستماع للبيانات (مهام، عملاء، موظفين)
    if(typeof window.startDatabaseListeners === 'function') window.startDatabaseListeners(); 
    
    // التحقق من الحضور: إذا لم يقم بالبصمة وليس مديراً، وجهه لصفحة الحضور
    if(window.currentUserData.role !== 'CEO' && !window.hasPunchedInToday) {
        window.location.hash = 'attendance';
        if(typeof window.checkPunchInLock === 'function') window.checkPunchInLock();
    } else {
        window.dispatchEvent(new Event('hashchange'));
    }
    
    // إخفاء شاشة التحميل النهاية
    const loader = document.getElementById('loadingScreen');
    if(loader) loader.classList.add('hidden');
};
