// js/chat.js
import { db, appId, doc, updateDoc, deleteDoc, addDoc, collection } from './firebase-config.js';

window.currentGroupId = 'global';

window.selectGroup = (groupId) => {
    window.currentGroupId = groupId;
    if(typeof window.updateReadReceipt === 'function') window.updateReadReceipt(groupId);
    window.renderChatSidebarList();
    window.renderChat();
    if(window.innerWidth < 768) {
        document.getElementById('chatSubMenuMobile')?.classList.add('max-h-0', 'opacity-0');
    }
};

window.renderChatSidebarList = () => {
    const innerList = document.getElementById('innerChatSidebarList');
    if(!innerList) return;
    innerList.innerHTML = '';
    
    (window.globalGroups || []).forEach(g => {
        const isActive = window.currentGroupId === g.id && !document.getElementById('chat').classList.contains('hidden');
        innerList.innerHTML += `
            <button onclick="window.selectGroup('${g.id}')" class="w-full text-right py-2 px-3 rounded-lg text-sm transition-colors flex items-center ${isActive ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-600 hover:bg-gray-100'}">
                <i class="fa-solid ${g.id === 'global' ? 'fa-globe' : 'fa-hashtag'} w-5 text-center mx-2 text-gray-400"></i> 
                <span class="truncate flex-1">${window.escapeHTML(g.name)}</span>
            </button>
        `;
    });
};

window.renderChat = () => {
    const chatBox = document.getElementById('chatMessages');
    if(!chatBox) return;
    chatBox.innerHTML = '';
    
    const filteredChat = (window.globalChat || []).filter(msg => (msg.groupId || 'global') === window.currentGroupId);
    
    if(filteredChat.length === 0) {
        chatBox.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm"><i class="fa-regular fa-comments text-4xl mb-3"></i><p>لا توجد رسائل هنا. ابدأ المحادثة الآن!</p></div>';
        return;
    }

    filteredChat.slice(-100).forEach(msg => {
        const isMe = msg.uid === window.currentUserData?.uid;
        const alignClass = isMe ? 'justify-start' : 'justify-end';
        const msgBgClass = isMe ? 'bg-[#00839b] text-white' : 'bg-white border text-gray-800';
        const radiusClass = isMe ? 'rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'rounded-tl-xl rounded-tr-xl rounded-br-xl';
        const timeStr = new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
        
        chatBox.innerHTML += `
            <div class="flex ${alignClass} mb-4 items-end gap-2 w-full">
                <div class="max-w-[85%] relative">
                    <div class="flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : ''}">
                        <span class="text-[10px] font-bold text-gray-500">${window.escapeHTML(msg.senderName || 'مجهول')}</span>
                    </div>
                    <div class="p-3 shadow-sm ${msgBgClass} ${radiusClass}">
                        ${msg.text ? `<p class="text-sm md:text-base break-words whitespace-pre-wrap">${window.escapeHTML(msg.text)}</p>` : ''}
                        <div class="text-[9px] mt-1 text-right opacity-70" dir="ltr">${timeStr}</div>
                    </div>
                </div>
            </div>
        `;
    });
    chatBox.scrollTop = chatBox.scrollHeight;
};

window.clearOrDeleteGroup = async (action) => {
    if(window.currentUserData.role !== 'CEO') return;
    if(window.currentGroupId === 'global' && action === 'delete') return;

    if(confirm(action === 'clear' ? 'هل أنت متأكد من مسح الرسائل؟' : 'حذف المجموعة نهائياً؟')) {
        try {
            const msgs = window.globalChat.filter(m => (m.groupId || 'global') === window.currentGroupId);
            msgs.forEach(async (m) => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'chat', m.id)));

            if(action === 'delete') {
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'groups', window.currentGroupId));
                window.currentGroupId = 'global';
                window.showSection('home-grid');
            }
            window.showToast('تم التنفيذ بنجاح', 'success');
        } catch(e) { console.error(e); }
    }
};

window.filterChat = () => {
    const query = document.getElementById('chatSearchInput').value.toLowerCase();
    document.querySelectorAll('#chatMessages .flex.mb-4').forEach(el => {
        if(el.innerText.toLowerCase().includes(query)) el.style.display = 'flex';
        else el.style.display = 'none';
    });
};
