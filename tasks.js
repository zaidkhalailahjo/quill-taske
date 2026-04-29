// tasks.js
import { db, appId, addDoc, doc, updateDoc, deleteDoc } from './firebase-config.js';

window.currentTaskTab = 'active'; 
window.creationChecklists = [];

window.switchTaskTab = (tabName) => {
    window.currentTaskTab = tabName;
    const btnActive = document.getElementById('tab-tasks-active');
    const btnReports = document.getElementById('tab-tasks-reports');
    
    if (tabName === 'active') {
        if(btnActive) btnActive.className = 'font-bold text-sm whitespace-nowrap px-3 py-1 rounded-full bg-white text-primary transition shadow-sm';
        if(btnReports) btnReports.className = 'font-bold text-sm whitespace-nowrap bg-white/20 px-3 py-1 rounded-full text-white hover:bg-white/30 transition';
    } else {
        if(btnActive) btnActive.className = 'font-bold text-sm whitespace-nowrap bg-white/20 px-3 py-1 rounded-full text-white hover:bg-white/30 transition';
        if(btnReports) btnReports.className = 'font-bold text-sm whitespace-nowrap px-3 py-1 rounded-full bg-white text-primary transition shadow-sm';
    }
    if(typeof window.renderTasks === 'function') window.renderTasks();
};

window.filterTasksList = () => {
    const query = document.getElementById('taskSearchInput').value.toLowerCase();
    document.querySelectorAll('.task-row-item').forEach(el => {
        const title = el.getAttribute('data-title').toLowerCase();
        const assignee = el.getAttribute('data-assignee').toLowerCase();
        
        if(title.includes(query) || assignee.includes(query)) {
            el.style.display = 'table-row';
        } else {
            el.style.display = 'none';
            const detailsRow = document.getElementById(`task-details-tr-${el.getAttribute('data-id')}`);
            if(detailsRow) detailsRow.style.display = 'none';
        }
    });
};

