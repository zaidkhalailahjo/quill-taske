import { db, appId } from './firebase-config.js';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { showToast, closeModal } from './ui-logic.js';
import { currentUserData } from './auth-logic.js';

export let globalTasks = [];

export function startTasksListener() {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), orderBy('timestamp', 'desc'));
    
    onSnapshot(q, (snapshot) => {
        globalTasks = [];
        snapshot.forEach(docSnap => globalTasks.push({ id: docSnap.id, ...docSnap.data() }));
        renderTasks();
    });
}

export function renderTasks() {
    const listBody = document.getElementById('tasksListBody');
    if (!listBody) return;
    listBody.innerHTML = '';

    const isCEO = currentUserData?.role === 'CEO';
    const tasksToRender = isCEO ? globalTasks : globalTasks.filter(t => t.assigneeId === currentUserData.uid || t.createdBy === currentUserData.uid);

    if (tasksToRender.length === 0) {
        document.getElementById('emptyTasksMessage')?.classList.remove('hidden');
        return;
    }
    document.getElementById('emptyTasksMessage')?.classList.add('hidden');

    tasksToRender.forEach(task => {
        const isComp = task.status === 'completed';
        listBody.innerHTML += `
            <tr class="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="p-3"><input type="checkbox" ${isComp ? 'checked' : ''} onchange="window.updateTaskStatus('${task.id}', this.checked)"></td>
                <td class="p-3 ${isComp ? 'line-through text-gray-400' : 'font-bold'}">${window.escapeHTML(task.title)}</td>
                <td class="p-3 text-xs">${task.assigneeName}</td>
                <td class="p-3 text-left">
                    ${isCEO ? `<button onclick="window.deleteTask('${task.id}')" class="text-red-500"><i class="fa-solid fa-trash"></i></button>` : ''}
                </td>
            </tr>
        `;
    });
}

window.updateTaskStatus = async (id, isChecked) => {
    try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id), {
            status: isChecked ? 'completed' : 'in-progress',
            completedAt: isChecked ? Date.now() : null
        });
        showToast(isChecked ? 'تم إنجاز المهمة' : 'تمت إعادة فتح المهمة', 'success');
    } catch (e) { console.error(e); }
};

window.deleteTask = async (id) => {
    if(confirm('حذف هذه المهمة نهائياً؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id));
        showToast('تم الحذف', 'success');
    }
};
