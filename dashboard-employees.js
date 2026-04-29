// js/dashboard-employees.js
import { db, appId, doc, updateDoc, deleteDoc } from './firebase-config.js';

window.updateDashboardStats = () => {
    const statEmp = document.getElementById('stat-employees');
    if(statEmp) statEmp.innerText = window.globalUsers.length;
    
    const statTasks = document.getElementById('stat-tasks');
    if(statTasks) statTasks.innerText = window.globalTasks.length;
    
    const statComp = document.getElementById('stat-completed');
    if(statComp) statComp.innerText = window.globalTasks.filter(t => t.status === 'completed').length;
};

window.renderEmployees = () 
    const list = document.getElementById('employeesList');
    const pendingList = document.getElementById('pendingEmployeesList');
    const pendingContainer = document.getElementById('pendingEmployeesContainer');
    if(!list) return;
    
    const isCEO = window.currentUserData && window.currentUserData.role === 'CEO';
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
                            <img src="${window.escapeHTML(emp.photoURL)}" class="w-8 h-8 rounded-full object-cover">
                            <div>
                                <p class="font-bold text-gray-800 dark:text-gray-200 text-sm">${window.escapeHTML(emp.name)}</p>
                                <p class="text-[10px] text-gray-500">${window.escapeHTML(emp.email)}</p>
                            </div>
                        </td>
                        <td class="p-3 md:p-4 text-orange-600 dark:text-orange-400 font-bold text-xs md:text-sm">${window.escapeHTML(emp.role)}</td>
                        <td class="p-3 md:p-4 whitespace-nowrap text-left">
                            <button onclick="window.approveEmployee('${emp.id}')" class="bg-green-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-sm hover:bg-green-600 transition mx-1"><i class="fa-solid fa-check mx-1"></i> قبول</button>
                            <button onclick="window.rejectEmployee('${emp.id}')" class="bg-red-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-sm hover:bg-red-600 transition"><i class="fa-solid fa-xmark mx-1"></i> رفض</button>
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
        if(isCEO && emp.id !== window.currentUserData.uid) { 
            actionsHtml = `
                <td class="p-3 md:p-4 whitespace-nowrap rtl:text-left ltr:text-right">
                    <button onclick="window.openEditEmployeeModal('${emp.id}', '${window.escapeHTML(emp.name)}', '${window.escapeHTML(emp.role)}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-gray-700 p-2 rounded mx-1 transition" title="تعديل الصلاحيات والممتلكات"><i class="fa-solid fa-user-shield"></i></button>
                    <button onclick="window.deleteEmployee('${emp.id}', '${window.escapeHTML(emp.name)}')" class="text-red-500 hover:text-red-700 bg-red-50 dark:bg-gray-700 p-2 rounded transition" title="حذف"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
        } else if(isCEO) {
            actionsHtml = `<td class="p-3 md:p-4 rtl:text-left ltr:text-right"><span class="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 px-2 py-1 rounded">أنت (المدير)</span></td>`;
        }
        list.innerHTML += `
            <tr class="hover:bg-gray-50 dark:bg-gray-700 transition-colors">
                <td class="p-3 md:p-4 flex items-center">
                    <img src="${window.escapeHTML(emp.photoURL)}" class="w-8 h-8 rounded-full mx-3 object-cover">
                    <span class="font-medium text-gray-800 dark:text-gray-200 text-sm">${window.escapeHTML(emp.name)}</span>
                </td>
                <td class="p-3 md:p-4 text-gray-600 dark:text-gray-300 font-bold text-xs md:text-sm">${window.escapeHTML(emp.role)}</td>
                ${actionsHtml}
            </tr>
        `;
    });
};

window.approveEmployee = async (uid) => {
    if (window.currentUserData.role !== 'CEO') return;
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { status: 'active' });
        window.showToast('تم قبول الموظف بنجاح', 'success');
    } catch(e) { console.error(e); }
};

window.rejectEmployee = async (uid) => {
    if (window.currentUserData.role !== 'CEO') return;
    if(confirm('هل أنت متأكد من رفض طلب الانضمام هذا؟ سيتم حظر دخوله للنظام.')) {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid), { status: 'rejected' });
            window.showToast('تم رفض الموظف', 'success');
        } catch(e) { console.error(e); }
    }
};

window.deleteEmployee = async (id, name) => {
    if(window.currentUserData.role !== 'CEO') return;
    if(confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', id)).catch(e => console.error(e));
        if(window.logAction) window.logAction('حذف موظف', `تم حذف الموظف: ${name}`);
    }
};

window.renderLogs = () => {
    const list = document.getElementById('logsList');
    if(!list) return;
    list.innerHTML = '';
    
    if(!window.globalLogs || window.globalLogs.length === 0) {
        list.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-500 dark:text-gray-400">لا يوجد سجلات حتى الآن.</td></tr>`;
        return;
    }

    window.globalLogs.forEach(log => {
        const timestamp = log.timestamp || 0;
        const dateObj = new Date(timestamp);
        const date = (timestamp > 0 && !isNaN(dateObj.getTime())) ? dateObj.toLocaleString('ar-EG') : 'تاريخ غير معروف';
        
        const actionText = log.action || '';
        const detailsText = log.details || 'لا توجد تفاصيل';
        const userNameText = log.userName || 'مستخدم غير معروف';
        
        let icon = 'fa-info-circle text-gray-400';
        if(actionText.includes('دخول') || actionText.includes('حضور')) icon = 'fa-right-to-bracket text-blue-500';
        if(actionText.includes('انصراف')) icon = 'fa-person-walking-arrow-right text-red-500';
        if(actionText.includes('مهمة')) icon = 'fa-check text-green-500';
        if(actionText.includes('حذف') || actionText.includes('مسح')) icon = 'fa-trash text-red-500';
        if(actionText.includes('عميل')) icon = 'fa-address-book text-lime-500';
        
        list.innerHTML += `
            <tr class="hover:bg-gray-50 dark:bg-gray-800 transition">
                <td class="p-3 md:p-4 text-[10px] md:text-xs text-gray-500 dark:text-gray-400" dir="ltr">${date}</td>
                <td class="p-3 md:p-4 text-xs md:text-sm font-bold text-primary dark:text-secondary">${window.escapeHTML(userNameText)}</td>
                <td class="p-3 md:p-4 text-xs md:text-sm text-gray-600 dark:text-gray-300"><i class="fa-solid ${icon} mx-2"></i>${window.escapeHTML(detailsText)}</td>
            </tr>
        `;
    });
};

window.filterLogs = () => {
    const query = document.getElementById('logSearchInput').value.toLowerCase();
    document.querySelectorAll('#logsList tr').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(query) ? 'table-row' : 'none';
    });
};

window.clearSystemLogs = async () => {
    if(window.currentUserData.role !== 'CEO') return;
    if(confirm('هل أنت متأكد من مسح جميع السجلات؟')) {
        try {
            window.globalLogs.forEach(async (log) => {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'logs', log.id));
            });
            window.showToast('تمت عملية المسح بنجاح', 'success');
        } catch(e) { console.error(e); }
    }
};
