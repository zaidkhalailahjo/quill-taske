// js/operations.js
import { db, appId, dbStorage } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast, closeModal } from './ui.js';

// متغيرات عامة للعمليات
window.globalUsers = [];
window.globalLogs = [];
window.globalNotices = [];
window.globalFolders = [];
window.globalFiles = [];
window.globalExpenses = [];
window.globalMeetings = [];
window.currentFolderId = null;
window.folderHistory = [{id: null, name: 'الرئيسية'}];

export function startOperationsListener() {
    // 1. الموظفين (Users)
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snapshot) => {
        window.globalUsers = [];
        snapshot.forEach(docSnap => window.globalUsers.push({ id: docSnap.id, ...docSnap.data() }));
        if(window.location.hash === '#employees') window.renderEmployees();
        if(window.updateDashboardStats) window.updateDashboardStats();
    });

    // 2. سجل النظام (Logs)
    const logsQ = query(collection(db, 'artifacts', appId, 'public', 'data', 'logs'), orderBy('timestamp', 'desc'), limit(100));
    onSnapshot(logsQ, (snapshot) => {
        window.globalLogs = [];
        snapshot.forEach(docSnap => window.globalLogs.push({ id: docSnap.id, ...docSnap.data() }));
        if(window.location.hash === '#logs') window.renderLogs();
    });

    // 3. التعميمات (Notices)
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notices'), (snapshot) => {
        window.globalNotices = [];
        snapshot.forEach(docSnap => window.globalNotices.push({ id: docSnap.id, ...docSnap.data() }));
        window.globalNotices.sort((a,b) => b.timestamp - a.timestamp);
        if(window.location.hash === '#notices') window.renderNotices();
    });

    // 4. مجلدات الدرايف وملفاته
    onSnapshot(collection(dbStorage, 'artifacts', appId, 'public', 'data', 'folders'), (snapshot) => {
        window.globalFolders = [];
        snapshot.forEach(d => window.globalFolders.push({ id: d.id, ...d.data() }));
        if(window.location.hash === '#drive' && window.renderDriveFiles) window.renderDriveFiles();
    });

    // 5. المصاريف (Expenses)
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), (snapshot) => {
        window.globalExpenses = [];
        snapshot.forEach(docSnap => window.globalExpenses.push({id: docSnap.id, ...docSnap.data()}));
        window.globalExpenses.sort((a,b) => b.timestamp - a.timestamp);
        if(window.location.hash === '#expenses') window.renderExpenses();
    });

    // 6. الاجتماعات (Meetings)
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'meetings'), (snapshot) => {
        window.globalMeetings = [];
        snapshot.forEach(docSnap => window.globalMeetings.push({ id: docSnap.id, ...docSnap.data() }));
        window.globalMeetings.sort((a,b) => b.timestamp - a.timestamp); 
        if(window.location.hash === '#meetings') window.renderMeetings();
    });
}

// ------------------------------------
// دوال إدارة الموظفين واللوحات (Dashboard & Employees)
// ------------------------------------
window.updateDashboardStats = () => {
    const statEmp = document.getElementById('stat-employees');
    if(statEmp) statEmp.innerText = window.globalUsers.length;
    
    // globalTasks تأتي من ملف tasks.js، نقرأها إن وجدت
    if(window.globalTasks) {
        const statTasks = document.getElementById('stat-tasks');
        if(statTasks) statTasks.innerText = window.globalTasks.length;
        const statComp = document.getElementById('stat-completed');
        if(statComp) statComp.innerText = window.globalTasks.filter(t => t.status === 'completed').length;
    }
};

