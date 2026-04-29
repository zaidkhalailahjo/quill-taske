// js/hr.js
import { db, appId } from './firebase-config.js';
import { collection, addDoc, doc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast, closeModal } from './ui.js';

let globalAttendance = [];
let globalLeaves = [];

export function startHRListener() {
    // استماع للحضور والانصراف
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'attendance'), (snapshot) => {
        globalAttendance = [];
        snapshot.forEach(d => globalAttendance.push({ id: d.id, ...d.data() }));
        if(window.location.hash === '#attendance') renderAttendanceView();
    }, (error) => console.error(error));

    // استماع للإجازات
    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'leaves'), (snapshot) => {
        globalLeaves = [];
        snapshot.forEach(d => globalLeaves.push({ id: d.id, ...d.data() }));
        globalLeaves.sort((a,b) => b.timestamp - a.timestamp); 
        if(window.location.hash === '#leaves') renderLeavesList();
    }, (error) => console.error(error));
}

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

window.punchIn = async () => {
    if (!AppState.currentUserData) return;
    const today = getTodayDateString();
    const docId = `${AppState.currentUserData.uid}_${today}`;
    
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', docId), {
            uid: AppState.currentUserData.uid, 
            name: AppState.currentUserData.name, 
            date: today, 
            punchIn: Date.now(), 
            breaks: [], 
            punchOut: null, 
            status: 'active'
        });
        showToast('تم تسجيل الدخول بنجاح', 'success');
        AppState.hasPunchedInToday = true;
        
        // إعادة بناء القائمة الجانبية (لفتح القفل)
        if(typeof window.initWorkspace === 'function') window.initWorkspace(AppState.currentUserData);
        
    } catch(e) { console.error(e); }
};

window.punchOut = async () => {
    if (!confirm('هل أنت متأكد من تسجيل الانصراف وإنهاء الدوام؟')) return;
    if (!AppState.currentUserData) return;
    
    const today = getTodayDateString();
    const docId = `${AppState.currentUserData.uid}_${today}`;
    
    try {
        const record = globalAttendance.find(a => a.uid === AppState.currentUserData.uid && a.date === today);
        if (record) {
            let breaks = record.breaks || [];
            if(breaks.length > 0 && breaks[breaks.length - 1].end === null) breaks[breaks.length - 1].end = Date.now();
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', docId), { 
                breaks: breaks, 
                punchOut: Date.now(), 
                status: 'completed' 
            });
        }
        showToast('تم تسجيل الانصراف.', 'success');
        renderAttendanceView(); 
    } catch(e) { console.error(e); }
};

window.renderAttendanceView = () => {
    if(!AppState.currentUserData) return;
    document.getElementById('currentDateStr').innerText = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const today = getTodayDateString();
    const myTodayRecord = globalAttendance.find(a => a.uid === AppState.currentUserData.uid && a.date === today);
    
    const inBtn = document.getElementById('punchInBtn');
    const outBtn = document.getElementById('punchOutBtn');
    const msg = document.getElementById('attendanceStatusMsg');

    if(!myTodayRecord) {
        msg.innerText = 'لم تقم بتسجيل الدخول اليوم. يجب التسجيل أولاً لفتح باقي النظام.';
        inBtn?.classList.remove('hidden'); 
        outBtn?.classList.add('hidden');
        AppState.hasPunchedInToday = false;
    } else {
        AppState.hasPunchedInToday = true;
        inBtn?.classList.add('hidden');
        if(myTodayRecord.status === 'active') {
            msg.innerText = 'أنت الآن على رأس عملك.';
            outBtn?.classList.remove('hidden');
        } else if(myTodayRecord.status === 'completed') {
            msg.innerText = 'لقد قمت بتسجيل الانصراف لهذا اليوم.';
            outBtn?.classList.add('hidden');
        }
    }
};

// طلب إجازة
document.getElementById('leaveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!AppState.currentUserData) return;
    
    const fromDate = new Date(document.getElementById('leaveFrom').value).getTime();
    const toDate = new Date(document.getElementById('leaveTo').value).getTime();
    
    if(toDate <= fromDate) {
        showToast('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء', 'warning');
        return;
    }

    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'leaves'), {
            uid: AppState.currentUserData.uid, 
            name: AppState.currentUserData.name, 
            type: document.getElementById('leaveType').value,
            from: fromDate, 
            to: toDate,
            reason: document.getElementById('leaveReason').value, 
            status: 'pending', 
            timestamp: Date.now()
        });
        closeModal('leaveModal');
        showToast('تم إرسال طلب الإجازة للمدير', 'success');
    } catch(err) { console.error(err); }
});

// لعرض قائمة الإجازات
window.renderLeavesList = () => {
    // منطق العرض للجدول (موجود لديك مسبقاً، يتم استدعاؤه هنا ليتماشى مع الهيكل الجديد)
};
