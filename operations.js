// js/operations.js
import { db, appId } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast, closeModal, openModal } from './ui.js';

let globalExpenses = [];
let globalMeetings = [];
let globalNotices = [];

// استدعاء البيانات الحية
export function startOperationsListener() {
    // 1. المصاريف
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), (snapshot) => {
        globalExpenses = [];
        snapshot.forEach(docSnap => globalExpenses.push({id: docSnap.id, ...docSnap.data()}));
        globalExpenses.sort((a,b) => b.timestamp - a.timestamp);
        if(window.location.hash === '#expenses') renderExpenses();
    }, (error) => console.error(error));

    // 2. الاجتماعات
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'meetings'), (snapshot) => {
        globalMeetings = [];
        snapshot.forEach(docSnap => globalMeetings.push({ id: docSnap.id, ...docSnap.data() }));
        globalMeetings.sort((a,b) => b.timestamp - a.timestamp); 
        if(window.location.hash === '#meetings') renderMeetings();
    }, (error) => console.error(error));

    // 3. التعميمات
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'notices'), (snapshot) => {
        globalNotices = [];
        snapshot.forEach(docSnap => globalNotices.push({ id: docSnap.id, ...docSnap.data() }));
        globalNotices.sort((a, b) => b.timestamp - a.timestamp);
        if(window.location.hash === '#notices') renderNotices();
    }, (error) => console.error(error));
}

// ----------------------------------------------------
// 1. إدارة المصاريف والنثريات
// ----------------------------------------------------
window.handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if(!AppState.currentUserData) return;
    
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), {
            desc: document.getElementById('expDesc').value, 
            amount: document.getElementById('expAmount').value, 
            date: document.getElementById('expDate').value, 
            addedBy: AppState.currentUserData.name, 
            timestamp: Date.now()
        });
        document.getElementById('expensesForm').reset();
        showToast('تم إضافة المصروف', 'success');
    } catch(err) { console.error(err); showToast('حدث خطأ', 'error'); }
};