window.renderEmployees = () => {
    const list = document.getElementById('employeesList');
    const pendingList = document.getElementById('pendingEmployeesList');
    const pendingContainer = document.getElementById('pendingEmployeesContainer');
    if(!list) return;
    
    const isCEO = AppState.currentUserData?.role === 'CEO';
    list.innerHTML = '';
    
    if (pendingList && pendingContainer) {
        pendingList.innerHTML = '';
        const pendingUsers = window.globalUsers.filter(u => u.status === 'pending');
        if (isCEO && pendingUsers.length > 0) {
            pendingContainer.classList.remove('hidden');
            pendingUsers.forEach(emp => {
                pendingList.innerHTML += `
                    <tr class="hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors">
                        <td class="p-3 md:p-4 flex items-center gap-3">
                            <img src="${escapeHTML(emp.photoURL)}" class="w-8 h-8 rounded-full object-cover">
                            <div>
                                <p class="font-bold text-gray-800 dark:text-gray-200 text-sm">${escapeHTML(emp.name)}</p>
                            </div>
                        </td>
                        <td class="p-3 md:p-4 text-orange-600 font-bold text-xs">${escapeHTML(emp.role)}</td>
                        <td class="p-3 md:p-4 whitespace-nowrap text-left">
                            <button onclick="window.approveEmployee('${emp.id}')" class="bg-green-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-sm hover:bg-green-600 transition mx-1">قبول</button>
                            <button onclick="window.rejectEmployee('${emp.id}')" class="bg-red-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-sm hover:bg-red-600 transition">رفض</button>
                        </td>
                    </tr>
                `;
            });
        } else {
            pendingContainer.classList.add('hidden');
        }
    }
    
    const activeUsers = window.globalUsers.filter(u => u.status !== 'pending' && u.status !== 'rejected');
    activeUsers.forEach(emp => {
        let actionsHtml = '';
        if(isCEO && emp.id !== AppState.currentUserData.uid) { 
            actionsHtml = `
                <td class="p-3 md:p-4 whitespace-nowrap rtl:text-left ltr:text-right">
                    <button onclick="window.deleteEmployee('${emp.id}', '${escapeHTML(emp.name)}')" class="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded transition"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
        } else if(isCEO) {
            actionsHtml = `<td class="p-3 md:p-4 rtl:text-left ltr:text-right"><span class="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded">أنت (المدير)</span></td>`;
        }
        list.innerHTML += `
            <tr class="hover:bg-gray-50 dark:bg-gray-700 transition-colors">
                <td class="p-3 md:p-4 flex items-center">
                    <img src="${escapeHTML(emp.photoURL)}" class="w-8 h-8 rounded-full mx-3 object-cover">
                    <span class="font-medium text-gray-800 dark:text-gray-200 text-sm">${escapeHTML(emp.name)}</span>
                </td>
                <td class="p-3 md:p-4 text-gray-600 dark:text-gray-300 font-bold text-xs md:text-sm">${escapeHTML(emp.role)}</td>
                ${actionsHtml}
            </tr>
        `;
    });
};

window.approveEmployee = async (uid) => {
    if (AppState.currentUserData.role !== 'CEO') return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { status: 'active' });
    showToast('تم قبول الموظف بنجاح', 'success');
};

window.rejectEmployee = async (uid) => {
    if (AppState.currentUserData.role !== 'CEO') return;
    if(confirm('هل أنت متأكد من الرفض؟')) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { status: 'rejected' });
        showToast('تم رفض الموظف', 'success');
    }
};

window.deleteEmployee = async (id, name) => {
    if(AppState.currentUserData.role !== 'CEO') return;
    if(confirm('هل أنت متأكد من حذف الموظف؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id));
        if(window.logAction) window.logAction('حذف موظف', `تم حذف الموظف: ${name}`);
    }
};

// ------------------------------------
// دوال السجل واللوق (Logs)
// ------------------------------------
window.renderLogs = () => {
    const list = document.getElementById('logsList');
    if(!list) return;
    list.innerHTML = '';
    
    if(window.globalLogs.length === 0) {
        list.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500">لا يوجد سجلات حتى الآن.</td></tr>`;
        return;
    }

    window.globalLogs.forEach(log => {
        const date = log.timestamp ? new Date(log.timestamp).toLocaleString('ar-EG') : 'تاريخ غير معروف';
        list.innerHTML += `
            <tr class="hover:bg-gray-50 dark:bg-gray-800 transition">
                <td class="p-3 text-[10px] text-gray-500" dir="ltr">${date}</td>
                <td class="p-3 text-xs font-bold text-primary">${escapeHTML(log.userName || 'مجهول')}</td>
                <td class="p-3 text-xs text-gray-600"><i class="fa-solid fa-info-circle mx-2 text-gray-400"></i>${escapeHTML(log.details || '')}</td>
            </tr>
        `;
    });
};

window.clearSystemLogs = async () => {
    if(AppState.currentUserData.role !== 'CEO') return;
    if(confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
        window.globalLogs.forEach(async (log) => {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'logs', log.id));
        });
        showToast('تمت عملية المسح بنجاح', 'success');
    }
};

