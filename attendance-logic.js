import { db, appId } from './firebase-config.js';
import { doc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { currentUserData } from './auth-logic.js';
import { showToast } from './ui-logic.js';

export function renderAttendance() {
    // كود تحديث واجهة الحضور (Punch In/Out) بناءً على التاريخ الحالي
    // (استخدم الدوال التي وفرتها لك في المجلد الموحد سابقاً)
}

window.punchIn = async () => {
    const d = new Date();
    const today = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    const docId = `${currentUserData.uid}_${today}`;

    // طلب الموقع الجغرافي
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'attendance', docId), {
                uid: currentUserData.uid,
                name: currentUserData.name,
                date: today,
                punchIn: Date.now(),
                location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                status: 'active'
            });
            showToast('تم تسجيل الحضور بموقعك الحالي', 'success');
        } catch (e) { console.error(e); }
    }, () => showToast('يرجى تفعيل الموقع الجغرافي للبصمة', 'error'));
};