window.deleteExpense = async (id) => {
    if(confirm('تأكيد حذف هذا السجل؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'expenses', id));
        showToast('تم الحذف', 'success');
    }
};

window.renderExpenses = () => {
    const list = document.getElementById('expensesList');
    if(!list) return;
    list.innerHTML = '';
    
    if(globalExpenses.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">لا يوجد سجلات للمصاريف</td></tr>';
        return;
    }

    globalExpenses.forEach(exp => {
        list.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700">
                <td class="p-3 text-sm" dir="ltr">${escapeHTML(exp.date)}</td>
                <td class="p-3 text-sm font-bold text-gray-800 dark:text-gray-200">${escapeHTML(exp.desc)}</td>
                <td class="p-3 text-sm font-bold text-teal-600 dark:text-teal-400" dir="ltr">${escapeHTML(exp.amount)} JOD</td>
                <td class="p-3 text-xs text-gray-500">${escapeHTML(exp.addedBy)}</td>
                <td class="p-3">
                    <button onclick="window.deleteExpense('${exp.id}')" class="text-red-500 hover:text-red-700 bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
};

// ----------------------------------------------------
// 2. إدارة الاجتماعات (Meetings)
// ----------------------------------------------------
window.renderMeetings = () => {
    const activeList = document.getElementById('activeMeetingsList');
    if(!activeList) return;
    activeList.innerHTML = '';
    
    const myMeetings = globalMeetings.filter(m => m.invitedUsers?.includes(AppState.currentUserData?.uid) || AppState.currentUserData?.role === 'CEO');

    if(myMeetings.length === 0) {
        activeList.innerHTML = '<p class="text-sm text-gray-400 text-center col-span-full p-4">لا يوجد اجتماعات مجدولة حالياً.</p>';
        return;
    }

    myMeetings.forEach(meeting => {
        if(meeting.status === 'ended') return; // يمكن إضافة قائمة pastList لاحقاً للمنتهية
        let timeStr = meeting.scheduledFor ? new Date(meeting.scheduledFor).toLocaleString('ar-EG') : 'الآن';
        let statusBadge = meeting.status === 'active' ? `<span class="bg-red-100 text-red-600 font-bold text-[10px] px-2 py-1 rounded shadow-sm"><i class="fa-solid fa-circle text-[8px] animate-pulse"></i> جاري الآن</span>` : `<span class="bg-blue-100 text-blue-600 font-bold text-[10px] px-2 py-1 rounded shadow-sm">مجدول</span>`;
        
        let actionsHtml = `<button onclick="window.joinMeeting('${meeting.id}', '${escapeHTML(meeting.title)}')" class="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-2 rounded font-bold shadow"><i class="fa-solid fa-video mx-1"></i> انضمام</button>`;
        
        if (AppState.currentUserData?.role === 'CEO') {
            actionsHtml += `
                <button onclick="window.endMeetingForEveryone('${meeting.id}')" class="bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded transition" title="إنهاء للجميع"><i class="fa-solid fa-power-off"></i></button>
                <button onclick="window.deleteMeeting('${meeting.id}')" class="bg-gray-100 hover:bg-gray-200 text-gray-600 w-8 h-8 rounded transition" title="حذف"><i class="fa-solid fa-trash"></i></button>
            `;
        }

        activeList.innerHTML += `
            <div class="bg-white dark:bg-gray-800 border dark:border-gray-700 p-4 rounded-xl shadow-sm hover:shadow-md transition">
                <div class="flex justify-between mb-2"><h4 class="font-bold text-gray-800 dark:text-gray-100">${escapeHTML(meeting.title)}</h4>${statusBadge}</div>
                <p class="text-xs text-gray-500 font-bold mb-4"><i class="fa-regular fa-clock ml-1"></i> الموعد: ${timeStr}</p>
                <div class="flex gap-2">${actionsHtml}</div>
            </div>
        `;
    });
};

window.endMeetingForEveryone = async (meetingId) => {
    if(confirm('إنهاء الاجتماع للجميع ونقله للسجل؟')) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'meetings', meetingId), { status: 'ended', endedAt: Date.now() });
        showToast('تم إنهاء الاجتماع', 'success');
    }
};

window.deleteMeeting = async (id) => {
    if(confirm('هل أنت متأكد من حذف هذا الاجتماع؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'meetings', id));
        showToast('تم الحذف', 'success');
    }
};

// ----------------------------------------------------
// 3. إدارة التعميمات (Notices)
// ----------------------------------------------------
window.renderNotices = () => {
    const list = document.getElementById('noticesList');
    if(!list) return;
    list.innerHTML = '';

    const validNotices = globalNotices.filter(n => !n.expiryDate || n.expiryDate >= Date.now());

    if(validNotices.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-8">لا توجد إعلانات أو تعميمات حالياً.</p>';
        return;
    }

    const isCEO = AppState.currentUserData?.role === 'CEO';

    validNotices.forEach(n => {
        const dateStr = new Date(n.timestamp).toLocaleDateString('ar-EG');
        const delBtn = isCEO ? `<button onclick="window.deleteNotice('${n.id}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>` : '';

        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500 relative mb-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg">${escapeHTML(n.title)}</h3>
                    ${delBtn}
                </div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 whitespace-pre-line leading-relaxed">${escapeHTML(n.body)}</p>
                <div class="text-[10px] text-gray-400 flex items-center gap-4 mt-3 border-t pt-2">
                    <span><i class="fa-solid fa-user-pen"></i> بواسطة: ${escapeHTML(n.author)}</span>
                    <span><i class="fa-solid fa-calendar"></i> ${dateStr}</span>
                </div>
            </div>
        `;
    });
};

window.deleteNotice = async (id) => {
    if(confirm('حذف هذا التعميم؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notices', id));
        showToast('تم حذف التعميم', 'success');
    }
};

// أداة الحماية من الثغرات
function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}
