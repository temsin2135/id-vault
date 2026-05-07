import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, set, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// YOUR SAVED CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCWggo_F5VQyVymH95DlsRQAgcDobutGww",
  authDomain: "id-vault-17981.firebaseapp.com",
  databaseURL: "https://id-vault-17981-default-rtdb.firebaseio.com/", 
  projectId: "id-vault-17981",
  storageBucket: "id-vault-17981.firebasestorage.app",
  messagingSenderId: "30816920890",
  appId: "1:30816920890:web:55c2d3c620d05eb9f85c03"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const vaultRef = ref(db, 'gears');

let allData = [];

// --- SYNC WITH CLOUD ---
onValue(vaultRef, (snapshot) => {
    const data = snapshot.val();
    const grid = document.getElementById('vault-grid');
    if (!data) {
        grid.innerHTML = "<p>DATABASE EMPTY. INJECT DATA TO START.</p>";
        allData = [];
        return;
    }
    allData = Object.entries(data).map(([key, value]) => ({...value, fbKey: key}));
    render(allData);
});

function render(items) {
    const grid = document.getElementById('vault-grid');
    grid.innerHTML = items.map((item) => `
        <div class="card">
            <button class="del-btn" onclick="deleteFromCloud('${item.fbKey}')">[PURGE]</button>
            <small style="color:var(--neon)">${item.cat.toUpperCase()}</small>
            <div style="font-size:1.2rem; margin:10px 0;">${item.name}</div>
            <div class="item-id" onclick="copyId('${item.id}', this)">${item.id}</div>
        </div>
    `).join('');
}

// --- CLOUD ACTIONS ---
window.addItem = function() {
    const name = document.getElementById('newName').value;
    const id = document.getElementById('newId').value;
    const cat = document.getElementById('newCat').value;
    if(name && id) {
        set(push(vaultRef), { name, id, cat, status: 'working' });
        document.getElementById('newName').value = '';
        document.getElementById('newId').value = '';
    }
};

window.deleteFromCloud = function(key) {
    if(confirm("PERMANENTLY PURGE FROM GLOBAL DATABASE?")) {
        remove(ref(db, 'gears/' + key));
    }
};

// --- MATRIX ENGINE (Performance Optimized) ---
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const drops = Array(Math.floor(canvas.width / 20)).fill(1);

function drawMatrix() {
    ctx.fillStyle = "rgba(2, 11, 2, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#004422";
    ctx.font = "15px monospace";
    drops.forEach((y, i) => {
        const text = Math.floor(Math.random() * 2);
        ctx.fillText(text, i * 20, y * 20);
        if (y * 20 > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    });
}
setInterval(drawMatrix, 50);

// --- SEARCH & UI ---
window.copyId = (id, el) => {
    navigator.clipboard.writeText(id);
    const old = el.innerText;
    el.innerText = "COPIED!";
    setTimeout(() => el.innerText = old, 1000);
};

window.search = () => {
    const q = document.getElementById('searchInput').value.toLowerCase();
    render(allData.filter(i => i.name.toLowerCase().includes(q) || i.id.includes(q)));
};

window.filterCat = (cat, btn) => {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(cat === 'all' ? allData : allData.filter(i => i.cat === cat));
};

setInterval(() => {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}, 1000);