window.renderTasks = () => {
    const listBody = document.getElementById('tasksListBody');
    if(!listBody) return;
    listBody.innerHTML = '';
    
    const isCEO = window.currentUserData && window.currentUserData.role === 'CEO';
    let tasksToRender = window.globalTasks || [];
    
    if(!isCEO) tasksToRender = tasksToRender.filter(t => t.assigneeId === window.currentUserData.uid || t.createdBy === window.currentUserData.uid);

    if (window.currentTaskTab === 'reports' && !isCEO) {
        tasksToRender = tasksToRender.filter(t => (t.status === 'completed' || t.status === 'pending_approval') && t.assigneeId === window.currentUserData.uid);
    } else if (window.currentTaskTab === 'active') {
        tasksToRender = tasksToRender.filter(t => t.status !== 'completed' && t.status !== 'pending_approval');
    }

    tasksToRender.sort((a,b) => b.timestamp - a.timestamp); 
    
    const countList = document.getElementById('totalTasksCountList');
    if(countList) countList.innerText = tasksToRender.length;

    if(tasksToRender.length === 0) {
        document.getElementById('emptyTasksMessage')?.classList.remove('hidden'); return;
    } else {
        document.getElementById('emptyTasksMessage')?.classList.add('hidden');
    }

    tasksToRender.forEach(task => {
        const isMyTask = task.assigneeId === window.currentUserData.uid;
        const canCheck = isMyTask || isCEO;
        const isCompleted = task.status === 'completed';
        const isPendingApproval = task.status === 'pending_approval';
        
        let statusDot = task.status === 'in-progress' ? 'bg-blue-500' : (isCompleted ? 'bg-green-500' : (isPendingApproval ? 'bg-orange-500' : 'bg-gray-300'));
        let statusText = task.status === 'in-progress' ? 'قيد التنفيذ' : (isCompleted ? 'مكتمل' : (isPendingApproval ? 'بانتظار الموافقة' : 'قيد الانتظار'));

        const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleString('ar-EG', {month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit'}) : '-';
        
        let checklistHtml = '';
        if(task.checklists && task.checklists.length > 0) {
            let clItemsHtml = task.checklists.map((cl, idx) => `
                <div class="flex items-center gap-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded">
                    <input type="checkbox" class="custom-checkbox w-4 h-4 rounded-sm" ${cl.isCompleted ? 'checked' : ''} disabled>
                    <span class="text-sm ${cl.isCompleted ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}">${window.escapeHTML(cl.text)}</span>
                </div>
            `).join('');
            checklistHtml = `<div class="mt-3 border-t border-gray-100 dark:border-gray-600 pt-3"><div class="grid grid-cols-1 md:grid-cols-2 gap-2">${clItemsHtml}</div></div>`;
        }

        const fireIcon = task.isHighPriority ? '<i class="fa-solid fa-fire text-orange-500 mr-2" title="أولوية قصوى"></i>' : '';
        const assigneeAvatar = `<img src="https://ui-avatars.com/api/?name=${encodeURIComponent(task.assigneeName)}&background=random&color=fff" class="w-6 h-6 rounded-full inline-block ml-2">`;
        
        const isCreator = task.createdBy === window.currentUserData.uid;
        
        listBody.innerHTML += `
            <tr class="task-row-item hover:bg-gray-50 dark:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 ${isCompleted ? 'opacity-60' : ''}" data-id="${task.id}" data-title="${window.escapeHTML(task.title)}" data-assignee="${window.escapeHTML(task.assigneeName)}">
                <td class="p-3 text-center">
                    <input type="checkbox" class="custom-checkbox" ${isCompleted || isPendingApproval ? 'checked' : ''} ${!canCheck || isPendingApproval || isCompleted ? 'disabled' : ''} onchange="window.updateTaskStatusFromCheckbox('${task.id}', '${window.escapeHTML(task.title.replace(/'/g, "\\'"))}', this.checked)">
                </td>
                <td class="p-3">
                    <div class="flex items-center cursor-pointer" onclick="window.toggleTaskDetailsList('${task.id}')">
                        <span class="font-bold text-gray-800 dark:text-gray-100 ${isCompleted ? 'line-through' : ''} ml-2">${window.escapeHTML(task.title)}</span>
                        <i id="task-chevron-${task.id}" class="fa-solid fa-chevron-down text-gray-400 text-xs transition-transform duration-300 ml-2"></i>
                        ${fireIcon}
                    </div>
                </td>
                <td class="p-3 whitespace-nowrap"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full ${statusDot}"></span><span class="text-xs text-gray-500">${statusText}</span></div></td>
                <td class="p-3 whitespace-nowrap"><span class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 px-2 py-1 rounded text-xs font-bold">${deadlineStr}</span></td>
                <td class="p-3 whitespace-nowrap text-xs text-gray-500">بواسطة المالك</td>
                <td class="p-3 whitespace-nowrap font-medium text-gray-700 dark:text-gray-300">${assigneeAvatar} ${window.escapeHTML(task.assigneeName)}</td>
                <td class="p-3 text-center">${isCEO || isCreator ? `<button onclick="window.deleteTask('${task.id}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>` : ''}</td>
            </tr>
            <tr id="task-details-tr-${task.id}" class="bg-gray-50/50 dark:bg-gray-800/50 hidden">
                <td colspan="7" class="p-0 border-0">
                    <div id="task-details-${task.id}" class="p-4 mr-10">
                        <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">${window.escapeHTML(task.desc)}</p>
                        ${checklistHtml}
                    </div>
                </td>
            </tr>
        `;
    });
};

window.toggleTaskDetailsList = (id) => {
    const tr = document.getElementById(`task-details-tr-${id}`);
    const icon = document.getElementById(`task-chevron-${id}`);
    if (tr) {
        tr.classList.toggle('hidden');
        if (icon) icon.classList.toggle('rotate-180');
    }
};

window.deleteTask = async (id) => {
    const task = window.globalTasks.find(t => t.id === id);
    if(window.currentUserData.role !== 'CEO' && task?.createdBy !== window.currentUserData.uid) return;
    if(confirm('حذف هذه المهمة نهائياً؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id));
        window.showToast('تم الحذف بنجاح', 'success');
    }
};
