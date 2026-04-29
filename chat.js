// chat.js
import { db, appId, addDoc, doc, updateDoc, deleteDoc } from './firebase-config.js';

window.currentGroupId = 'global';
window.pendingChatFileData = null;
window.pendingChatFileType = null;
window.replyingToMsg = null;
window.selectedChatColor = 'bg-[#00839b]'; 

window.selectGroup = (groupId) => {
    window.currentGroupId = groupId;
    if(typeof window.updateReadReceipt === 'function') window.updateReadReceipt(groupId); 
    window.renderChatSidebarList();
    window.renderChat();
    if(window.innerWidth < 768) {
        document.getElementById('chatSubMenuMobile').classList.add('max-h-0', 'opacity-0');
    }
};

window.renderChatSidebarList = () => {
    const innerList = document.getElementById('innerChatSidebarList');
    const mobileList = document.getElementById('chatSubMenuMobile');
    if(innerList) innerList.innerHTML = '';
    if(mobileList) mobileList.innerHTML = '';
    
    window.globalGroups.forEach(g => {
        const isActive = window.currentGroupId === g.id && !document.getElementById('chat').classList.contains('hidden');
        
        let html = `
            <button onclick="window.selectGroup('${g.id}')" class="w-full text-right py-2 px-3 rounded-lg text-sm transition-colors flex items-center ${isActive ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white font-bold border border-gray-100 dark:border-gray-600' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}">
                <i class="fa-solid ${g.id === 'global' ? 'fa-globe' : 'fa-hashtag'} w-5 text-center mx-2 text-gray-400 ${isActive ? 'text-primary dark:text-secondary' : ''}"></i> 
                <span class="truncate flex-1">${window.escapeHTML(g.name)}</span>
            </button>
        `;
        if (innerList) innerList.innerHTML += html;
        if (mobileList) mobileList.innerHTML += html;
    });
};

window.renderChat = () => {
    const chatBox = document.getElementById('chatMessages');
    if(!chatBox) return;
    chatBox.innerHTML = '';
    
    const filteredChat = window.globalChat.filter(msg => (msg.groupId || 'global') === window.currentGroupId);
    
    if(filteredChat.length === 0) {
        chatBox.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm"><i class="fa-regular fa-comments text-4xl mb-3 text-gray-300 dark:text-gray-600"></i><p>لا توجد رسائل هنا. ابدأ المحادثة الآن!</p></div>';
        return;
    }

    const messagesToRender = filteredChat.slice(-100); 
    let htmlBuffer = '';

    messagesToRender.forEach(msg => {
        const isMe = msg.uid === window.currentUserData.uid;
        const alignClass = isMe ? 'justify-start' : 'justify-end';
        const msgBgClass = msg.color ? `${msg.color} text-white border-transparent` : (isMe ? 'bg-[#00839b] text-white border-transparent' : 'bg-white dark:bg-gray-800 border border-gray-200 text-gray-800 dark:text-gray-200');
        const radiusClass = isMe ? 'rtl:rounded-tl-xl rtl:rounded-tr-xl rtl:rounded-bl-xl ltr:rounded-tl-xl ltr:rounded-tr-xl ltr:rounded-br-xl' : 'rtl:rounded-tl-xl rtl:rounded-tr-xl rtl:rounded-br-xl ltr:rounded-tl-xl ltr:rounded-tr-xl ltr:rounded-bl-xl';
        const avatarUrl = msg.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName || 'مستخدم')}&background=00839b&color=fff`;

        let attachmentHtml = '';
        if(msg.fileData) {
            if(msg.fileType && msg.fileType.startsWith('image/')) {
                attachmentHtml = `<img src="${window.escapeHTML(msg.fileData)}" class="rounded-lg max-w-full h-auto max-h-48 cursor-pointer object-contain bg-black/5" onclick="window.openMedia('${window.escapeHTML(msg.fileData)}', '${msg.fileType}')">`;
            } else {
                attachmentHtml = `<a href="${window.escapeHTML(msg.fileData)}" download="مرفق" class="inline-flex items-center gap-2 bg-black/10 hover:bg-black/20 px-3 py-2 rounded transition text-sm text-inherit"><i class="fa-solid fa-download"></i> تحميل المرفق</a>`;
            }
        }

        const timeStr = new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});

        htmlBuffer += `
            <div id="msg-${msg.id}" class="chat-msg-item flex ${alignClass} mb-4 items-end gap-2 group w-full relative">
                ${!isMe ? `<img src="${window.escapeHTML(avatarUrl)}" class="w-8 h-8 rounded-full object-cover flex-shrink-0">` : ''}
                <div class="max-w-[85%] md:max-w-[70%] min-w-[150px] relative">
                    <div class="flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : ''}">
                        <span class="text-[10px] font-bold text-gray-500">${window.escapeHTML(msg.senderName || 'مجهول')}</span>
                    </div>
                    <div class="p-3 shadow-sm ${msgBgClass} ${radiusClass}">
                        ${attachmentHtml}
                        ${msg.text ? `<p class="text-sm md:text-base break-words whitespace-pre-wrap ${msg.fileData ? 'mt-2' : ''}">${window.escapeHTML(msg.text)}</p>` : ''}
                        <div class="text-[9px] mt-1 text-right opacity-70" dir="ltr">${timeStr}</div>
                    </div>
                </div>
                ${isMe ? `<img src="${window.escapeHTML(avatarUrl)}" class="w-8 h-8 rounded-full object-cover flex-shrink-0">` : ''}
            </div>
        `;
    });
    
    chatBox.innerHTML = htmlBuffer;
    chatBox.scrollTop = chatBox.scrollHeight;
};

window.handleChatAttachment = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    if(file.size > 500 * 1024) { window.showToast('حجم الملف كبير جداً! الحد الأقصى 500KB.', 'warning'); e.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
        window.pendingChatFileData = ev.target.result;
        window.pendingChatFileType = file.type || 'unknown';
        document.getElementById('attachmentFileName').innerText = window.escapeHTML(file.name);
        document.getElementById('chatAttachmentPreview').classList.remove('hidden');
        document.getElementById('chatInput').focus();
    };
    reader.readAsDataURL(file);
};

window.clearChatAttachment = () => {
    window.pendingChatFileData = null;
    window.pendingChatFileType = null;
    document.getElementById('chatFileInput').value = '';
    document.getElementById('chatAttachmentPreview').classList.add('hidden');
};
