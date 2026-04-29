import { db, appId } from './firebase-config.js';
import { collection, addDoc, onSnapshot, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { currentUserData } from './auth-logic.js';

export function startChatListener() {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'chat'), orderBy('timestamp', 'desc'), limit(100));
    
    onSnapshot(q, (snapshot) => {
        const msgs = [];
        snapshot.forEach(doc => msgs.push({ id: doc.id, ...doc.data() }));
        renderChat(msgs.reverse());
    });
}

function renderChat(messages) {
    const chatBox = document.getElementById('chatMessages');
    if (!chatBox) return;
    chatBox.innerHTML = messages.map(msg => {
        const isMe = msg.uid === currentUserData?.uid;
        return `
            <div class="flex ${isMe ? 'justify-start' : 'justify-end'} mb-4">
                <div class="max-w-[80%] p-3 rounded-xl shadow-sm ${isMe ? 'bg-[#00839b] text-white' : 'bg-white dark:bg-gray-700'}">
                    <p class="text-[10px] font-bold opacity-70">${window.escapeHTML(msg.senderName)}</p>
                    <p class="text-sm">${window.escapeHTML(msg.text)}</p>
                </div>
            </div>
        `;
    }).join('');
    chatBox.scrollTop = chatBox.scrollHeight;
}

document.getElementById('chatForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if(!text || !currentUserData) return;

    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'chat'), {
            text: text,
            uid: currentUserData.uid,
            senderName: currentUserData.name,
            timestamp: Date.now()
        });
        input.value = '';
    } catch(e) { console.error(e); }
});
