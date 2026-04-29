import { startTasksListener } from './tasks.js';
import { startChatListener } from './chat.js';
import { startCRMListener } from './crm.js';
import { startRobotsListener } from './robots.js';
import { startHRListener } from './hr.js';

window.initWorkspace = (userData) => {
    // ... الأكواد السابقة لتجهيز الواجهة والصلاحيات ...

    // تشغيل مستمعات قواعد البيانات الحية (Real-time Listeners)
    startTasksListener();
    startChatListener();
    startCRMListener();
    startRobotsListener();
    startHRListener();

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
};
