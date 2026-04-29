// js/tasks.js
import { db, appId, doc, updateDoc, deleteDoc } from './firebase-config.js';

window.currentTaskTab = 'active';

window.switchTaskTab = (tabName) => {
    window.currentTaskTab = tabName;
    const btnActive = document.getElementById('tab-tasks-active');
    const btnReports = document.getElementById('tab-tasks-reports');
    
    if (tabName === 'active') {
        btnActive.className = 'font-bold text-sm whitespace-nowrap px-3 py-1 rounded-full bg-white text-primary transition shadow-sm';
        btnReports.className = 'font-bold text-sm whitespace-nowrap bg-white/20 px-3 py-1 rounded-full text-white transition';
    } else {
        btnActive.className = 'font-bold text-sm whitespace-nowrap bg-white/20 px-3 py-1 rounded-full text-white transition';
        btnReports.className = 'font-bold text-sm whitespace-nowrap px-3 py-1 rounded-full bg-white text-primary transition shadow-sm';
    }
    window.renderTasks();
};

window.renderTasks = () => {
    const listBody = document.getElementById('tasksListBody');
    if(!listBody) return;
    listBody.innerHTML = '';
    
    let tasksToRender = window.globalTasks || [];
    if(tasksToRender.length === 0) {
        document.getElementById('emptyTasksMessage')?.classList.remove('hidden'); return;
    } else {
        document.getElementById('emptyTasksMessage')?.classList.add('hidden');
    }

    tasksToRender.forEach(task => {
        const isCompleted = task.status === 'completed';
        listBody.innerHTML += `
            <tr class="task-row-item border-b border-gray-100 ${isCompleted ? 'opacity-60' : ''}">
                <td class="p-3 text-center"><input type="checkbox" class="custom-checkbox" ${isCompleted ? 'checked' : ''} disabled></td>
                <td class="p-3 font-bold">${window.escapeHTML(task.title)}</td>
                <td class="p-3 text-xs text-gray-500">${window.escapeHTML(task.assigneeName)}</td>
                <td class="p-3 text-center">
                    <button onclick="window.deleteTask('${task.id}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });
};

window.deleteTask = async (id) => {
    if(confirm('حذف هذه المهمة نهائياً؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id));
        window.showToast('تم الحذف بنجاح', 'success');
    }
};
