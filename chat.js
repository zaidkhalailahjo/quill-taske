// js/chat.js
import { db, appId } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { AppState } from './auth.js';
import { showToast } from './ui.js';

let globalChat = [];
let currentGroupId = 'global';

// استماع لرسائل الدردشة
export function startChatListener() {
    const chatRef = collection(db, 'artifacts', appId, 'public', 'data', 'chat');
    // جلب آخر 150 رسالة لتجنب تحميل المتصفح
    const q = query(chatRef, orderBy('timestamp', 'desc'), limit(150));
    
    onSnapshot(q, (snapshot) => {
        globalChat = [];
        snapshot.forEach(doc => {
            globalChat.push({ id: doc.id, ...doc.data() });
        });
        globalChat.sort((a, b) => a.timestamp - b.timestamp); // إعادة الترتيب تصاعدياً للعرض
        renderChat();
    }, (error) => console.error("Error fetching chat:", error));
}

// تغيير المجموعة
window.selectGroup = (groupId) => {
    currentGroupId = groupId;
    renderChat();
    // إخفاء القائمة في الجوال إذا كانت مفتوحة
    if(window.innerWidth < 768) {
        document.getElementById('chatSubMenuMobile')?.classList.add('max-h-0', 'opacity-0');
    }
};

// عرض الدردشة في الواجهة
export function renderChat() {
    const chatBox = document.getElementById('chatMessages');
    if(!chatBox) return;
    chatBox.innerHTML = '';
    
    const filteredChat = globalChat.filter(msg => (msg.groupId || 'global') === currentGroupId);
    
    if(filteredChat.length === 0) {
        chatBox.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-gray-400 text-sm"><i class="fa-regular fa-comments text-4xl mb-3"></i><p>لا توجد رسائل هنا. ابدأ المحادثة الآن!</p></div>';
        return;
    }

    filteredChat.forEach(msg => {
        const isMe = msg.uid === AppState.currentUserData?.uid;
        const alignClass = isMe ? 'justify-start' : 'justify-end';
        const msgBgClass = isMe ? 'bg-primary text-white' : 'bg-white border text-gray-800';
        const radiusClass = isMe ? 'rounded-tl-xl rounded-tr-xl rounded-bl-xl' : 'rounded-tl-xl rounded-tr-xl rounded-br-xl';
        const timeStr = new Date(msg.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'});
        
        chatBox.innerHTML += `
            <div class="flex ${alignClass} mb-4 items-end gap-2 w-full">
                <div class="max-w-[85%] relative">
                    <div class="flex items-center gap-2 mb-1 px-1 ${isMe ? 'flex-row-reverse' : ''}">
                        <span class="text-[10px] font-bold text-gray-500">${escapeHTML(msg.senderName || 'مجهول')}</span>
                    </div>
                    <div class="p-3 shadow-sm ${msgBgClass} ${radiusClass}">
                        ${msg.text ? `<p class="text-sm md:text-base break-words whitespace-pre-wrap">${escapeHTML(msg.text)}</p>` : ''}
                        <div class="text-[9px] mt-1 text-right opacity-70" dir="ltr">${timeStr}</div>
                    </div>
                </div>
            </div>
        `;
    });
    // تمرير لأسفل عند وصول رسالة جديدة
    chatBox.scrollTop = chatBox.scrollHeight;
}

// إرسال رسالة جديدة
document.getElementById('chatForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text || !AppState.currentUserData) return;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        input.value = '';
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chat'), {
            text: text, 
            uid: AppState.currentUserData.uid, 
            senderName: AppState.currentUserData.name,
            groupId: currentGroupId, 
            timestamp: Date.now()
        });
    } catch(err) { 
        console.error(err); 
        showToast('فشل الإرسال', 'error'); 
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        input.focus();
    }
});

// أداة حماية النصوص
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag]));
}
