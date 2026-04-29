// js/app.js

// دالة لجلب المحتوى الديناميكي
async function loadView(viewName) {
    const container = document.getElementById('app-content');
    
    // إظهار علامة تحميل مؤقتة
    container.innerHTML = '<div class="flex justify-center items-center h-full"><div class="loader"></div></div>';
    
    // مطابقة اسم العرض مع الملفات (يمكنك دمج العملاء والتعميمات في ملف واحد هنا)
    let fileName = viewName;
    if (viewName === 'crm' || viewName === 'notices') {
        fileName = 'crm-notices'; // إذا أردت دمجهم في ملف واحد
    }

    try {
        const response = await fetch(`views/${fileName}.html`);
        if (!response.ok) throw new Error('لم يتم العثور على الصفحة');
        
        const html = await response.text();
        container.innerHTML = html;

        // بعد حقن الـ HTML، نقوم بتشغيل دوال التهيئة الخاصة بالصفحة
        initializeViewLogic(viewName);

    } catch (error) {
        container.innerHTML = `<p class="text-red-500 text-center font-bold mt-10">حدث خطأ أثناء تحميل قسم ${viewName}</p>`;
        console.error(error);
    }
}

// دالة لتهيئة الجافاسكريبت الخاص بكل صفحة بعد تحميلها
function initializeViewLogic(viewName) {
    if (viewName === 'tasks') {
        // استدعاء دالة عرض المهام من tasks.js
        if(typeof renderTasks === 'function') renderTasks();
    } else if (viewName === 'chat') {
        // تمرير المستخدم لأسفل المحادثة من chat.js
        if(typeof renderChat === 'function') renderChat();
    }
    // ... باقي الأقسام
}

// مراقبة تغير الهاش في المتصفح
window.addEventListener('hashchange', () => {
    let hash = window.location.hash.replace('#', '') || 'home-grid';
    loadView(hash);
});

// تحميل الصفحة المبدئية عند أول دخول للموقع
document.addEventListener('DOMContentLoaded', () => {
    let hash = window.location.hash.replace('#', '') || 'home-grid';
    loadView(hash);
});