// ------------------------------------
// دوال التعميمات (Notices)
// ------------------------------------
window.renderNotices = () => {
    const list = document.getElementById('noticesList');
    if(!list) return;
    list.innerHTML = '';
    
    const isCEO = AppState.currentUserData?.role === 'CEO';
    const validNotices = window.globalNotices.filter(n => (!n.expiryDate || n.expiryDate >= Date.now()));

    if(validNotices.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-8">لا توجد تعميمات حالياً.</p>'; return;
    }

    validNotices.forEach(n => {
        const dateStr = new Date(n.timestamp).toLocaleDateString('ar-EG');
        const delBtn = isCEO ? `<button onclick="window.deleteNotice('${n.id}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>` : '';

        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500 relative mb-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100">${escapeHTML(n.title)}</h3>
                        <span class="bg-primary text-white px-2 py-0.5 rounded text-[10px] font-bold">${escapeHTML(n.type || 'تعميم')}</span>
                    </div>
                    ${delBtn}
                </div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 whitespace-pre-line leading-relaxed">${escapeHTML(n.body)}</p>
                <div class="text-[10px] text-gray-400 flex items-center gap-4 mt-3">
                    <span><i class="fa-solid fa-user-pen"></i> بواسطة: ${escapeHTML(n.author)}</span>
                    <span><i class="fa-solid fa-calendar"></i> ${dateStr}</span>
                </div>
            </div>
        `;
    });
};

window.deleteNotice = async (id) => {
    if(confirm('حذف هذا الإعلان؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notices', id));
        showToast('تم حذف التعميم', 'success');
    }
};

// ------------------------------------
// دوال المستندات والدرايف (Drive)
// ------------------------------------
window.handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = document.getElementById('newFolderName').value;
    if(!name.trim() || !AppState.currentUserData) return;
    try {
        await addDoc(collection(dbStorage, 'artifacts', appId, 'public', 'data', 'folders'), {
            name: name, parentId: window.currentFolderId, creatorId: AppState.currentUserData.uid, timestamp: Date.now()
        });
        closeModal('createFolderModal');
        showToast('تم إنشاء المجلد', 'success');
    } catch(err) { console.error(err); }
};

window.navigateToFolder = (folderId) => {
    if (folderId === null) {
        window.folderHistory = [{id: null, name: 'الرئيسية'}];
        window.currentFolderId = null;
    } else {
        const folder = window.globalFolders.find(f => f.id === folderId);
        if (folder) {
            const idx = window.folderHistory.findIndex(h => h.id === folderId);
            if (idx > -1) window.folderHistory = window.folderHistory.slice(0, idx + 1);
            else window.folderHistory.push({ id: folder.id, name: folder.name });
            window.currentFolderId = folderId;
        }
    }
    if(typeof window.renderDriveFiles === 'function') window.renderDriveFiles();
};

window.deleteDriveItem = async (id, isFolder, itemName) => {
    const msg = isFolder ? 'حذف المجلد؟ سيتم حذف جميع محتوياته أيضاً.' : 'حذف هذا الملف؟';
    if(confirm(msg)) {
        try {
            const col = isFolder ? 'folders' : 'files';
            await deleteDoc(doc(dbStorage, 'artifacts', appId, 'public', 'data', col, id));
            showToast('تم الحذف', 'success');
        } catch(e) { console.error(e); }
    }
};

// ------------------------------------
// دوال المصاريف والاجتماعات
// ------------------------------------
window.handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if(!AppState.currentUserData) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), {
            desc: document.getElementById('expDesc').value, amount: document.getElementById('expAmount').value, 
            date: document.getElementById('expDate').value, addedBy: AppState.currentUserData.name, timestamp: Date.now()
        });
        document.getElementById('expensesForm').reset();
        showToast('تم إضافة المصروف', 'success');
    } catch(err) { console.error(err); }
};

window.deleteExpense = async (id) => {
    if(confirm('تأكيد الحذف؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'expenses', id));
        showToast('تم الحذف', 'success');
    }
};

window.renderExpenses = () => {
    const list = document.getElementById('expensesList');
    if(!list) return;
    list.innerHTML = '';
    if(window.globalExpenses.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">لا يوجد سجلات للمصاريف</td></tr>'; return;
    }
    window.globalExpenses.forEach(exp => {
        list.innerHTML += `
            <tr class="hover:bg-gray-50 border-b">
                <td class="p-3 text-sm" dir="ltr">${escapeHTML(exp.date)}</td>
                <td class="p-3 text-sm font-bold">${escapeHTML(exp.desc)}</td>
                <td class="p-3 text-sm font-bold text-teal-600" dir="ltr">${escapeHTML(exp.amount)}</td>
                <td class="p-3 text-xs text-gray-500">${escapeHTML(exp.addedBy)}</td>
                <td class="p-3"><button onclick="window.deleteExpense('${exp.id}')" class="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `;
    });
};

