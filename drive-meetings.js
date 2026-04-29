import { db, appId, collection, addDoc, doc, updateDoc, deleteDoc } from './firebase-config.js';

// ---- المستندات ----
window.currentFolderId = null;
window.folderHistory = [{id: null, name: 'الرئيسية'}];

window.handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = document.getElementById('newFolderName').value;
    if(!name.trim()) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'folders'), {
            name: name, parentId: window.currentFolderId, creatorId: window.currentUserData.uid, timestamp: Date.now()
        });
        window.closeModal('createFolderModal');
        window.showToast('تم إنشاء المجلد', 'success');
    } catch(err) { console.error(err); }
};

window.navigateToFolder = (folderId) => {
    if (folderId === null) {
        window.folderHistory = [{id: null, name: 'الرئيسية'}];
        window.currentFolderId = null;
    } else {
        const folder = window.globalFolders.find(f => f.id === folderId);
        if (folder) {
            const idx = window.folderHistory.findIndex(h => h.id === folderId);
            if (idx > -1) window.folderHistory = window.folderHistory.slice(0, idx + 1);
            else window.folderHistory.push({ id: folder.id, name: folder.name });
            window.currentFolderId = folderId;
        }
    }
    window.renderDriveFiles();
};

window.handleDriveFileSelect = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 500 * 1024) { window.showToast('الحد الأقصى للرفع 500KB.', 'warning'); e.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'files'), {
                name: file.name, type: file.type || 'unknown', size: file.size, 
                data: ev.target.result, uploaderName: window.currentUserData.name, 
                uploaderId: window.currentUserData.uid, folderId: window.currentFolderId,
                pinned: false, timestamp: Date.now()
            });
            window.showToast('تم رفع الملف بنجاح!', 'success');
        } catch (err) { console.error(err); window.showToast('حدث خطأ.', 'error'); }
        e.target.value = '';
    };
    reader.readAsDataURL(file);
};

window.renderDriveFiles = () => {
    const allContainer = document.getElementById('allFilesContainer');
    const breadcrumbs = document.getElementById('driveBreadcrumbs');
    if(!allContainer || !breadcrumbs) return;
    
    allContainer.innerHTML = '';
    breadcrumbs.innerHTML = '';
    const searchTerm = document.getElementById('searchDrive')?.value.toLowerCase() || '';

    window.folderHistory.forEach((h, index) => {
        const isLast = index === window.folderHistory.length - 1;
        breadcrumbs.innerHTML += `
            <span class="cursor-pointer flex items-center gap-1 ${isLast ? 'text-primary dark:text-secondary' : 'hover:text-secondary text-gray-500'}" onclick="window.navigateToFolder(${h.id ? `'${h.id}'` : null})">
                ${h.id === null ? '<i class="fa-solid fa-house"></i>' : ''} ${window.escapeHTML(h.name)}
            </span>
            ${!isLast ? '<i class="fa-solid fa-chevron-left text-[10px] text-gray-400 mt-1"></i>' : ''}
        `;
    });

    const currentFoldersList = window.globalFolders.filter(f => (f.parentId || null) === window.currentFolderId && f.name.toLowerCase().includes(searchTerm));
    const currentFilesList = window.globalFiles.filter(f => (f.folderId || null) === window.currentFolderId && f.name.toLowerCase().includes(searchTerm));

    if(currentFoldersList.length === 0 && currentFilesList.length === 0) {
        allContainer.innerHTML = '<p class="col-span-full text-center text-gray-500 py-8">المجلد فارغ.</p>';
    }

    currentFoldersList.forEach(f => {
        allContainer.innerHTML += `
            <div onclick="window.navigateToFolder('${f.id}')" class="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col h-full">
                <i class="fa-solid fa-folder text-indigo-500 text-3xl mb-2"></i>
                <h4 class="font-bold text-sm text-indigo-800 dark:text-indigo-200 truncate">${window.escapeHTML(f.name)}</h4>
            </div>
        `;
    });

    currentFilesList.forEach(f => {
        allContainer.innerHTML += `
            <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm flex flex-col h-full">
                <i class="fa-solid fa-file text-gray-400 text-2xl mb-2"></i>
                <h4 class="font-bold text-sm truncate mb-1">${window.escapeHTML(f.name)}</h4>
                <div class="mt-auto pt-3 flex justify-between">
                    <a href="${f.data}" download="${window.escapeHTML(f.name)}" class="text-secondary text-sm font-bold"><i class="fa-solid fa-download"></i> تحميل</a>
                </div>
            </div>
        `;
    });
};

