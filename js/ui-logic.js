// js/ui-logic.js

export function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    let color = type === 'success' ? 'bg-green-500' : (type === 'warning' ? 'bg-[#00839b]' : 'bg-[#002d74]');
    toast.className = `toast-enter ${color} text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3`;
    toast.innerHTML = `<span class="font-bold">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.replace('toast-enter', 'toast-leave'); setTimeout(() => toast.remove(), 500); }, 4000);
}

// 🔴 تم إضافة التصدير هنا لحل الخطأ
export const openModal = (id) => {
    document.getElementById(id)?.classList.remove('hidden');
};

export const closeModal = (id) => {
    const el = document.getElementById(id);
    if(el) {
        el.classList.add('hidden');
        const form = el.querySelector('form');
        if(form) form.reset();
    }
};

// جعلها متاحة عالمياً للـ HTML
window.openModal = openModal;
window.closeModal = closeModal;

window.toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('translate-x-full');
    document.getElementById('mobileOverlay')?.classList.toggle('hidden');
};

// أداة تنظيف النصوص
window.escapeHTML = function(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, match => ({ '&': '&', '<': '<', '>': '>', "'": ''', '"': '"' })[match]);
};
