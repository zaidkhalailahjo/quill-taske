// js/ui.js

// دالة مركزية لعرض الإشعارات (Toasts)
export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    let colorClass = type === 'success' ? 'bg-green-500' : (type === 'warning' ? 'bg-secondary' : (type === 'error' ? 'bg-red-500' : 'bg-primary'));
    let icon = type === 'success' ? 'fa-check' : (type === 'warning' ? 'fa-bell' : (type === 'error' ? 'fa-xmark' : 'fa-info-circle'));

    toast.className = `toast-enter ${colorClass} text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm md:text-base w-max`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span class="font-bold">${message}</span>`;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-leave');
        setTimeout(() => toast.remove(), 500);
    }, 4000);
}

// التحكم بالنوافذ المنبثقة
window.openModal = (id) => {
    const el = document.getElementById(id);
    if(el) el.classList.remove('hidden');
};

window.closeModal = (id) => {
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('hidden');
        // تفريغ النماذج تلقائياً عند الإغلاق لمنع تداخل البيانات
        const form = el.querySelector('form');
        if(form) form.reset();
    }
};

// التحكم بالوضع الليلي
window.toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('appTheme', isDark ? 'dark' : 'light');
    const icon = document.getElementById('themeToggleIcon');
    if(icon) icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
};

// التحقق المبدئي من الوضع الليلي عند التحميل
if (localStorage.getItem('appTheme') === 'dark') {
    document.documentElement.classList.add('dark');
    document.addEventListener("DOMContentLoaded", () => {
        const icon = document.getElementById('themeToggleIcon');
        if (icon) icon.className = 'fa-solid fa-sun';
    });
}

// التحكم بالنافذة الجانبية للموبايل
window.toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('translate-x-full');
    document.getElementById('mobileOverlay')?.classList.toggle('hidden');
};
