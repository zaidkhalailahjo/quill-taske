import { db, appId, collection, addDoc, doc, updateDoc, deleteDoc } from './firebase-config.js';

// ---- الجرد ----
window.switchInventoryTab = (location, tab) => {
    const activeContainer = document.getElementById(`${location}ActiveContainer`);
    const pastContainer = document.getElementById(`${location}PastContainer`);
    if(tab === 'active') {
        activeContainer.classList.remove('hidden'); pastContainer.classList.add('hidden');
    } else {
        pastContainer.classList.remove('hidden'); activeContainer.classList.add('hidden');
    }
};

window.openAddInventoryModal = (location) => {
    document.getElementById('inventoryForm').reset();
    document.getElementById('invLocation').value = location;
    window.openModal('inventoryModal');
};

document.getElementById('inventoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!window.currentUserData) return;
    const type = document.getElementById('invItemType').value; 
    let data = {
        location: document.getElementById('invLocation').value, itemType: type, isOld: false, addedBy: window.currentUserData.name, timestamp: Date.now()
    };
    if(type === 'robot') {
        data.name = document.getElementById('invRobotName').value;
        data.serialNumber = document.getElementById('invRobotSerial').value;
        data.status = document.getElementById('invRobotStatus').value;
        data.quantity = 1; 
    } else {
        data.name = document.getElementById('invPartName').value;
        data.quantity = document.getElementById('invPartQty').value;
        data.status = document.getElementById('invPartStatus').value;
    }
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'), data);
        window.closeModal('inventoryModal');
        window.showToast('تمت الإضافة بنجاح', 'success');
    } catch(err) { console.error(err); }
});

window.renderInventory = (location) => {
    const activeCont = document.getElementById(`${location}ActiveContainer`);
    if(!activeCont) return;
    activeCont.innerHTML = '';
    const items = window.globalInventory.filter(i => i.location === location && !i.isOld);
    
    if(items.length === 0) {
        activeCont.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">لا توجد نتائج.</p>'; return;
    }
    items.forEach(item => {
        activeCont.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
                <h3 class="font-bold text-lg"><i class="fa-solid ${item.itemType === 'robot' ? 'fa-robot' : 'fa-microchip'} mx-1"></i> ${window.escapeHTML(item.name)}</h3>
                <p class="text-xs text-gray-500 mt-2">الكمية: ${item.quantity} | الحالة: ${item.status}</p>
            </div>
        `;
    });
};

// ---- المتدربين ----
window.switchTraineesTab = (tab) => {
    const activeContainer = document.getElementById('activeTraineesContainer');
    const pastContainer = document.getElementById('pastTraineesContainer');
    if(tab === 'active') {
        activeContainer.classList.remove('hidden'); pastContainer.classList.add('hidden');
    } else {
        pastContainer.classList.remove('hidden'); activeContainer.classList.add('hidden');
    }
};

window.openAddTraineeModal = () => {
    document.getElementById('traineeForm').reset();
    window.openModal('traineeModal');
};

document.getElementById('traineeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'trainees'), {
            name: document.getElementById('traineeName').value,
            phone: document.getElementById('traineePhone').value,
            startDate: document.getElementById('traineeStartDate').value,
            status: 'active', timestamp: Date.now()
        });
        window.closeModal('traineeModal');
        window.showToast('تم إضافة المتدرب', 'success');
    } catch(e) { console.error(e); }
});

window.renderTrainees = () => {
    const activeCont = document.getElementById('activeTraineesContainer');
    if(!activeCont) return;
    activeCont.innerHTML = '';
    const trainees = window.globalTrainees.filter(t => t.status === 'active');
    if(trainees.length === 0) {
        activeCont.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">لا يوجد متدربين حالياً.</p>'; return;
    }
    trainees.forEach(t => {
        activeCont.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200">
                <h3 class="font-bold text-lg text-amber-600"><i class="fa-solid fa-user-graduate mx-1"></i> ${window.escapeHTML(t.name)}</h3>
                <p class="text-xs text-gray-500 mt-2">تاريخ البدء: ${t.startDate}</p>
            </div>
        `;
    });
};

// ---- المصاريف ----
window.handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if(!window.currentUserData) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'expenses'), {
            desc: document.getElementById('expDesc').value, amount: document.getElementById('expAmount').value, 
            date: document.getElementById('expDate').value, addedBy: window.currentUserData.name, timestamp: Date.now()
        });
        document.getElementById('expensesForm').reset();
        window.showToast('تم إضافة المصروف', 'success');
    } catch(err) { console.error(err); }
};

window.renderExpenses = () => {
    const list = document.getElementById('expensesList');
    if(!list) return;
    list.innerHTML = '';
    if(window.globalExpenses.length === 0) {
        list.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500">لا يوجد سجلات</td></tr>'; return;
    }
    window.globalExpenses.forEach(exp => {
        list.innerHTML += `
            <tr class="border-b dark:border-gray-700">
                <td class="p-3 text-sm">${exp.date}</td>
                <td class="p-3 text-sm font-bold">${window.escapeHTML(exp.desc)}</td>
                <td class="p-3 text-sm font-bold text-teal-600" dir="ltr">${exp.amount} JOD</td>
                <td class="p-3 text-xs text-gray-500">${window.escapeHTML(exp.addedBy)}</td>
            </tr>
        `;
    });
};
