// js/ui.js

// دالة التنبيهات
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    let colorClass = type === 'success' ? 'bg-green-500' : (type === 'warning' ? 'bg-scondary' : (type === 'error' ? 'bg-red-500' : 'bg-primary'));
    let icon = type === 'success' ? 'fa-check' : (type === 'warning' ? 'fa-bell' : (type === 'error' ? 'fa-xmark' : 'fa-info-circle'));
    toast.className = `toast-enter ${colorClass} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm md:text-base w-max z-[100]`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span class="font-bold">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-leave');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// تصدير الدوال لكي تراها الملفات الأخرى (Modules)
export const openModal = (id) => {
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
};

export const closeModal = (id) => {
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('hidden');
        const form = el.querySelector('form');
        if(form) form.reset();
    }
};

// جعلها متاحة للـ HTML (onclick)
window.openModal = openModal;
window.closeModal = closeModal;

// التحكم بالثيم
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('appTheme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
};

window.toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('translate-x-full');
    document.getElementById('mobileOverlay')?.classList.toggle('hidden');
};