window.renderMeetings = () => {
    const activeList = document.getElementById('activeMeetingsList');
    if(!activeList) return;
    activeList.innerHTML = '';
    
    const myMeetings = window.globalMeetings.filter(m => m.invitedUsers?.includes(AppState.currentUserData?.uid) || AppState.currentUserData?.role === 'CEO');

    if(myMeetings.length === 0) {
        activeList.innerHTML = '<p class="text-sm text-gray-400 text-center col-span-full p-4">لا يوجد اجتماعات مجدولة حالياً.</p>';
        return;
    }

    myMeetings.forEach(meeting => {
        if(meeting.status === 'ended') return;
        let timeStr = meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString('ar-EG') : 'الآن';
        let statusBadge = meeting.status === 'active' ? `<span class="bg-red-100 text-red-600 font-bold text-[10px] px-2 py-1 rounded shadow-sm">جاري الآن</span>` : `<span class="bg-blue-100 text-blue-600 font-bold text-[10px] px-2 py-1 rounded shadow-sm">مجدول</span>`;
        let actionsHtml = `<button onclick="window.joinMeeting('${meeting.id}', '${escapeHTML(meeting.title)}')" class="bg-green-500 text-white text-xs px-3 py-2 rounded font-bold shadow">انضمام</button>`;
        
        if (AppState.currentUserData?.role === 'CEO') {
            actionsHtml += `<button onclick="window.deleteMeeting('${meeting.id}')" class="bg-gray-100 text-gray-600 px-3 py-2 rounded">حذف</button>`;
        }

        activeList.innerHTML += `
            <div class="bg-white border p-4 rounded-xl shadow-sm mb-2">
                <div class="flex justify-between mb-2"><h4 class="font-bold">${escapeHTML(meeting.title)}</h4>${statusBadge}</div>
                <p class="text-xs text-gray-500 font-bold mb-4">الموعد: ${timeStr}</p>
                <div class="flex gap-2">${actionsHtml}</div>
            </div>
        `;
    });
};

window.deleteMeeting = async (id) => {
    if(confirm('هل أنت متأكد من حذف هذا الاجتماع؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'meetings', id));
        showToast('تم الحذف', 'success');
    }
};

// مساعدة للحماية
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
} 
