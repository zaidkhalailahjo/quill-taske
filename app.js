// js/app.js
import { db, appId, collection, addDoc, onSnapshot, doc, getDoc, setDoc } from './firebase-config.js';

window.globalUsers = [];
window.globalTasks = [];
window.globalLogs = [];
window.globalChat = [];
window.globalGroups = [{ id: 'global', name: 'الدردشة العامة للشركة', members: [], desc: 'يتواجد هنا جميع أعضاء مساحة العمل' }]; 
window.globalNotices = [];
window.globalCRM = [];
window.globalAttendance = [];
window.globalLeaves = []; 
window.globalExpenses = []; 

window.currentSystemPassword = '1112021'; 

window.getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);

window.logAction = async (action, details) => {
    if(!window.currentUserData) return;
    try {
        await addDoc(window.getColRef('logs'), {
            action: action, details: details, userName: window.currentUserData.name,
            uid: window.currentUserData.uid, timestamp: Date.now()
        });
    } catch(e) { console.error("Error logging action", e); }
};

const initSystem = async () => {
    try {
        onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                window.currentSystemPassword = data.password || '1112021';
            } else {
                setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), { password: '1112021', logRetentionDays: 0 }).catch(e=>{});
            }
            const sysBtn = document.getElementById('sysPasswordBtn');
            if(sysBtn) {
                sysBtn.disabled = false;
                sysBtn.innerText = 'متابعة';
            }
        });
    } catch(e) { console.error("Init Error", e); }
};
initSystem();

window.startDatabaseListeners = () => {
    // 1. الأهم: تحميل بيانات الموظفين أولاً
    onSnapshot(window.getColRef('users'), (snapshot) => {
        window.globalUsers = [];
        snapshot.forEach(docSnap => {
            const uData = { id: docSnap.id, ...docSnap.data() };
            window.globalUsers.push(uData);
            if(window.currentUserData && uData.id === window.currentUserData.uid) {
                window.currentUserData = uData;
            }
        });
        
        // الآن بعد أن اكتمل تحميل الموظفين، نقوم بإكمال تسجيل الدخول وتحديث الواجهة
        if(document.getElementById('loginScreen').classList.contains('hidden') && !document.getElementById('setupProfileScreen').classList.contains('hidden') === false) {
             window.finishLoginSetup(); 
        }
        
        if(typeof window.renderEmployees === 'function') window.renderEmployees();
    }, (error) => { console.error(error); });

    // 2. تحميل الحضور
    onSnapshot(window.getColRef('attendance'), (snapshot) => {
        window.globalAttendance = [];
        snapshot.forEach(d => window.globalAttendance.push({ id: d.id, ...d.data() }));
        if(typeof window.renderEmpAttendanceView === 'function') window.renderEmpAttendanceView();
    });

    // 3. تحميل المهام
    onSnapshot(window.getColRef('tasks'), (snapshot) => {
        window.globalTasks = [];
        snapshot.forEach(docSnap => window.globalTasks.push({ id: docSnap.id, ...docSnap.data() }));
        if(typeof window.renderTasks === 'function') window.renderTasks();
    });

    // 4. تحميل العملاء (CRM)
    onSnapshot(window.getColRef('clients'), (snapshot) => {
        window.globalCRM = [];
        snapshot.forEach(docSnap => window.globalCRM.push({ id: docSnap.id, ...docSnap.data() }));
        if(typeof window.renderCRM === 'function') window.renderCRM();
    });
};
