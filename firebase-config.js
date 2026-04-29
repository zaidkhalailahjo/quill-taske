// notices.js
import { db, appId, doc, deleteDoc } from './firebase-config.js';

window.renderNotices = () => {
    const list = document.getElementById('noticesList');
    if(!list) return;
    list.innerHTML = '';
    
    const isCEO = window.currentUserData && window.currentUserData.role === 'CEO';
    const canPost = window.currentUserData && window.currentUserData.permissions?.canNotices;
    
    const addNoticeBtn = document.getElementById('addNoticeBtn');
    if (addNoticeBtn) {
        if(isCEO || canPost) addNoticeBtn.classList.remove('hidden');
        else addNoticeBtn.classList.add('hidden');
    }

    const now = Date.now();
    const validNotices = (window.globalNotices || []).filter(n => (!n.expiryDate || n.expiryDate >= now));

    if(validNotices.length === 0) {
        list.innerHTML = '<p class="text-center text-gray-500 py-8">لا توجد إعلانات أو تعميمات حالياً.</p>';
        return;
    }

    validNotices.forEach(n => {
        const dateStr = new Date(n.timestamp).toLocaleDateString('ar-EG');
        const delBtn = (isCEO || canPost) ? `<button onclick="window.deleteNotice('${n.id}')" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-trash"></i></button>` : '';
        
        const badgeType = n.isPoll || n.type === 'poll' ? 'تصويت' : window.escapeHTML(n.type || 'تعميم إداري');
        const badgeClass = n.isPoll || n.type === 'poll' ? 'bg-secondary' : 'bg-primary';

        list.innerHTML += `
            <div class="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border-l-4 ${n.isPoll || n.type==='poll'? 'border-secondary' : 'border-yellow-500'} dark:border-gray-700 relative mb-4">
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-3">
                        <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100">${window.escapeHTML(n.title)}</h3>
                        <span class="${badgeClass} text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">${badgeType}</span>
                    </div>
                    ${delBtn}
                </div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 whitespace-pre-line leading-relaxed">${window.escapeHTML(n.body)}</p>
                <div class="text-[10px] text-gray-400 flex items-center gap-4 mt-3">
                    <span><i class="fa-solid fa-user-pen"></i> بواسطة: ${window.escapeHTML(n.author)}</span>
                    <span><i class="fa-solid fa-calendar"></i> ${dateStr}</span>
                </div>
            </div>
        `;
    });
};

window.deleteNotice = async (id) => {
    if(confirm('حذف هذا الإعلان؟')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'notices', id)).catch(e => console.error(e));
        window.showToast('تم حذف التعميم', 'success');
    }
};
