import { db, appId, collection, addDoc, doc, updateDoc, deleteDoc } from './firebase-config.js';

// ---- قسم الروبوتات ----
window.currentRobotsTab = 'inCompany';
window.switchRobotsTab = (tabName) => {
    window.currentRobotsTab = tabName;
    ['inCompanyContainer', 'inWarehouseContainer'].forEach(c => {
        const el = document.getElementById(c);
        if(el) el.classList.add('hidden');
    });
    ['InCompany', 'InWarehouse'].forEach(t => {
        const btn = document.getElementById(`tabRobots${t}`);
        if(btn) btn.className = "whitespace-nowrap py-2 px-4 font-bold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 transition-colors";
    });

    const activeBtn = document.getElementById(`tabRobots${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    const activeContainer = document.getElementById(`${tabName}Container`);
    if(activeBtn) activeBtn.className = "whitespace-nowrap py-2 px-4 font-bold text-sm border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 flex items-center gap-2 transition-colors";
    if(activeContainer) activeContainer.classList.remove('hidden');

    document.getElementById('addRobotCompanyBtn').classList.add('hidden');
    document.getElementById('addRobotWarehouseBtn').classList.add('hidden');
    
    if (tabName === 'inCompany') document.getElementById('addRobotCompanyBtn').classList.remove('hidden');
    else if (tabName === 'inWarehouse') document.getElementById('addRobotWarehouseBtn').classList.remove('hidden');
    
    window.renderCurrentRobotsTab();
};

window.renderCurrentRobotsTab = () => {
    const cont = document.getElementById(window.currentRobotsTab + 'Container');
    if(!cont) return;
    cont.innerHTML = '';
    const searchTerm = document.getElementById('searchRobots')?.value.toLowerCase() || '';
    
    const location = window.currentRobotsTab === 'inCompany' ? 'company' : 'warehouse';
    const robots = window.globalRobots.filter(r => r.location === location && !r.isRented && (r.name.toLowerCase().includes(searchTerm) || r.serialNumber.toLowerCase().includes(searchTerm)));
    
    const badge = document.getElementById('robotsSearchCount');
    if(badge) {
        if(searchTerm) { badge.innerText = `النتائج: ${robots.length}`; badge.classList.remove('hidden'); }
        else badge.classList.add('hidden');
    }

    if(robots.length === 0) {
        cont.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">لا يوجد روبوتات غير مؤجرة هنا حالياً.</p>'; return;
    }

    robots.forEach(r => {
        const statusColor = r.status === 'جديد' ? 'text-green-500' : (r.status === 'معطل' ? 'text-red-500' : 'text-yellow-500');
        cont.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full hover:shadow-md transition">
                <div class="flex justify-between items-start mb-3 border-b dark:border-gray-700 pb-2">
                    <h3 class="font-bold text-lg text-blue-700 dark:text-blue-400"><i class="fa-solid fa-robot mx-1"></i> ${window.escapeHTML(r.name)}</h3>
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-300 space-y-2 mb-4">
                    <p class="flex justify-between"><span>الرقم التسلسلي:</span> <span class="font-bold" dir="ltr">${window.escapeHTML(r.serialNumber)}</span></p>
                    <p class="flex justify-between"><span>الحالة:</span> <span class="font-bold ${statusColor}">${window.escapeHTML(r.status)}</span></p>
                    <p class="flex justify-between"><span>أضيف بواسطة:</span> <span>${window.escapeHTML(r.addedBy)}</span></p>
                </div>
                <div class="mt-auto pt-2 text-left border-t dark:border-gray-700">
                    <button onclick="window.deleteRobot('${r.id}')" class="text-red-500 hover:bg-red-50 dark:hover:bg-gray-700 px-2 py-1 rounded transition text-[10px] font-bold"><i class="fa-solid fa-trash mx-1"></i> حذف الروبوت</button>
                </div>
            </div>
        `;
    });
};

window.openAddRobotModal = (location) => {
    document.getElementById('robotForm').reset();
    document.getElementById('robotLocation').value = location;
    document.getElementById('addRobotTitle').innerText = location === 'company' ? 'إضافة روبوت إلى الشركة' : 'إضافة روبوت إلى المستودع';
    window.openModal('addRobotModal');
};

document.getElementById('robotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!window.currentUserData) return;
    const data = {
        name: document.getElementById('newRobotName').value,
        serialNumber: document.getElementById('newRobotSerial').value,
        status: document.getElementById('newRobotStatus').value,
        location: document.getElementById('robotLocation').value,
        isRented: false,
        addedBy: window.currentUserData.name,
        timestamp: Date.now()
    };
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'robots'), data);
        window.showToast('تم إضافة الروبوت بنجاح', 'success');
        window.closeModal('addRobotModal');
    } catch(e) { console.error(e); window.showToast('حدث خطأ', 'error'); }
});

window.deleteRobot = async (id) => {
    if(confirm('هل أنت متأكد من الحذف؟')) {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'robots', id));
            window.showToast('تم الحذف', 'success');
        } catch(e) { console.error(e); }
    }
};

