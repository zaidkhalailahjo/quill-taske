import { startTasksListener } from './tasks-logic.js';
import { startChatListener } from './chat-logic.js';
// استيراد البقية...

window.initApp = (userData) => {
    console.log("Initializing Quill Workspace for:", userData.name);
    
    // 1. تحديث بيانات الواجهة الثابتة
    document.getElementById('userName').innerText = userData.name;
    document.getElementById('userRole').innerText = userData.role;
    document.getElementById('userAvatar').src = userData.photoURL;

    // 2. تشغيل المستمعات الحية (Real-time Listeners)
    startTasksListener();
    startChatListener();
    // هنا تشغل مستمعات الـ CRM والـ Attendance والـ Notices
    
    // 3. معالجة التنقل (Routing)
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
};

function handleHashChange() {
    const hash = window.location.hash.replace('#', '') || 'home-grid';
    
    // إخفاء كل الأقسام
    document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));
    
    // إظهار القسم المطلوب
    const target = document.getElementById(hash);
    if (target) target.classList.remove('hidden');

    // تحديث عنوان الصفحة
    const titleMap = { 'tasks': 'المهام', 'chat': 'المناقشة', 'home-grid': 'الرئيسية' };
    document.getElementById('page-title').innerText = titleMap[hash] || 'نظام Quill';
}
