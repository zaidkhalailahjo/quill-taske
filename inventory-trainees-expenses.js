// inventory-trainees-expenses.js
import { db, appId, collection, addDoc, doc, deleteDoc } from './firebase-config.js';

// ---- الجرد ----
window.switchInventoryTab = (location, tab) => {
    const activeContainer = document.getElementById(`${location}ActiveContainer`);
    const pastContainer = document.getElementById(`${location}PastContainer`);
    if(activeContainer && pastContainer) {
        if(tab === 'active') {
            activeContainer.classList.remove('hidden'); pastContainer.classList.add('hidden');
        } else {
            pastContainer.classList.remove('hidden'); activeContainer.classList.add('hidden');
        }
    }
};

window.openAddInventoryModal = (location) => {
    document.getElementById('inventoryForm')?.reset();
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

window.deleteInventoryItem = async (id) => {
    if(window.currentUserData.role !== 'CEO') return;
    if(confirm('هل أنت متأكد من الحذف النهائي؟')) {
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', id));
            window.showToast('تم الحذف', 'success');
        } catch(e) { console.error(e); }
    }
};

// ---- المتدربين ----
window.switchTraineesTab = (tab) => {
    const activeContainer = document.getElementById('activeTraineesContainer');
    const pastContainer = document.getElementById('pastTraineesContainer');
    if(activeContainer && pastContainer) {
        if(tab === 'active') {
            activeContainer.classList.remove('hidden'); pastContainer.classList.add('hidden');
        } else {
            pastContainer.classList.remove('hidden'); activeContainer.classList.add('hidden');
        }
    }
};

window.openAddTraineeModal = () => {
    document.getElementById('traineeForm')?.reset();
    window.openModal('traineeModal');
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
