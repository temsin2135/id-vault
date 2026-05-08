import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove, query, limitToLast } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWggo_F5VQyVymH95DlsRQAgcDobutGww",
  authDomain: "id-vault-17981.firebaseapp.com",
  databaseURL: "https://id-vault-17981-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  projectId: "id-vault-17981",
  storageBucket: "id-vault-17981.firebasestorage.app",
  appId: "1:30816920890:web:55c2d3c620d05eb9f85c03"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const vaultRef = ref(db, 'gears');
const chatRef = ref(db, 'chat');

// --- CHAT SYSTEM ---
window.sendChat = () => {
    const msg = document.getElementById('chatMsg').value;
    if(msg) {
        push(chatRef, { msg: msg, time: Date.now() });
        document.getElementById('chatMsg').value = '';
    }
};

onValue(query(chatRef, limitToLast(50)), (snap) => {
    const box = document.getElementById('chat-box');
    const data = snap.val();
    const today = new Date().toDateString();
    box.innerHTML = data ? Object.values(data).filter(m => new Date(m.time).toDateString() === today).map(m => `
        <div class="chat-msg"><small>[${new Date(m.time).toLocaleTimeString()}]</small> ${m.msg}</div>
    `).join('') : '';
    box.scrollTop = box.scrollHeight;
});

// --- GEAR SYSTEM ---
onValue(vaultRef, (snap) => {
    const data = snap.val();
    const items = data ? Object.entries(data).map(([k, v]) => ({...v, fbKey: k})) : [];
    render(items);
});

function render(items) {
    document.getElementById('vault-grid').innerHTML = items.map(item => `
        <div class="card">
            <img class="asset-preview" src="https://www.roblox.com/asset-thumbnail/image?assetId=${item.id}&width=420&height=420&format=png">
            <div onclick="toggleStatus('${item.fbKey}', '${item.status}')" class="status-tag ${item.status || 'working'}">${(item.status || 'working').toUpperCase()}</div>
            <div style="margin:10px 0;">${item.name}</div>
            <div class="item-id" onclick="copyId('${item.id}', this)">${item.id}</div>
            <div class="item-desc">${item.desc || ''}</div>
            <button onclick="requestPurge('${item.fbKey}')" style="color:red; background:none; border:none; cursor:pointer; font-size:0.7rem;">[PURGE]</button>
        </div>
    `).join('');
}

// --- SECURITY & ACTIONS ---
let attempts = 0;
window.requestPurge = (k) => { 
    if(attempts >= 5) return alert("LOCKED");
    window.pendingKey = k; 
    document.getElementById('purge-auth-overlay').style.display='flex'; 
};

document.getElementById('confirmPurgeBtn').onclick = () => {
    if(document.getElementById('purgeCodeField').value === "2135") {
        remove(ref(db, 'gears/'+window.pendingKey));
        cancelPurge(); attempts = 0;
    } else {
        attempts++; alert(`FAILED. ${5-attempts} REMAIN.`);
    }
};

window.addItem = () => {
    const name = document.getElementById('newName').value;
    const id = document.getElementById('newId').value;
    const desc = document.getElementById('newDesc').value;
    if(name && id) set(push(vaultRef), { name, id, desc, cat: document.getElementById('newCat').value, status: 'working' });
};

window.toggleStatus = (k, s) => set(ref(db, `gears/${k}/status`), s === 'patched' ? 'working' : 'patched');
window.cancelPurge = () => document.getElementById('purge-auth-overlay').style.display='none';
window.copyId = (id, el) => { navigator.clipboard.writeText(id); el.innerText="COPIED!"; setTimeout(()=>el.innerText=id, 1000); };
window.exportJSON = () => { window.open("data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData))); };

// --- MATRIX RAIN ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width / 20)).fill(1);
setInterval(() => {
    ctx.fillStyle = "rgba(2, 11, 2, 0.05)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#004422"; drops.forEach((y, i) => {
        ctx.fillText(Math.floor(Math.random()*2), i*20, y*20);
        if(y*20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}, 50);

setInterval(() => document.getElementById('clock').innerText = new Date().toLocaleTimeString(), 1000);