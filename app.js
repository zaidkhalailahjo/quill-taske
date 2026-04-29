import { db, appId } from './firebase-config.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast } from './ui.js';

// استدعاء المستمعات من باقي الملفات
import { startChatListener } from './chat.js';
import { startCRMListener } from './crm.js';
import { startTasksListener } from './tasks.js';
// تأكد أنك أنشأت هذه الملفات الثلاثة أدناه من محادثاتنا السابقة!
import { startRobotsListener } from './robots.js';
import { startHRListener } from './hr.js';
import { startOperationsListener } from './operations.js';

window.getColRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);

window.logAction = async (action, details) => {
    if(!AppState.currentUserData) return;
    try {
        await addDoc(window.getColRef('logs'), {
            action: action, 
            details: details, 
            userName: AppState.currentUserData.name,
            uid: AppState.currentUserData.uid, 
            timestamp: Date.now()
        });
    } catch(e) { console.error("Error logging action", e); }
};

window.initWorkspace = (userData) => {
    document.getElementById('userName').innerText = userData.name;
    document.getElementById('userRole').innerText = userData.role;
    const userAvatar = document.getElementById('userAvatar');
    if(userAvatar) userAvatar.src = userData.photoURL;

    setupPermissions(userData);

    // تشغيل الاتصال الحي بقاعدة البيانات لكل الأقسام
    startChatListener();
    startCRMListener();
    startTasksListener();
    startRobotsListener();
    startHRListener();
    startOperationsListener();

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
};

function setupPermissions(userData) {
    const isCEO = userData.role === 'CEO';
    const p = userData.permissions || {};

    toggleElement('grid-dashboard', isCEO);
    toggleElement('nav-dashboard-btn', isCEO);
    toggleElement('grid-employees', isCEO);
    toggleElement('nav-employees-btn', isCEO);
    toggleElement('ceoExportSection', isCEO);
    toggleElement('ceoAttendanceView', isCEO);
    toggleElement('ceoLeaveBalancesSection', isCEO);
    toggleElement('createMeetingBtn', isCEO);

    const canExpenses = isCEO || userData.role === 'accountant' || p.canExpenses;
    toggleElement('nav-expenses-btn', canExpenses, 'flex');
    toggleElement('grid-expenses', canExpenses);
    
    const canNotices = isCEO || p.canNotices;
    toggleElement('addNoticeBtn', canNotices);
}

function toggleElement(id, condition, displayType = 'block') {
    const el = document.getElementById(id);
    if (!el) return;
    if (condition) {
        el.classList.remove('hidden');
        if(displayType === 'flex') el.style.display = 'flex';
    } else {
        el.classList.add('hidden');
    }
}

function handleHashChange() {
    if (!AppState.currentUserData) return;
    
    const hash = window.location.hash.replace('#', '') || 'home-grid';
    const validSections = [
        'home-grid', 'dashboard', 'employees', 'tasks', 'chat', 'settings', 
        'crm-management', 'attendance', 'leaves', 'robots', 'renters', 
        'office-inventory', 'warehouse-inventory', 'expenses', 'meetings', 'notices', 'drive'
    ];
    
    let targetSection = validSections.includes(hash) ? hash : 'home-grid';

    if (AppState.currentUserData.role !== 'CEO' && ['dashboard', 'employees'].includes(targetSection)) {
        targetSection = 'home-grid';
        showToast('ليس لديك صلاحية للوصول لهذه الصفحة', 'warning');
    }

    showSection(targetSection);
}

function showSection(sectionId) {
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    
    const targetEl = document.getElementById(sectionId);
    if (targetEl) targetEl.classList.remove('hidden');

    const backBtn = document.getElementById('backToHomeBtn');
    const pageTitle = document.getElementById('page-title');
    if (sectionId === 'home-grid') {
        if(backBtn) backBtn.classList.add('hidden');
        if(pageTitle) pageTitle.classList.remove('hidden');
    } else {
        if(backBtn) backBtn.classList.remove('hidden');
        if(pageTitle) pageTitle.classList.add('hidden');
    }

    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('bg-secondary', 'text-white');
        b.classList.add('text-gray-300');
    });
    const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-300');
        activeBtn.classList.add('bg-secondary', 'text-white');
    }

    if (window.innerWidth < 768 && sectionId !== 'chat') {
        document.getElementById('sidebar')?.classList.add('translate-x-full');
        document.getElementById('mobileOverlay')?.classList.add('hidden');
    }
}
