// js/ui.js

export function showToast(message, type = 'info') {
    // ... كود التوست الموجود عندك
}

// أضف كلمة export هنا وهنا
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

// اجعل الدوال متاحة عالمياً أيضاً لتعمل من خلال onclick في الـ HTML
window.openModal = openModal;
window.closeModal = closeModal;
