// js/crm.js
import { db, appId } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast, closeModal, openModal } from './ui.js';

let globalCRM = [];

// استماع لبيانات العملاء
export function startCRMListener() {
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), (snapshot) => {
        globalCRM = [];
        snapshot.forEach(docSnap => {
            globalCRM.push({ id: docSnap.id, ...docSnap.data() });
        });
        globalCRM.sort((a, b) => b.timestamp - a.timestamp);
        renderCRM();
    }, (error) => console.error("Error fetching CRM:", error));
}

// عرض العملاء
window.renderCRM = () => {
    const list = document.getElementById('clientsContainer');
    if(!list) return;
    list.innerHTML = '';
    
    const isCEO = AppState.currentUserData && AppState.currentUserData.role === 'CEO';
    const visibleClients = globalCRM.filter(c => isCEO || c.addedById === AppState.currentUserData?.uid || (c.visibleTo && c.visibleTo.includes('all')));

    if(visibleClients.length === 0) {
        list.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">قاعدة العملاء فارغة حالياً.</p>'; 
        return;
    }

    visibleClients.forEach(c => {
        const deleteClientBtn = (isCEO || c.addedById === AppState.currentUserData.uid) ?
            `<button onclick="window.deleteClient('${c.id}')" class="text-red-400 hover:text-red-600 mr-2 p-1"><i class="fa-solid fa-trash"></i></button>` : '';

        list.innerHTML += `
            <div class="client-card-item bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full" data-name="${escapeHTML(c.name)}" data-phone="${escapeHTML(c.phone || '')}">
                <div class="flex justify-between items-start mb-3 border-b pb-3">
                    <h3 class="font-bold text-lg text-primary truncate">${escapeHTML(c.name)} ${deleteClientBtn}</h3>
                    <span class="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold">${escapeHTML(c.category || 'عام')}</span>
                </div>
                <select onchange="window.updateClientStatus('${c.id}', this.value)" class="text-xs p-2 rounded-lg font-bold outline-none cursor-pointer w-full mb-3 text-center bg-gray-100">
                    <option value="لم يتم الاتصال" ${c.status === 'لم يتم الاتصال' ? 'selected' : ''}>لم يتم الاتصال</option>
                    <option value="عميل محتمل" ${c.status === 'عميل محتمل' ? 'selected' : ''}>عميل محتمل</option>
                    <option value="تم التواصل - مهتم" ${c.status === 'تم التواصل - مهتم' ? 'selected' : ''}>تم التواصل - مهتم</option>
                </select>
                <div class="text-sm text-gray-600 space-y-2 flex-1 font-medium">
                    <p><i class="fa-solid fa-phone mx-1"></i> <span dir="ltr">${escapeHTML(c.phone || 'غير مسجل')}</span></p>
                </div>
                <div class="mt-4 border-t pt-3">
                    <button onclick="window.openEditClientModal('${c.id}')" class="w-full text-xs bg-gray-50 border py-2 rounded-lg font-bold"><i class="fa-solid fa-pen mx-1"></i> تعديل العميل</button>
                </div>
            </div>
        `;
    });
};

// حذف عميل
window.deleteClient = async (id) => {
    if(!confirm('هل أنت متأكد من حذف هذا العميل نهائياً؟')) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', id));
        showToast('تم حذف العميل بنجاح', 'success');
    } catch(e) { console.error(e); }
};

// تحديث حالة العميل
window.updateClientStatus = async (cId, newStatus) => {
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', cId), { status: newStatus });
        showToast('تم تحديث حالة العميل', 'success');
    } catch(e) { console.error(e); }
};

// أداة حماية النصوص للـ CRM
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}
