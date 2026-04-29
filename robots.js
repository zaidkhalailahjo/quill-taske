// js/robots.js
import { db, appId } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast, closeModal, openModal } from './ui.js';

let globalRobots = [];
let globalRentals = [];
let currentRobotsTab = 'inCompany';

// بدء الاستماع لقواعد بيانات الروبوتات والإيجارات
export function startRobotsListener() {
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'robots'), (snapshot) => {
        globalRobots = [];
        snapshot.forEach(docSnap => globalRobots.push({ id: docSnap.id, ...docSnap.data() }));
        globalRobots.sort((a, b) => b.timestamp - a.timestamp);
        renderCurrentRobotsTab();
    }, (error) => console.error("Error fetching robots:", error));

    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'rentals'), (snapshot) => {
        globalRentals = [];
        snapshot.forEach(docSnap => globalRentals.push({ id: docSnap.id, ...docSnap.data() }));
        globalRentals.sort((a, b) => b.timestamp - a.timestamp);
        renderCurrentRobotsTab();
    }, (error) => console.error("Error fetching rentals:", error));
}

// التنقل بين تبويبات الروبوتات
window.switchRobotsTab = (tabName) => {
    currentRobotsTab = tabName;
    const containers = ['inCompanyContainer', 'inWarehouseContainer', 'rentedNowContainer', 'pastRentersContainer'];
    containers.forEach(c => document.getElementById(c)?.classList.add('hidden'));
    
    // إخفاء الأزرار وإظهار المناسب منها
    document.getElementById('addRobotCompanyBtn')?.classList.add('hidden');
    document.getElementById('addRobotWarehouseBtn')?.classList.add('hidden');
    document.getElementById('addRentalBtn')?.classList.add('hidden');

    if (tabName === 'inCompany') {
        document.getElementById('inCompanyContainer')?.classList.remove('hidden');
        document.getElementById('addRobotCompanyBtn')?.classList.remove('hidden');
    } else if (tabName === 'inWarehouse') {
        document.getElementById('inWarehouseContainer')?.classList.remove('hidden');
        document.getElementById('addRobotWarehouseBtn')?.classList.remove('hidden');
    } else if (tabName === 'rentedNow') {
        document.getElementById('rentedNowContainer')?.classList.remove('hidden');
        document.getElementById('addRentalBtn')?.classList.remove('hidden');
    } else if (tabName === 'pastRenters') {
        document.getElementById('pastRentersContainer')?.classList.remove('hidden');
    }
    
    renderCurrentRobotsTab();
};

window.renderCurrentRobotsTab = () => {
    if (currentRobotsTab === 'inCompany') renderRobotsList('inCompanyContainer', 'company');
    else if (currentRobotsTab === 'inWarehouse') renderRobotsList('inWarehouseContainer', 'warehouse');
    // يمكنك إضافة دوال renderRentedNow() و renderPastRenters() هنا بنفس المنطق
};

// عرض الروبوتات حسب الموقع
function renderRobotsList(containerId, location) {
    const cont = document.getElementById(containerId);
    if (!cont) return;
    cont.innerHTML = '';
    
    const searchTerm = document.getElementById('searchRobots')?.value.toLowerCase() || '';
    const robots = globalRobots.filter(r => r.location === location && !r.isRented && 
        (r.name.toLowerCase().includes(searchTerm) || r.serialNumber.toLowerCase().includes(searchTerm)));

    if (robots.length === 0) {
        cont.innerHTML = `<p class="col-span-full text-center text-gray-500 py-8">لا يوجد روبوتات في ${location === 'company' ? 'الشركة' : 'المستودع'} حالياً.</p>`; 
        return;
    }

    robots.forEach(r => {
        const isCEO = AppState.currentUserData?.role === 'CEO';
        const deleteBtn = isCEO ? `<button onclick="window.deleteRobot('${r.id}')" class="text-red-500 hover:bg-red-50 p-2 rounded transition"><i class="fa-solid fa-trash mx-1"></i> حذف</button>` : '';

        cont.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col hover:shadow-md transition">
                <div class="flex justify-between items-start mb-3 border-b pb-2">
                    <h3 class="font-bold text-lg text-primary"><i class="fa-solid fa-robot mx-1"></i> ${escapeHTML(r.name)}</h3>
                </div>
                <div class="text-xs text-gray-600 space-y-2 mb-4">
                    <p class="flex justify-between"><span>الرقم التسلسلي:</span> <span class="font-bold" dir="ltr">${escapeHTML(r.serialNumber)}</span></p>
                    <p class="flex justify-between"><span>الحالة:</span> <span class="font-bold">${escapeHTML(r.status)}</span></p>
                </div>
                <div class="mt-auto pt-2 border-t text-left">
                    ${deleteBtn}
                </div>
            </div>
        `;
    });
}

// إضافة روبوت جديد
document.getElementById('robotForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!AppState.currentUserData) return;
    
    const data = {
        name: document.getElementById('newRobotName').value,
        serialNumber: document.getElementById('newRobotSerial').value,
        status: document.getElementById('newRobotStatus').value,
        location: document.getElementById('robotLocation').value,
        isRented: false,
        addedBy: AppState.currentUserData.name,
        timestamp: Date.now()
    };

    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'robots'), data);
        showToast('تم إضافة الروبوت بنجاح', 'success');
        closeModal('addRobotModal');
    } catch(err) { 
        console.error(err); 
        showToast('حدث خطأ', 'error'); 
    }
});

window.deleteRobot = async (id) => {
    if(!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'robots', id));
        showToast('تم الحذف', 'success');
    } catch(e) { console.error(e); }
};

// أداة تنظيف النصوص
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}