// ---- قسم إدارة العملاء (CRM) ----
window.currentCrmManagementTab = 'clients';
window.switchCrmManagementTab = (tabName) => {
    window.currentCrmManagementTab = tabName;
    ['clientsContainer', 'soldContainer'].forEach(c => {
        const el = document.getElementById(c);
        if(el) el.classList.add('hidden');
    });
    ['Clients', 'Sold'].forEach(t => {
        const btn = document.getElementById(`tabCrm${t}`);
        if(btn) btn.className = "whitespace-nowrap py-2 px-4 font-bold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 transition-colors";
    });

    const activeBtn = document.getElementById(`tabCrm${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    const activeContainer = document.getElementById(`${tabName}Container`);
    if(activeBtn) activeBtn.className = "whitespace-nowrap py-2 px-4 font-bold text-sm border-b-2 border-lime-600 text-lime-600 dark:text-lime-400 flex items-center gap-2 transition-colors";
    if(activeContainer) activeContainer.classList.remove('hidden');

    const addBtn = document.getElementById('addClientBtn');
    if (tabName === 'clients' && addBtn) addBtn.classList.remove('hidden');
    else if (addBtn) addBtn.classList.add('hidden');

    window.renderCrmManagementTab();
};

window.renderCrmManagementTab = () => {
    if(window.currentCrmManagementTab === 'clients') window.renderClients();
    if(window.currentCrmManagementTab === 'sold') window.renderSoldRobots();
};

window.renderClients = () => {
    const cont = document.getElementById('clientsContainer');
    if(!cont) return;
    cont.innerHTML = '';
    const searchTerm = document.getElementById('searchCrmManagement')?.value.toLowerCase() || '';
    
    const clients = window.globalClients.filter(c => c.name.toLowerCase().includes(searchTerm) || (c.phone && c.phone.includes(searchTerm)));
    if(clients.length === 0) {
        cont.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">لا يوجد عملاء مسجلين بعد أو غير مطابقين للبحث.</p>';
        return;
    }

    clients.forEach(c => {
        const logoHtml = c.logoUrl ? `<img src="${window.escapeHTML(c.logoUrl)}" class="w-12 h-12 rounded-full object-cover border border-gray-200 dark:border-gray-600 bg-white">` : `<div class="w-12 h-12 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-xl font-bold"><i class="fa-solid fa-user-tie"></i></div>`;
        const phoneHtml = c.phone ? `<a href="tel:${c.phone}" class="hover:text-indigo-500 transition">${window.escapeHTML(c.phone)}</a>` : 'لا يوجد رقم';
        
        cont.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full hover:shadow-md transition">
                <div class="flex items-center gap-3 mb-3 border-b dark:border-gray-700 pb-3">
                    ${logoHtml}
                    <div>
                        <h3 class="font-bold text-lg text-indigo-700 dark:text-indigo-400">${window.escapeHTML(c.name)}</h3>
                        <p class="text-[10px] text-gray-500" dir="ltr">${phoneHtml}</p>
                    </div>
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-300 space-y-2 mb-4 flex-1">
                    ${c.email ? `<p><i class="fa-solid fa-envelope text-gray-400 mx-1"></i> ${window.escapeHTML(c.email)}</p>` : ''}
                    <p class="text-[10px] font-bold mt-2">حالة العميل: <span class="text-lime-600">${window.escapeHTML(c.status)}</span></p>
                </div>
                <div class="pt-3 border-t dark:border-gray-700 flex gap-2 mt-auto">
                    <button onclick="window.openClientModal('${c.id}')" class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs py-1.5 rounded font-bold transition">تعديل العميل</button>
                    <button onclick="window.deleteClient('${c.id}')" class="flex-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs py-1.5 rounded font-bold transition">حذف</button>
                </div>
            </div>
        `;
    });
};

window.renderSoldRobots = () => {
    // (يتم استخراجها من الروبوتات المرتبطة بالعميل)
    const cont = document.getElementById('soldContainer');
    if(!cont) return;
    cont.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">لا يوجد روبوتات مباعة مسجلة حتى الآن (يتم إضافتها من ملف العميل).</p>';
};

// ---- قسم المستأجرين ----
window.currentRentersTab = 'rentedNow';
window.switchRentersTab = (tabName) => {
    window.currentRentersTab = tabName;
    ['rentedNowContainer', 'pastRentersContainer'].forEach(c => {
        const el = document.getElementById(c);
        if(el) el.classList.add('hidden');
    });
    ['Now', 'Past'].forEach(t => {
        const btn = document.getElementById(`tabRenters${t}`);
        if(btn) btn.className = "whitespace-nowrap py-2 px-4 font-bold text-sm border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 transition-colors";
    });

    const activeBtn = document.getElementById(`tabRenters${tabName === 'rentedNow' ? 'Now' : 'Past'}`);
    const activeContainer = document.getElementById(`${tabName}Container`);
    if(activeBtn) activeBtn.className = "whitespace-nowrap py-2 px-4 font-bold text-sm border-b-2 border-teal-600 text-teal-600 dark:text-teal-400 flex items-center gap-2 transition-colors";
    if(activeContainer) activeContainer.classList.remove('hidden');

    const addBtn = document.getElementById('addRentalBtn');
    if (tabName === 'rentedNow' && addBtn) addBtn.classList.remove('hidden');
    else if (addBtn) addBtn.classList.add('hidden');

    window.renderRentersTab();
};

