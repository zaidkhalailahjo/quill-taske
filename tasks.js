// js/tasks.js
import { db, appId } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast, closeModal } from './ui.js';

let globalTasks = [];

// استماع للتحديثات الحية للمهام
export function startTasksListener() {
    const tasksRef = collection(db, 'artifacts', appId, 'public', 'data', 'tasks');
    const q = query(tasksRef, orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        globalTasks = [];
        snapshot.forEach(docSnap => {
            globalTasks.push({ id: docSnap.id, ...docSnap.data() });
        });
        renderTasks();
    }, (error) => console.error("Error fetching tasks:", error));
}

// دالة عرض المهام في الجدول
function renderTasks() {
    const listBody = document.getElementById('tasksListBody');
    const emptyMsg = document.getElementById('emptyTasksMessage');
    if (!listBody) return;
    
    listBody.innerHTML = '';
    const isCEO = AppState.currentUserData?.role === 'CEO';
    
    // فلترة المهام: المدير يرى الكل، الموظف يرى مهامه فقط
    let tasksToRender = globalTasks;
    if (!isCEO) {
        tasksToRender = globalTasks.filter(t => t.assigneeId === AppState.currentUserData.uid || t.createdBy === AppState.currentUserData.uid);
    }

    if (tasksToRender.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    } else {
        if (emptyMsg) emptyMsg.classList.add('hidden');
    }

    tasksToRender.forEach(task => {
        const isCompleted = task.status === 'completed';
        const statusText = isCompleted ? 'مكتمل ✅' : (task.status === 'in-progress' ? 'قيد التنفيذ 🛠️' : 'قيد الانتظار ⏳');
        const statusColor = isCompleted ? 'text-green-500' : (task.status === 'in-progress' ? 'text-blue-500' : 'text-gray-500');
        const dateStr = new Date(task.timestamp).toLocaleDateString('ar-EG');

        listBody.innerHTML += `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b dark:border-gray-700 ${isCompleted ? 'opacity-60' : ''}">
                <td class="p-3">
                    <span class="font-bold text-gray-800 dark:text-gray-100 ${isCompleted ? 'line-through' : ''}">${task.title}</span>
                </td>
                <td class="p-3 font-bold ${statusColor}">${statusText}</td>
                <td class="p-3 text-gray-600 dark:text-gray-400">${dateStr}</td>
                <td class="p-3 text-gray-700 dark:text-gray-300 font-medium">${task.assigneeName}</td>
                <td class="p-3 text-center">
                    ${!isCompleted ? `<button onclick="window.completeTask('${task.id}')" class="text-green-500 hover:bg-green-50 p-2 rounded"><i class="fa-solid fa-check"></i></button>` : ''}
                    ${isCEO ? `<button onclick="window.deleteTask('${task.id}')" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `;
    });
}

// إنشاء مهمة جديدة
document.getElementById('addTaskForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!AppState.currentUserData) return;

    const title = document.getElementById('taskTitle').value;
    const desc = document.getElementById('taskDesc').value;
    // (يجب أن تكون قائمة الموظفين معبأة مسبقاً في الـ Select)
    const assigneeSelect = document.getElementById('taskAssignee');
    const assigneeId = assigneeSelect.value;
    const assigneeName = assigneeSelect.options[assigneeSelect.selectedIndex].text;

    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), {
            title: title,
            desc: desc,
            assigneeId: assigneeId,
            assigneeName: assigneeName,
            createdBy: AppState.currentUserData.uid,
            status: 'pending',
            timestamp: Date.now()
        });
        
        closeModal('taskModal');
        showToast('تم إسناد المهمة بنجاح', 'success');
        document.getElementById('addTaskForm').reset();
    } catch(err) {
        console.error(err);
        showToast('فشل إنشاء المهمة', 'error');
    }
});

// إنجاز المهمة (مبدئياً بدون نافذة التقرير، للتبسيط)
window.completeTask = async (taskId) => {
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), {
            status: 'completed',
            completedAt: Date.now()
        });
        showToast('أحسنت! تم إنجاز المهمة.', 'success');
    } catch(e) { console.error(e); }
};

window.deleteTask = async (taskId) => {
    if(!confirm('حذف هذه المهمة نهائياً؟')) return;
    try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId));
        showToast('تم الحذف', 'success');
    } catch(e) { console.error(e); }
};
