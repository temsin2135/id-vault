import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWggo_F5VQyVymH95DlsRQAgcDobutGww",
  authDomain: "id-vault-17981.firebaseapp.com",
  databaseURL: "https://id-vault-17981-default-rtdb.asia-southeast1.firebasedatabase.app/", 
  projectId: "id-vault-17981",
  storageBucket: "id-vault-17981.firebasestorage.app",
  messagingSenderId: "30816920890",
  appId: "1:30816920890:web:55c2d3c620d05eb9f85c03"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const vaultRef = ref(db, 'gears');
let allData = [];
let pendingDeleteKey = null;
let attempts = 0;
const MAX_ATTEMPTS = 5;

// --- PURGE SECURITY SYSTEM ---
window.requestPurge = function(key) {
    if (attempts >= MAX_ATTEMPTS) {
        alert("SYSTEM_LOCKED: MAXIMUM SECURITY FAILURES REACHED.");
        return;
    }
    pendingDeleteKey = key;
    document.getElementById('purge-auth-overlay').style.display = 'flex';
};

window.cancelPurge = function() {
    document.getElementById('purge-auth-overlay').style.display = 'none';
    document.getElementById('purgeCodeField').value = '';
    document.getElementById('purge-error').style.display = 'none';
    pendingDeleteKey = null;
};

document.getElementById('confirmPurgeBtn').onclick = function() {
    const code = document.getElementById('purgeCodeField').value;
    if (code === "2135") {
        remove(ref(db, 'gears/' + pendingDeleteKey));
        cancelPurge();
        attempts = 0; // Reset attempts on success
    } else {
        attempts++;
        const remaining = MAX_ATTEMPTS - attempts;
        const errorMsg = document.getElementById('purge-error');
        errorMsg.innerText = `INVALID_KEY. ${remaining} ATTEMPTS REMAINING.`;
        errorMsg.style.display = 'block';
        if (attempts >= MAX_ATTEMPTS) {
            document.getElementById('confirmPurgeBtn').disabled = true;
            document.getElementById('confirmPurgeBtn').innerText = "LOCKED";
            errorMsg.innerText = "CRITICAL_ERROR: SYSTEM_LOCKED.";
        }
    }
};

// --- REAL-TIME DATA SYNC ---
onValue(vaultRef, (snapshot) => {
    const data = snapshot.val();
    const grid = document.getElementById('vault-grid');
    if (!data) {
        grid.innerHTML = "<p>DATABASE_EMPTY_AWAITING_INJECTION...</p>";
        allData = []; return;
    }
    allData = Object.entries(data).map(([key, value]) => ({...value, fbKey: key}));
    render(allData);
});

function render(items) {
    const grid = document.getElementById('vault-grid');
    grid.innerHTML = items.map((item) => `
        <div class="card">
            <button onclick="requestPurge('${item.fbKey}')" style="float:right; color:red; background:none; border:none; cursor:pointer;">[PURGE]</button>
            <small style="color:var(--neon)">${item.cat.toUpperCase()}</small>
            <div style="font-size:1.3rem; margin:10px 0; color:var(--neon)">${item.name}</div>
            <div class="item-id" onclick="copyId('${item.id}', this)">${item.id}</div>
            <div class="item-desc">> ${item.desc || 'No usage data available.'}</div>
        </div>
    `).join('');
}

// --- CLOUD ACTIONS ---
window.addItem = function() {
    const name = document.getElementById('newName').value;
    const id = document.getElementById('newId').value;
    const desc = document.getElementById('newDesc').value;
    const cat = document.getElementById('newCat').value;

    if(name && id) {
        set(push(vaultRef), { name, id, desc, cat });
        document.getElementById('newName').value = '';
        document.getElementById('newId').value = '';
        document.getElementById('newDesc').value = '';
    }
};

// --- MATRIX ENGINE (Performance Optimized) ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth; canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width / 20)).fill(1);

function drawMatrix() {
    ctx.fillStyle = "rgba(2, 11, 2, 0.05)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#004422"; ctx.font = "15px monospace";
    drops.forEach((y, i) => {
        ctx.fillText(Math.floor(Math.random() * 2), i * 20, y * 20);
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}
setInterval(drawMatrix, 50);

// --- UI UTILITIES ---
window.copyId = (id, el) => {
    navigator.clipboard.writeText(id);
    const old = el.innerText; el.innerText = "COPIED_TO_CLIPBOARD!";
    setTimeout(() => el.innerText = old, 1500);
};

window.search = () => {
    const q = document.getElementById('searchInput').value.toLowerCase();
    render(allData.filter(i => i.name.toLowerCase().includes(q) || i.id.includes(q) || (i.desc && i.desc.toLowerCase().includes(q))));
};

window.filterCat = (cat, btn) => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(cat === 'all' ? allData : allData.filter(i => i.cat === cat));
};

setInterval(() => document.getElementById('clock').innerText = new Date().toLocaleTimeString(), 1000);