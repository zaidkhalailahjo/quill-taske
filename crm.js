// js/crm.js
import { db, appId, doc, updateDoc, deleteDoc } from './firebase-config.js';

window.currentCrmTab = 'new';

window.switchCrmTab = (tabName) => {
    window.currentCrmTab = tabName;
    const tabs = ['new', 'current', 'signed'];
    tabs.forEach(t => {
        const btn = document.getElementById(`tab-crm-${t}`);
        const content = document.getElementById(`crm-content-${t}`);
        if (t === tabName) {
            btn?.classList.add('tab-active'); btn?.classList.remove('tab-inactive');
            content?.classList.remove('hidden');
        } else {
            btn?.classList.remove('tab-active'); btn?.classList.add('tab-inactive');
            content?.classList.add('hidden');
        }
    });
    
    if (tabName === 'new') window.renderCRM();
};

window.filterCRM = () => {
    const query = document.getElementById('crmSearchInput').value.toLowerCase();
    document.querySelectorAll('.client-card-item').forEach(el => {
        const name = el.getAttribute('data-name').toLowerCase();
        const phone = el.getAttribute('data-phone').toLowerCase();
        if(name.includes(query) || phone.includes(query)) el.style.display = 'flex';
        else el.style.display = 'none';
    });
};

window.renderCRM = () => {
    const list = document.getElementById('crmList');
    if(!list) return;
    list.innerHTML = '';
    
    const isCEO = window.currentUserData && window.currentUserData.role === 'CEO';
    const visibleClients = (window.globalCRM || []).filter(c => isCEO || c.addedById === window.currentUserData?.uid || (c.visibleTo && c.visibleTo.includes('all')));

    if(visibleClients.length === 0) {
        list.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">قاعدة العملاء فارغة حالياً.</p>'; return;
    }

    visibleClients.forEach(c => {
        const deleteClientBtn = (isCEO || c.addedById === window.currentUserData.uid) ?
            `<button onclick="window.deleteClient('${c.id}')" class="text-red-400 hover:text-red-600 mr-2 p-1"><i class="fa-solid fa-trash"></i></button>` : '';

        list.innerHTML += `
            <div class="client-card-item bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full" data-name="${window.escapeHTML(c.name)}" data-phone="${window.escapeHTML(c.phone || '')}">
                <div class="flex justify-between items-start mb-3 border-b pb-3">
                    <h3 class="font-bold text-lg text-primary truncate">${window.escapeHTML(c.name)} ${deleteClientBtn}</h3>
                    <span class="text-[10px] bg-gray-100 px-2 py-0.5 rounded font-bold">${window.escapeHTML(c.category || 'عام')}</span>
                </div>
                <select onchange="window.updateClientStatus('${c.id}', this.value)" class="text-xs p-2 rounded-lg font-bold outline-none cursor-pointer w-full mb-3 text-center bg-gray-100">
                    <option value="لم يتم الاتصال" ${c.status === 'لم يتم الاتصال' ? 'selected' : ''}>لم يتم الاتصال</option>
                    <option value="عميل محتمل" ${c.status === 'عميل محتمل' ? 'selected' : ''}>عميل محتمل</option>
                    <option value="تم التواصل - مهتم" ${c.status === 'تم التواصل - مهتم' ? 'selected' : ''}>تم التواصل - مهتم</option>
                </select>
                <div class="text-sm text-gray-600 space-y-2 flex-1 font-medium">
                    <p><i class="fa-solid fa-phone mx-1"></i> <span dir="ltr">${window.escapeHTML(c.phone || 'غير مسجل')}</span></p>
                </div>
                <div class="mt-4 border-t pt-3">
                    <button onclick="window.openClientModal('${c.id}')" class="w-full text-xs bg-gray-50 border py-2 rounded-lg font-bold"><i class="fa-solid fa-pen mx-1"></i> تعديل العميل</button>
                </div>
            </div>
        `;
    });
};

window.deleteClient = async (id) => {
    if(confirm('حذف هذا العميل نهائياً؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', id));
        window.showToast('تم حذف العميل بنجاح', 'success');
    }
};

window.updateClientStatus = async (cId, newStatus) => {
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', cId), { status: newStatus });
        window.showToast('تم تحديث حالة العميل', 'success');
    } catch(e) { console.error(e); }
};
