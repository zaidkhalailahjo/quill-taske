// js/attendance-leaves.js
import { db, appId, addDoc, doc, setDoc, updateDoc, deleteDoc } from './firebase-config.js';

function getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

window.punchIn = async () => {
    if(!window.currentUserData) return;
    const today = getTodayDateString();
    const docId = `${window.currentUserData.uid}_${today}`;
    try {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', docId), {
            uid: window.currentUserData.uid, name: window.currentUserData.name, date: today, punchIn: Date.now(), breaks: [], punchOut: null, status: 'active'
        });
        window.showToast('تم تسجيل الدخول بنجاح', 'success');
        window.logAction('حضور', 'قام الموظف بتسجيل الدخول للدوام');
        window.hasPunchedInToday = true;
        
        // فتح التطبيقات
        document.getElementById('attendanceLockBanner').classList.add('hidden');
        document.getElementById('homeGridContainer').classList.remove('hidden');
        document.getElementById('sidebarLockMessage').classList.add('hidden');
        document.getElementById('mainNavigationMenu').classList.remove('hidden');
        
    } catch(e) { console.error(e); }
};

window.punchOut = async () => {
    if(!confirm('هل أنت متأكد من تسجيل الانصراف وإنهاء الدوام لهذا اليوم؟')) return;
    if(!window.currentUserData) return;
    const today = getTodayDateString();
    const docId = `${window.currentUserData.uid}_${today}`;
    try {
        const record = window.globalAttendance.find(a => a.uid === window.currentUserData.uid && a.date === today);
        if(record) {
            let breaks = record.breaks || [];
            if(breaks.length > 0 && breaks[breaks.length - 1].end === null) breaks[breaks.length - 1].end = Date.now();
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', docId), { breaks: breaks, punchOut: Date.now(), status: 'completed' });
        }
        window.showToast('تم تسجيل الانصراف.', 'success');
        window.logAction('انصراف', 'قام الموظف بتسجيل الانصراف');
        window.renderEmpAttendanceView(); 
    } catch(e) { console.error(e); }
};

window.renderEmpAttendanceView = () => {
    if(!window.currentUserData) return;
    document.getElementById('currentDateStr').innerText = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const today = getTodayDateString();
    const myTodayRecord = window.globalAttendance.find(a => a.uid === window.currentUserData.uid && a.date === today);
    
    const inBtn = document.getElementById('punchInBtn');
    const outBtn = document.getElementById('punchOutBtn');
    const msg = document.getElementById('attendanceStatusMsg');

    if(!myTodayRecord) {
        msg.innerText = 'لم تقم بتسجيل الدخول اليوم. يجب التسجيل أولاً لفتح باقي النظام.';
        inBtn.classList.remove('hidden'); outBtn.classList.add('hidden');
        window.hasPunchedInToday = false;
    } else {
        window.hasPunchedInToday = true;
        inBtn.classList.add('hidden');
        if(myTodayRecord.status === 'active') {
            msg.innerText = 'أنت الآن على رأس عملك.';
            outBtn.classList.remove('hidden');
        } else if(myTodayRecord.status === 'completed') {
            msg.innerText = 'لقد قمت بتسجيل الانصراف لهذا اليوم.';
            outBtn.classList.add('hidden');
        }
    }
};

// إرسال طلب إجازة
document.getElementById('leaveForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(!window.currentUserData) return;
    
    const fromDate = new Date(document.getElementById('leaveFrom').value).getTime();
    const toDate = new Date(document.getElementById('leaveTo').value).getTime();
    
    if(toDate <= fromDate) {
        window.showToast('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء', 'warning');
        return;
    }

    try {
        await addDoc(window.getColRef('leaves'), {
            uid: window.currentUserData.uid, 
            name: window.currentUserData.name, 
            type: document.getElementById('leaveType').value,
            from: fromDate, 
            to: toDate,
            reason: document.getElementById('leaveReason').value, 
            status: 'pending', 
            timestamp: Date.now()
        });
        window.closeModal('leaveModal');
        window.showToast('تم إرسال طلب الإجازة للمدير', 'success');
        window.logAction('إجازات', 'تم تقديم طلب إجازة جديد');
    } catch(err) { console.error(err); }
});
