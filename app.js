// js/app.js
import { AppState } from './auth.js';
import { showToast } from './ui.js';

// دالة تهيئة النظام (تُستدعى من auth.js بعد نجاح تسجيل الدخول)
window.initWorkspace = (userData) => {
    // 1. تعبئة بيانات المستخدم في الواجهة
    document.getElementById('userName').innerText = userData.name;
    document.getElementById('userRole').innerText = userData.role;
    document.getElementById('userAvatar').src = userData.photoURL;

    // 2. إدارة الصلاحيات في القائمة الجانبية (Sidebar)
    setupPermissions(userData);

    // 3. بدء التنقل (Routing) بناءً على الرابط الحالي
    handleHashChange();
    
    // 4. استماع لتغيرات الرابط (Hash) لتنقل سلس بدون إعادة تحميل الصفحة
    window.addEventListener('hashchange', handleHashChange);
    
    // ملاحظة: هنا سنستدعي لاحقاً دوال استماع قاعدة البيانات من باقي الملفات
    // مثل: startTasksListener(); startCRMListener();
};

function setupPermissions(userData) {
    const isCEO = userData.role === 'CEO';
    const p = userData.permissions || {};

    // إظهار/إخفاء عناصر لوحة تحكم المدير
    toggleElement('grid-dashboard', isCEO);
    toggleElement('nav-dashboard-btn', isCEO);
    toggleElement('grid-employees', isCEO);
    toggleElement('nav-employees-btn', isCEO);
    toggleElement('ceoExportSection', isCEO);
    toggleElement('ceoAttendanceView', isCEO);

    // المصاريف (للمدير والمحاسب)
    const canExpenses = isCEO || userData.role === 'accountant' || p.canExpenses;
    toggleElement('nav-expenses-btn', canExpenses, 'flex');
    toggleElement('grid-expenses', canExpenses);
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

// دالة الـ Router الأساسية (تتحكم في إخفاء وإظهار الأقسام)
function handleHashChange() {
    if (!AppState.currentUserData) return;
    
    const hash = window.location.hash.replace('#', '') || 'home-grid';
    const validSections = ['home-grid', 'dashboard', 'employees', 'tasks', 'chat', 'settings', 'crm-management', 'attendance', 'leaves', 'robots', 'renters', 'office-inventory', 'warehouse-inventory', 'expenses'];
    
    let targetSection = validSections.includes(hash) ? hash : 'home-grid';

    // حماية الصفحات: منع الموظف من دخول صفحة المدير
    if (AppState.currentUserData.role !== 'CEO' && ['dashboard', 'employees'].includes(targetSection)) {
        targetSection = 'home-grid';
        showToast('ليس لديك صلاحية للوصول لهذه الصفحة', 'warning');
    }

    showSection(targetSection);
}

function showSection(sectionId) {
    // إخفاء كل الأقسام
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    
    // إظهار القسم المطلوب
    const targetEl = document.getElementById(sectionId);
    if (targetEl) targetEl.classList.remove('hidden');

    // تفعيل زر التراجع للرئيسية إذا لم نكن في الرئيسية
    const backBtn = document.getElementById('backToHomeBtn');
    const pageTitle = document.getElementById('page-title');
    if (sectionId === 'home-grid') {
        if(backBtn) backBtn.classList.add('hidden');
        if(pageTitle) pageTitle.classList.remove('hidden');
    } else {
        if(backBtn) backBtn.classList.remove('hidden');
        if(pageTitle) pageTitle.classList.add('hidden');
    }

    // تلوين الزر النشط في القائمة الجانبية
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('bg-secondary', 'text-white');
        b.classList.add('text-gray-300');
    });
    const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-300');
        activeBtn.classList.add('bg-secondary', 'text-white');
    }

    // إغلاق القائمة الجانبية في الجوال بعد اختيار قسم
    if (window.innerWidth < 768 && sectionId !== 'chat') {
        document.getElementById('sidebar')?.classList.add('translate-x-full');
        document.getElementById('mobileOverlay')?.classList.add('hidden');
    }
}
