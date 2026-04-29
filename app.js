// js/app.js
import { db, appId, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from './firebase-config.js';

// المتغيرات العامة للنظام
window.globalUsers = [];
window.globalRobots = [];
window.globalClients = [];
window.globalRentals = [];
window.globalInventory = [];
window.globalAttendance = [];
window.globalLeaves = [];
window.globalFiles = [];
window.globalFolders = [];
window.globalMeetings = [];
window.globalExpenses = [];
window.globalTrainees = [];

window.getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);

window.logAction = async (action, details) => {
    if(!window.currentUserData) return;
    try {
        await addDoc(window.getColRef('logs'), {
            action: action,
            details: details,
            userName: window.currentUserData.name,
            uid: window.currentUserData.uid,
            timestamp: Date.now()
        });
    } catch(e) { console.error("Error logging action", e); }
};

window.startDatabaseListeners = () => {
    onSnapshot(window.getColRef('users'), (snapshot) => {
        window.globalUsers = []; 
        snapshot.forEach(d => window.globalUsers.push({ uid: d.id, ...d.data() })); 
    });

    onSnapshot(window.getColRef('attendance'), (snapshot) => {
        window.globalAttendance = []; 
        snapshot.forEach(d => window.globalAttendance.push({ id: d.id, ...d.data() }));
        if(typeof window.renderEmpAttendanceView === 'function') window.renderEmpAttendanceView();
    });

    onSnapshot(window.getColRef('leaves'), (snapshot) => {
        window.globalLeaves = []; 
        snapshot.forEach(d => window.globalLeaves.push({ id: d.id, ...d.data() }));
        window.globalLeaves.sort((a,b) => b.timestamp - a.timestamp); 
        if(typeof window.renderLeaves === 'function') window.renderLeaves();
    });

    onSnapshot(window.getColRef('robots'), (snapshot) => {
        window.globalRobots = [];
        snapshot.forEach(doc => window.globalRobots.push({id: doc.id, ...doc.data()}));
        if(typeof window.renderCurrentRobotsTab === 'function') window.renderCurrentRobotsTab();
    });
    
    // باقي المستمعات سيتم إضافتها تباعاً للملفات الأخرى
};