window.renderRentersTab = () => {
    if(window.currentRentersTab === 'rentedNow') window.renderRentedNow();
    if(window.currentRentersTab === 'pastRenters') window.renderPastRenters();
};

window.renderRentedNow = () => {
    const cont = document.getElementById('rentedNowContainer');
    if(!cont) return;
    cont.innerHTML = '';
    const searchTerm = document.getElementById('searchRenters')?.value.toLowerCase() || '';
    
    const activeRentals = window.globalRentals.filter(r => r.status === 'active' && r.clientName.toLowerCase().includes(searchTerm));

    if(activeRentals.length === 0) {
        cont.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">لا يوجد مستأجرين حالياً.</p>'; return;
    }

    activeRentals.forEach(r => {
        const phoneHtml = r.phone ? `<a href="tel:${r.phone}" class="hover:text-blue-600 transition"><i class="fa-solid fa-phone mx-1"></i>${window.escapeHTML(r.phone)}</a>` : '<span class="text-gray-400">---</span>';
        cont.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900/50 flex flex-col h-full hover:shadow-md transition">
                <div class="flex justify-between items-center mb-3 border-b dark:border-gray-700 pb-2">
                    <h3 class="font-bold text-sm text-blue-700 dark:text-blue-400"><i class="fa-solid fa-handshake"></i> ${window.escapeHTML(r.clientName)}</h3>
                    <p class="text-[10px] text-gray-500" dir="ltr">${phoneHtml}</p>
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-300 space-y-2 mb-4 flex-1">
                    <p class="flex justify-between bg-blue-50 dark:bg-gray-900 p-1.5 rounded"><span class="font-bold">الاستلام:</span> <span dir="ltr">${r.fromDate.replace('T', ' ')}</span></p>
                    <p class="flex justify-between bg-blue-50 dark:bg-gray-900 p-1.5 rounded"><span class="font-bold">الانتهاء:</span> <span dir="ltr">${r.toDate.replace('T', ' ')}</span></p>
                </div>
                <div class="pt-3 border-t dark:border-gray-700 flex gap-2 mt-auto">
                    <button onclick="window.endRental('${r.id}')" class="flex-1 bg-red-50 text-red-600 text-xs py-1.5 rounded font-bold transition border border-red-200">إنهاء الاستئجار</button>
                </div>
            </div>
        `;
    });
};

window.renderPastRenters = () => {
    const cont = document.getElementById('pastRentersContainer');
    if(!cont) return;
    cont.innerHTML = '';
    const searchTerm = document.getElementById('searchRenters')?.value.toLowerCase() || '';
    
    const endedRentals = window.globalRentals.filter(r => r.status === 'ended' && r.clientName.toLowerCase().includes(searchTerm));

    if(endedRentals.length === 0) {
        cont.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">لا يوجد سجلات سابقة.</p>'; return;
    }

    endedRentals.forEach(r => {
        cont.innerHTML += `
            <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full opacity-90 transition">
                <div class="flex justify-between items-center mb-3 border-b pb-2">
                    <h3 class="font-bold text-sm text-gray-700 dark:text-gray-300 line-through decoration-gray-400">${window.escapeHTML(r.clientName)}</h3>
                    <button onclick="window.deleteRental('${r.id}')" class="text-red-500 hover:text-red-700 transition" title="حذف السجل"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="text-xs text-gray-500 space-y-2 mb-2 flex-1">
                    <p class="flex justify-between p-1"><span class="font-bold">من:</span> <span dir="ltr">${r.fromDate.replace('T', ' ')}</span></p>
                    <p class="flex justify-between p-1"><span class="font-bold">إلى:</span> <span dir="ltr">${r.toDate.replace('T', ' ')}</span></p>
                </div>
            </div>
        `;
    });
};

window.endRental = async (id) => {
    if(confirm('هل أنت متأكد من إنهاء هذا الاستئجار؟')) {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rentals', id), { status: 'ended', endedAt: Date.now() });
            window.showToast('تم إنهاء الاستئجار', 'success');
        } catch (e) { console.error(e); }
    }
};

window.deleteRental = async (id) => {
    if(confirm('حذف السجل نهائياً؟')) {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rentals', id));
            window.showToast('تم الحذف', 'success');
        } catch(e) { console.error(e); }
    }
};

document.getElementById('rentalForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        clientName: document.getElementById('rentalClientName').value,
        phone: document.getElementById('rentalPhone').value,
        fromDate: document.getElementById('rentalFrom').value,
        toDate: document.getElementById('rentalTo').value,
        notes: document.getElementById('rentalNotes').value,
        status: 'active', 
        addedBy: window.currentUserData.name,
        timestamp: Date.now()
    };
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'rentals'), data);
        window.showToast('تمت إضافة الاستئجار بنجاح', 'success');
        window.closeModal('addRentalModal');
    } catch(e) { console.error(e); window.showToast('حدث خطأ', 'error'); }
});
