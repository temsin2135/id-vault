// --- DATABASE ---
let vaultData = JSON.parse(localStorage.getItem('myVault')) || [
    { name: "Gravity Coil", id: "16688968", cat: "Gear", status: "working" },
    { name: "Classic Oof", id: "3060494212", cat: "Music", status: "working" }
];

// --- 1. LIVE CLOCK ---
function updateClock() {
    document.getElementById('clock').innerText = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000);

// --- 2. RENDER SYSTEM ---
function render(items = vaultData) {
    const vault = document.getElementById('vault');
    vault.innerHTML = items.map((item, index) => `
        <div class="card ${item.status}">
            <span class="item-cat">${item.cat}</span>
            <span class="item-name">${item.name}</span>
            <span class="item-id" onclick="copyIt('${item.id}', this)">${item.id}</span>
            <div class="card-actions">
                <button onclick="toggleStatus(${index})">TOGGLE_STATUS</button>
                <button class="del-btn" onclick="deleteItem(${index})">[X]</button>
            </div>
        </div>
    `).join('');
    updateCounters();
}

// --- 3. AUTO-COPY ---
function copyIt(id, element) {
    navigator.clipboard.writeText(id);
    const original = element.innerText;
    element.innerText = "COPIED!";
    setTimeout(() => element.innerText = original, 1000);
}

// --- 4. BACKUP SYSTEM ---
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vaultData));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "vault_backup.json");
    downloadAnchor.click();
}

// --- 5. ADD & DELETE ---
function addItem() {
    const name = document.getElementById('newName').value;
    const id = document.getElementById('newId').value;
    const cat = document.getElementById('newCat').value;
    if(name && id) {
        vaultData.push({ name, id, cat, status: 'working' });
        save();
    }
}

function deleteItem(index) {
    if(confirm("Purge this data?")) {
        vaultData.splice(index, 1);
        save();
    }
}

function toggleStatus(index) {
    vaultData[index].status = vaultData[index].status === 'working' ? 'patched' : 'working';
    save();
}

function save() {
    localStorage.setItem('myVault', JSON.stringify(vaultData));
    render();
}

function search() {
    const q = document.getElementById('searchBar').value.toLowerCase();
    render(vaultData.filter(i => i.name.toLowerCase().includes(q) || i.id.includes(q)));
}

function clearSearch() {
    document.getElementById('searchBar').value = '';
    render();
}

render();