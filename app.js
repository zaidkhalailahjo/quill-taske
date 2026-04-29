// js/app.js
import { db, appId, collection, doc, setDoc, onSnapshot } from './firebase-config.js';

window.globalUsers = [];
window.globalTasks = [];
window.globalLogs = [];
window.globalChat = [];
window.globalGroups = [{ id: 'global', name: 'الدردشة العامة', members: [] }]; 
window.globalNotices = [];
window.globalCRM = [];
window.globalAttendance = [];

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

window.startDatabaseListeners = () => {
    // 1. المستخدمين والموظفين
    onSnapshot(window.getColRef('users'), (snapshot) => {
        window.globalUsers = [];
        snapshot.forEach(docSnap => {
            const uData = { id: docSnap.id, ...docSnap.data() };
            window.globalUsers.push(uData);
            if(window.currentUserData && uData.id === window.currentUserData.uid) {
                window.currentUserData = uData;
            }
        });
        if(typeof window.updateUIWithUserData === 'function') window.updateUIWithUserData();
        if(typeof window.renderEmployees === 'function') window.renderEmployees();
        if(typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
    }, (error) => { console.error(error); });

    // 2. سجل النظام (اللوق) للمدير
    onSnapshot(window.getColRef('logs'), (snapshot) => {
        window.globalLogs = [];
        snapshot.forEach(docSnap => window.globalLogs.push({ id: docSnap.id, ...docSnap.data() }));
        window.globalLogs.sort((a,b) => b.timestamp - a.timestamp);
        if(typeof window.renderLogs === 'function') window.renderLogs();
    });

    // 3. الدردشة
    onSnapshot(window.getColRef('chat'), (snapshot) => {
        window.globalChat = [];
        snapshot.forEach(docSnap => window.globalChat.push({ id: docSnap.id, ...docSnap.data() }));
        window.globalChat.sort((a,b) => a.timestamp - b.timestamp);
        if(typeof window.renderChat === 'function') window.renderChat();
    });

    // 4. المهام
    onSnapshot(window.getColRef('tasks'), (snapshot) => {
        window.globalTasks = [];
        snapshot.forEach(docSnap => window.globalTasks.push({ id: docSnap.id, ...docSnap.data() }));
        if(typeof window.renderTasks === 'function') window.renderTasks();
        if(typeof window.updateDashboardStats === 'function') window.updateDashboardStats();
    });
};
