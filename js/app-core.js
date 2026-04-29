// js/app-core.js
import { startTasksListener } from './tasks-logic.js';
import { startChatListener } from './chat-logic.js';

window.initApp = (userData) => {
    console.log("Welcome:", userData.name);
    
    // تعبئة الواجهة
    document.getElementById('userName').innerText = userData.name;
    document.getElementById('userRole').innerText = userData.role;
    document.getElementById('userAvatar').src = userData.photoURL;

    // تشغيل المستمعات
    startTasksListener();
    startChatListener();

    // تشغيل التوجيه
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
};

function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'home-grid';
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(hash);
    if (target) target.classList.remove('hidden');
    
    const titleMap = { 'tasks': 'المهام', 'chat': 'المناقشة', 'home-grid': 'الرئيسية' };
    document.getElementById('page-title').innerText = titleMap[hash] || 'نظام Quill';
}
