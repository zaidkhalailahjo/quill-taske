// js/app.js
import { db, appId, collection, doc, getDoc, setDoc, onSnapshot } from './firebase-config.js';

// المتغيرات العامة للنظام (الآن مجمعة بالكامل)
window.globalUsers = [];
window.globalTasks = [];
window.globalLogs = [];
window.globalChat = [];
window.globalGroups = [{ id: 'global', name: 'الدردشة العامة', members: [] }]; 
window.globalNotices = [];
window.globalCRM = [];
window.globalAttendance = [];
window.globalLeaves = []; 
window.globalExpenses = []; 
window.globalTrainees = []; 
window.globalInventory = []; 
window.globalRentals = []; 
window.globalRobots = []; 
window.globalMeetings = [];

window.currentUserData = null;
window.hasPunchedInToday = true;
window.currentSystemPassword = '1112021'; 

window.getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);

// إصلاح مشكلة الفيديو (تدمير الجلسة بشكل سليم)
window.jitsiApi = null;
window.endVideoCall = () => {
    if(window.jitsiApi) { 
        window.jitsiApi.dispose(); 
        window.jitsiApi = null; 
    }
    document.getElementById('videoCallModal').classList.add('hidden'); 
    document.getElementById('videoCallModal').classList.remove('flex');
    document.querySelector('#jitsiContainer').innerHTML = ''; 
};

// دالة تحميل البيانات المركزية (تحل مشكلة التقطيع)
window.startDatabaseListeners = () => {
    const loadingScreen = document.getElementById('loadingScreen');
    
    // تحميل الموظفين أولاً كأولوية قصوى
    onSnapshot(window.getColRef('users'), (snapshot) => {
        window.globalUsers = [];
        snapshot.forEach(docSnap => {
            const uData = { id: docSnap.id, ...docSnap.data() };
            window.globalUsers.push(uData);
            if(window.currentUserData && uData.id === window.currentUserData.uid) {
                window.currentUserData = uData;
            }
        });
        
        // إخفاء شاشة التحميل والسماح بدخول النظام فقط بعد جلب المستخدمين
        if(loadingScreen) loadingScreen.classList.add('hidden');
        if(typeof window.updateUIWithUserData === 'function') window.updateUIWithUserData();
        
    }, (error) => { console.error(error); });

    // تحميل سجل الحضور وتحديد القفل
    onSnapshot(window.getColRef('attendance'), (snapshot) => {
        window.globalAttendance = [];
        snapshot.forEach(d => window.globalAttendance.push({ id: d.id, ...d.data() }));
        
        if (window.currentUserData) {
            const today = new Date().toISOString().split('T')[0];
            const myTodayRecord = window.globalAttendance.find(a => a.uid === window.currentUserData.uid && a.date === today);
            window.hasPunchedInToday = (myTodayRecord && myTodayRecord.status !== 'completed');
            
            if(typeof window.checkPunchInLock === 'function') window.checkPunchInLock();
            if(typeof window.renderEmpAttendanceView === 'function') window.renderEmpAttendanceView();
        }
    });

    // استدعاء باقي البيانات في الخلفية
    onSnapshot(window.getColRef('tasks'), (snap) => { window.globalTasks = []; snap.forEach(d => window.globalTasks.push({id: d.id, ...d.data()})); });
    onSnapshot(window.getColRef('clients'), (snap) => { window.globalCRM = []; snap.forEach(d => window.globalCRM.push({id: d.id, ...d.data()})); });
    onSnapshot(window.getColRef('robots'), (snap) => { window.globalRobots = []; snap.forEach(d => window.globalRobots.push({id: d.id, ...d.data()})); });
    onSnapshot(window.getColRef('rentals'), (snap) => { window.globalRentals = []; snap.forEach(d => window.globalRentals.push({id: d.id, ...d.data()})); });
};
