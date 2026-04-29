// drive-meetings.js
import { db, appId, collection, addDoc, doc, deleteDoc } from './firebase-config.js';

window.currentFolderId = null;
window.folderHistory = [{id: null, name: 'الرئيسية'}];

window.handleCreateFolder = async (e) => {
    e.preventDefault();
    const name = document.getElementById('newFolderName').value;
    if(!name.trim() || !window.currentUserData) return;
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'folders'), {
            name: name, parentId: window.currentFolderId, creatorId: window.currentUserData.uid, timestamp: Date.now()
        });
        window.closeModal('createFolderModal');
        window.showToast('تم إنشاء المجلد', 'success');
    } catch(err) { console.error(err); 
                  
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
    if(typeof window.renderDriveFiles === 'function') window.renderDriveFiles();
};

window.deleteDriveItem = async (id, isFolder, itemName) => {
    const msg = isFolder ? 'هل أنت متأكد من حذف المجلد؟ سيتم حذف جميع محتوياته أيضاً.' : 'هل أنت متأكد من حذف هذا الملف؟';
    if(confirm(msg)) {
        try {
            const col = isFolder ? 'folders' : 'files';
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
            window.showToast('تم الحذف', 'success');
        } catch(e) { console.error(e); }
    }
};