// ---- الاجتماعات ----
window.jitsiApi = null;
window.openModal('createMeetingModal'); // This is handled in ui.js

document.getElementById('createMeetingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(window.currentUserData.role !== 'CEO') return;
    const title = document.getElementById('newMeetingTitle').value;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'meetings'), {
            title: title, createdBy: window.currentUserData.uid, creatorName: window.currentUserData.name, status: 'active', timestamp: Date.now()
        });
        window.closeModal('createMeetingModal');
        window.showToast('تم الإنشاء بنجاح', 'success');
    } catch(e) { console.error(e); }
});

window.joinMeeting = async (meetingId, title) => {
    document.getElementById('videoCallTitle').innerText = `اجتماع: ${title}`;
    document.getElementById('videoCallModal').classList.remove('hidden'); document.getElementById('videoCallModal').classList.add('flex');

    const domain = 'meet.jit.si';
    const roomName = `QuillWorldApp_${appId.substring(0,5)}_${meetingId.replace(/[^a-zA-Z0-9]/g, "")}`;
    const options = {
        roomName: roomName, width: '100%', height: '100%', parentNode: document.querySelector('#jitsiContainer'),
        userInfo: { displayName: window.currentUserData.name }, 
        configOverwrite: { prejoinPageEnabled: false, disableDeepLinking: true } // تم إضافة disableDeepLinking لإصلاح مشكلة الهاتف
    };
    document.querySelector('#jitsiContainer').innerHTML = '';
    window.jitsiApi = new JitsiMeetExternalAPI(domain, options);
};

window.endVideoCall = () => {
    if(window.jitsiApi) { window.jitsiApi.dispose(); window.jitsiApi = null; }
    document.getElementById('videoCallModal').classList.add('hidden'); 
    document.getElementById('videoCallModal').classList.remove('flex');
};

window.renderMeetings = () => {
    const activeList = document.getElementById('activeMeetingsList');
    if(!activeList) return;
    activeList.innerHTML = '';
    const meetings = window.globalMeetings.filter(m => m.status === 'active');
    
    if(meetings.length === 0) {
        activeList.innerHTML = '<p class="text-sm text-gray-400">لا يوجد اجتماعات حالياً.</p>'; return;
    }
    meetings.forEach(m => {
        activeList.innerHTML += `
            <div class="bg-white dark:bg-gray-800 border p-4 rounded-xl shadow-sm">
                <h4 class="font-bold mb-2">${window.escapeHTML(m.title)}</h4>
                <button onclick="window.joinMeeting('${m.id}', '${window.escapeHTML(m.title.replace(/'/g, "\\'"))}')" class="bg-green-500 text-white text-xs py-2 px-4 rounded font-bold shadow"><i class="fa-solid fa-video mx-1"></i> انضمام</button>
            </div>
        `;
    });
};

// ---- التعميمات (Notices) ----
window.deleteNotice = async (id) => {
    if(confirm('حذف هذا الإعلان؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notices', id)).catch(e => console.error(e));
    }
};

window.renderNotices = () => {
    // Basic render based on original
    const list = document.getElementById('noticesList');
    if(!list) return;
    list.innerHTML = '';
    window.globalNotices.forEach(n => {
        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 border-yellow-500 mb-4">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg">${window.escapeHTML(n.title)}</h3>
                    ${window.currentUserData.role === 'CEO' ? `<button onclick="window.deleteNotice('${n.id}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>` : ''}
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">${window.escapeHTML(n.body)}</p>
                <div class="text-[10px] text-gray-400 mt-3">بواسطة: ${window.escapeHTML(n.author)}</div>
            </div>
        `;
    });
};
