// js/ui.js
window.escapeHTML = function(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[match]);
};

window.showToast = (message, type = 'info') => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colorClass = type === 'success' ? 'bg-green-500' : (type === 'warning' ? 'bg-secondary' : 'bg-red-500');
    toast.className = `toast-enter ${colorClass} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm w-max`;
    toast.innerHTML = `<span class="font-bold">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.replace('toast-enter', 'toast-leave'); setTimeout(() => toast.remove(), 500); }, 4000);
};

window.openModal = (id) => document.getElementById(id)?.classList.remove('hidden');
window.closeModal = (id) => {
    const el = document.getElementById(id);
    if(el) { el.classList.add('hidden'); const form = el.querySelector('form'); if(form) form.reset(); }
};
window.toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('translate-x-full');
    document.getElementById('mobileOverlay')?.classList.toggle('hidden');
};

// 🔴 الدالة الأهم: تحدد من هو المستخدم وتفتح الأقسام بناءً عليه
window.updateUIWithUserData = () => {
    if(!window.currentUserData) return;
    
    // تعبئة البيانات في الهيدر
    const userNameEl = document.getElementById('userName');
    const userRoleEl = document.getElementById('userRole');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if(userNameEl) userNameEl.innerText = window.currentUserData.name;
    if(userRoleEl) userRoleEl.innerText = window.currentUserData.role;
    if(userAvatarEl) userAvatarEl.src = window.currentUserData.photoURL;
    
    // فحص ما إذا كان مديراً
    const isCEO = window.currentUserData.role === 'CEO';
    
    // الأقسام الخاصة بالمدير فقط
    const ceoElements = ['nav-dashboard-btn', 'nav-employees-btn', 'nav-logs-btn', 'ceoExportSection', 'grid-employees', 'grid-dashboard', 'grid-logs'];
    
    ceoElements.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            if(isCEO) {
                el.classList.remove('hidden');
                if(id.startsWith('nav-')) el.style.display = 'flex';
            } else {
                el.classList.add('hidden');
                if(id.startsWith('nav-')) el.style.display = 'none';
            }
        }
    });
};

window.checkPunchInLock = () => {
    if(window.currentUserData && window.currentUserData.role !== 'CEO' && !window.hasPunchedInToday) {
        document.getElementById('mainNavigationMenu')?.classList.add('hidden');
        document.getElementById('sidebarLockMessage')?.classList.remove('hidden');
        document.getElementById('homeGridContainer')?.classList.add('hidden');
        document.getElementById('attendanceLockBanner')?.classList.remove('hidden');
        if(window.location.hash !== '#attendance') window.location.hash = 'attendance';
    } else {
        document.getElementById('mainNavigationMenu')?.classList.remove('hidden');
        document.getElementById('sidebarLockMessage')?.classList.add('hidden');
        document.getElementById('homeGridContainer')?.classList.remove('hidden');
        document.getElementById('attendanceLockBanner')?.classList.add('hidden');
    }
};

window.showSection = (sectionId) => {
    if(window.location.hash !== `#${sectionId}`) window.history.pushState(null, null, `#${sectionId}`);
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    
    const targetSection = document.getElementById(sectionId);
    if(targetSection) targetSection.classList.remove('hidden');

    if (sectionId === 'home-grid') {
        document.getElementById('backToHomeBtn')?.classList.add('hidden');
        document.getElementById('page-title')?.classList.remove('hidden');
    } else {
        document.getElementById('backToHomeBtn')?.classList.remove('hidden');
        document.getElementById('page-title')?.classList.add('hidden');
    }
    
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('bg-secondary', 'text-white');
        b.classList.add('text-gray-300');
    });
    
    const activeBtn = document.querySelector(`.nav-btn[data-section="${sectionId}"]`);
    if(activeBtn) {
        activeBtn.classList.remove('text-gray-300');
        activeBtn.classList.add('bg-secondary', 'text-white');
    }
    
    if(window.innerWidth < 768) { 
        document.getElementById('sidebar')?.classList.add('translate-x-full'); 
        document.getElementById('mobileOverlay')?.classList.add('hidden'); 
    }
    window.checkPunchInLock();
};

window.addEventListener('hashchange', () => {
    if(!window.currentUserData) return;
    const hash = window.location.hash.replace('#', '');
    const validSections = ['home-grid', 'attendance', 'crm', 'robots', 'renters', 'tasks', 'leaves', 'chat', 'drive', 'meetings', 'trainees', 'office-inventory', 'warehouse-inventory', 'expenses', 'employees', 'dashboard', 'settings', 'notices', 'my-profile', 'logs'];
    
    if (!window.hasPunchedInToday && window.currentUserData.role !== 'CEO' && hash !== 'attendance') {
        window.location.hash = 'attendance';
        window.showToast('يجب تسجيل الحضور أولاً لفتح النظام.', 'warning');
        return;
    }
    window.showSection(validSections.includes(hash) ? hash : 'home-grid');
});
