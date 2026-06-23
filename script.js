import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getDatabase,
    ref,
    push,
    set,
    onValue,
    remove,
    query,
    limitToLast
}
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

/* FIREBASE */

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

window.db = db;
window.ref = ref;
window.set = set;

/* GLOBAL */

let allData = [];

window.allData = allData;

let currentFilter = 'all';

let favorites =
    JSON.parse(localStorage.getItem('favorites')) || [];

let isAdmin =
    localStorage.getItem('adminMode') === 'true';

let attempts = 0;

let lastMessageTime = 0;

const adminCode = '2135';

let decorTheme =
    localStorage.getItem('decorTheme') || 'matrix';

let brainrotVideo =
    localStorage.getItem('brainrotVideo') ||
    'https://www.youtube.com/embed?listType=search&list=Subway%20Surfers%20gameplay&mute=1&autoplay=1&controls=0&rel=0&modestbranding=1';

let brainrotEnabled =
    localStorage.getItem('brainrotEnabled') === 'true';

const brainrotPlaylist = [
    'https://www.youtube.com/embed?listType=search&list=Subway%20Surfers%20gameplay&mute=1&autoplay=1&controls=0&rel=0&modestbranding=1',
    'https://www.youtube.com/embed?listType=search&list=oddly%20satisfying%20loop&mute=1&autoplay=1&controls=0&rel=0&modestbranding=1',
    'https://www.youtube.com/embed?listType=search&list=brain%20rot%20edit&mute=1&autoplay=1&controls=0&rel=0&modestbranding=1'
];

const categoryLabels = {
    gears: 'GEARS',
    music: 'AUDIO',
    animations: 'ANIMATIONS',
    faces: 'FACES',
    hats: 'HATS',
    models: 'MODELS',
    decals: 'DECALS'
};

function cleanText(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function requireAdmin() {
    if (isAdmin) return true;
    alert('Admin mode required.');
    return false;
}

window.requireAdmin = requireAdmin;

function showToast(message = 'ID COPIED') {
    const toast =
        document.getElementById('toast');

    toast.innerText = message;
    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 1500);
}

function addTerminalLog(message, level = 'system') {
    const lines =
        document.getElementById('activityLogLines');

    if (!lines) return;

    const line =
        document.createElement('div');

    line.className = 'activity-line';
    line.innerHTML = `
        <span>${new Date().toLocaleTimeString()}</span>
        <strong>${cleanText(message)}</strong>
    `;

    if (level !== 'system') {
        line.classList.add(level);
    }

    lines.prepend(line);

    while (lines.children.length > 8) {
        lines.lastChild.remove();
    }
}

function getYoutubeEmbedUrl(rawUrl) {
    const value = String(rawUrl || '').trim();

    if (!value) return null;

    if (value.includes('/embed/')) {
        return value.includes('?')
            ? `${value}&mute=1`
            : `${value}?mute=1`;
    }

    const watchMatch =
        value.match(/[?&]v=([^&]+)/);

    const shortMatch =
        value.match(/youtu\.be\/([^?&]+)/);

    const id =
        watchMatch?.[1] || shortMatch?.[1];

    if (!id) return null;

    return `https://www.youtube.com/embed/${id}?mute=1`;
}

function applyDecorTheme(theme) {
    const selected = theme || 'matrix';

    document.body.dataset.theme = selected;
    localStorage.setItem('decorTheme', selected);

    const selector = document.getElementById('decorTheme');
    if (selector && selector.value !== selected) {
        selector.value = selected;
    }

    decorTheme = selected;
    addTerminalLog(`Theme set to ${selected.toUpperCase()}`);
}

function syncBrainrotPanel() {
    const panel = document.getElementById('brainrotPanel');
    const frame = document.getElementById('brainrotFrame');

    if (!panel || !frame) return;

    panel.classList.toggle('hidden', !brainrotEnabled);

    if (brainrotEnabled) {
        frame.src = brainrotVideo;
    } else {
        frame.src = '';
    }

    localStorage.setItem('brainrotEnabled', String(brainrotEnabled));
}

window.setDecorTheme = (theme) => {
    applyDecorTheme(theme);
};

window.toggleBrainrotMode = () => {
    brainrotEnabled = !brainrotEnabled;
    syncBrainrotPanel();
    addTerminalLog(
        brainrotEnabled
            ? 'Brainrot mode enabled'
            : 'Brainrot mode disabled'
    );
};

window.changeBrainrotVideo = () => {
    const next =
        brainrotPlaylist[
            Math.floor(Math.random() * brainrotPlaylist.length)
        ];

    brainrotVideo = next;
    localStorage.setItem('brainrotVideo', next);

    const frame = document.getElementById('brainrotFrame');
    if (frame && brainrotEnabled) {
        frame.src = next;
    }

    addTerminalLog('Brainrot panel cycled to a new feed');
};

/* CHAT */

window.sendChat = () => {

    const now = Date.now();

    if (now - lastMessageTime < 1500) {
        return alert("Slow down.");
    }

    const msg =
        document.getElementById('chatMsg')
        .value
        .trim();

    const nameField =
        document.getElementById('chatName');

    const name =
        (nameField.value.trim() || 'anonymous')
        .slice(0, 18);

    if (!msg) return;

    if (msg.length > 120) {
        return alert("Message too long.");
    }

    push(chatRef, {
        name: cleanText(name),
        msg: cleanText(msg),
        time: now
    });

    lastMessageTime = now;

    localStorage.setItem('chatName', name);

    document.getElementById('chatMsg').value = '';
    addTerminalLog(`Chat sent by ${name}`);
};

onValue(query(chatRef, limitToLast(50)), (snap) => {

    const box =
        document.getElementById('chat-box');

    const data = snap.val();

    const today =
        new Date().toDateString();

    box.innerHTML = data
        ? Object.values(data)
            .filter(m =>
                new Date(m.time)
                .toDateString() === today
            )
            .map(m => `
                <div class="chat-msg">
                    <div class="chat-meta">
                        <strong>${cleanText(m.name || 'anonymous')}</strong>
                        <small>
                            ${new Date(m.time)
                                .toLocaleTimeString()}
                        </small>
                    </div>
                    <div>${m.msg}</div>
                </div>
            `).join('')
        : '';

    box.scrollTop = box.scrollHeight;
});

/* LOAD ITEMS */

onValue(vaultRef, (snap) => {

    const data = snap.val();

    allData = data
        ? Object.entries(data)
            .map(([k, v]) => ({
                ...v,
                fbKey: k
            }))
        : [];

    window.allData = allData;

    updateStats();

    renderFiltered();
    renderFavorites();
});

/* RENDER */

function renderCard(item) {
    const safeId = cleanText(item.id);
    const safeKey = cleanText(item.fbKey);
    const status = item.status || 'working';
    const category = item.cat || 'unknown';
    const iconClass = category === 'music'
        ? 'fa-music'
        : category === 'animations'
            ? 'fa-person-running'
            : category === 'faces'
                ? 'fa-face-smile'
                : category === 'hats'
                    ? 'fa-hat-wizard'
                    : category === 'decals'
                        ? 'fa-image'
                        : 'fa-cube';

    const adminTools = isAdmin ? `
        <button
            class="purge-btn"
            title="Purge gear"
            onclick="requestPurge('${safeKey}')"
        >
            <i class="fas fa-trash"></i>
            PURGE
        </button>
    ` : '';

    return `
        <div class="card">
            <div class="card-top">
                <div class="gear-icon">
                    <i class="fas ${iconClass}"></i>
                </div>

                <div
                    class="status-tag ${status}"
                    onclick="toggleStatus('${safeKey}', '${status}')"
                    title="Admin: toggle status"
                >
                    ${status.toUpperCase()}
                </div>
            </div>

            <div class="card-title">
                ${cleanText(item.name)}
            </div>

            <div class="item-id">
                ${safeId}
            </div>

            <div class="item-desc">
                ${cleanText(item.desc || 'No description')}
            </div>

            <div class="card-category">
                ${categoryLabels[category] || cleanText(category)}
            </div>

            <div class="item-metrics">
                <span><i class="fas fa-copy"></i> ${item.copies || 0}</span>
                <span><i class="fas fa-flag"></i> ${item.reports || 0}</span>
            </div>

            <div class="card-actions">
                <button
                    class="action-btn"
                    onclick="copyId('${safeId}', '${safeKey}')"
                >
                    <i class="fas fa-copy"></i>
                    ID
                </button>

                <button
                    class="action-btn"
                    onclick="copyCommand('${safeId}', '${safeKey}')"
                >
                    <i class="fas fa-terminal"></i>
                    CMD
                </button>

                <button
                    class="action-btn"
                    onclick="openAsset('${safeId}')"
                >
                    <i class="fas fa-arrow-up-right-from-square"></i>
                    OPEN
                </button>

                <button
                    class="fav-btn"
                    onclick="toggleFavorite('${safeId}')"
                    title="Favorite"
                >
                    <i class="${favorites.includes(item.id) ? 'fas' : 'far'} fa-star"></i>
                </button>

                <button
                    class="report-btn"
                    onclick="reportItem('${safeKey}')"
                    title="Report broken item"
                >
                    <i class="fas fa-flag"></i>
                </button>

                ${adminTools}
            </div>
        </div>
    `;
}

function render(items) {

    const grid =
        document.getElementById('vault-grid');

    const empty =
        document.getElementById('empty-state');

    if (!items.length) {

        grid.innerHTML = '';

        if (empty)
            empty.style.display = 'block';

        return;
    }

    if (empty)
        empty.style.display = 'none';

    grid.innerHTML = items.map(renderCard).join('');
}

/* FILTER BUTTONS */

window.filterCat = (cat, btn) => {

    currentFilter = cat;

    document
        .querySelectorAll('.cat-btn')
        .forEach(b =>
            b.classList.remove('active')
        );

    btn.classList.add('active');

    renderFiltered();
    addTerminalLog(`Filter set to ${cat.toUpperCase()}`);
};

/* SORT */

window.sortItems = () => {
    renderFiltered();
    addTerminalLog(`Sort changed to ${document.getElementById('sortSelect').value}`);
};

/* FAVORITES */

window.toggleFavorite = (id) => {

    if (favorites.includes(id)) {

        favorites =
            favorites.filter(f => f !== id);

    } else {

        favorites.push(id);
    }

    localStorage.setItem(
        'favorites',
        JSON.stringify(favorites)
    );

    updateFavoriteCounter();

    renderFiltered();

    renderFavorites();
    addTerminalLog(
        favorites.includes(id)
            ? `Saved ${id} to favorites`
            : `Removed ${id} from favorites`
    );
};

function updateFavoriteCounter() {

    document.getElementById(
        'favorite-count'
    ).innerText = favorites.length;
}

function renderFavorites() {

    const grid =
        document.getElementById(
            'favorites-grid'
        );

    const empty =
        document.getElementById(
            'empty-favorites'
        );

    const favItems =
        allData.filter(i =>
            favorites.includes(i.id)
        );

    if (!favItems.length) {

        empty.style.display = 'block';

        grid.innerHTML = '';

        return;
    }

    empty.style.display = 'none';

    grid.innerHTML = favItems.map(renderCard).join('');
}

/* SEARCH & FILTER */

window.handleSearch = () => {
    renderFiltered();
};

window.renderFiltered = () => {
    const searchTerm =
        document.getElementById('searchInput')
            .value
            .toLowerCase();

    const sortValue =
        document.getElementById('sortSelect')
            .value;

    let filtered = allData.filter(item => {
        const matchesSearch =
            String(item.name || '').toLowerCase().includes(searchTerm) ||
            String(item.id || '').includes(searchTerm) ||
            String(item.desc || '').toLowerCase().includes(searchTerm);

        const matchesCategory =
            currentFilter === 'all' ||
            item.cat === currentFilter;

        return matchesSearch && matchesCategory;
    });

    if (sortValue === 'alpha') {
        filtered.sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''))
        );
    } else if (sortValue === 'popular') {
        filtered.sort((a, b) =>
            Number(b.copies || 0) - Number(a.copies || 0)
        );
    } else if (sortValue === 'reported') {
        filtered.sort((a, b) =>
            Number(b.reports || 0) - Number(a.reports || 0)
        );
    } else {
        filtered.sort((a, b) =>
            Number(b.time || 0) - Number(a.time || 0)
        );
    }

    render(filtered);
};

/* NAVIGATION */

window.showSection = (section) => {

    document.getElementById('vault-view')
        .style.display =
        section === 'vault'
        ? 'block'
        : 'none';

    document.getElementById('favorites-view')
        .style.display =
        section === 'favorites'
        ? 'block'
        : 'none';

    document
        .querySelectorAll('.nav-btn')
        .forEach(b =>
            b.classList.remove('active-nav')
        );

    if (section === 'favorites') {

        document
            .querySelectorAll('.nav-btn')[1]
            .classList.add('active-nav');

        renderFavorites();
        addTerminalLog('Opened favorites view');

    } else {

        document
            .querySelectorAll('.nav-btn')[0]
            .classList.add('active-nav');
        addTerminalLog('Opened vault view');
    }
};

/* MODAL */

window.openModal = (fbKey) => {

    const item =
        allData.find(i =>
            i.fbKey === fbKey
        );

    if (!item) return;

    document.getElementById('modal-image')
        .src =
        `https://assetgame.roblox.com/Thumbs/Asset.ashx?width=420&height=420&assetId=${item.id}`;

    document.getElementById('modal-title')
        .innerText = item.name;

    document.getElementById('modal-id')
        .innerText = `ID: ${item.id}`;

    document.getElementById('modal-category')
        .innerText = `CATEGORY: ${item.cat}`;

    document.getElementById('modal-status')
        .innerText =
        `STATUS: ${item.status}`;

    document.getElementById('modal-desc')
        .innerText =
        item.desc || 'No description';

    window.currentModalId = item.id;
    window.currentModalFbKey = item.fbKey;

    document.getElementById('gear-modal')
        .classList.remove('hidden');
};

window.closeModal = () => {

    document.getElementById('gear-modal')
        .classList.add('hidden');
};

window.modalCopy = () => {

    if (window.currentModalId) {
        copyId(window.currentModalId, window.currentModalFbKey);
    }
};

/* RANDOM */

window.randomGear = () => {

    if (!allData.length) return;

    const random =
        allData[
            Math.floor(
                Math.random() * allData.length
            )
        ];

    openModal(random.fbKey);
    addTerminalLog(`Random item opened: ${random.name || random.id}`);
};

/* STATS */

function updateStats() {

    document.getElementById(
        'total-items'
    ).innerText = allData.length;

    document.getElementById(
        'gear-count'
    ).innerText =
        allData.filter(i =>
            i.cat === 'gears'
        ).length;

    document.getElementById(
        'audio-count'
    ).innerText =
        allData.filter(i =>
            i.cat === 'music'
        ).length;

    document.getElementById(
        'copy-count'
    ).innerText =
        allData.reduce((sum, i) =>
            sum + Number(i.copies || 0), 0
        );

    document.getElementById(
        'report-count'
    ).innerText =
        allData.reduce((sum, i) =>
            sum + Number(i.reports || 0), 0
        );
}

/* ACTIONS */

window.addItem = () => {

    if (!requireAdmin()) return;

    const name =
        document.getElementById('newName')
        .value
        .trim();

    const id =
        document.getElementById('newId')
        .value
        .trim();

    const desc =
        document.getElementById('newDesc')
        .value
        .trim();

    const cat =
        document.getElementById('newCat')
        .value;

    if (!name || !id) {
        return alert("Missing fields.");
    }

    set(push(vaultRef), {
        name,
        id,
        desc,
        cat,
        status: 'working',
        time: Date.now()
    });

    document.getElementById('newName').value = '';
    document.getElementById('newId').value = '';
    document.getElementById('newDesc').value = '';
    addTerminalLog(`Injected new item: ${name}`);
};

window.toggleStatus = (k, s) => {

    if (!requireAdmin()) return;

    set(
        ref(db, `gears/${k}/status`),
        s === 'patched'
            ? 'working'
            : 'patched'
    );
    addTerminalLog(`Status flipped for ${k}`);
};

window.requestPurge = (k) => {

    if (!requireAdmin()) return;

    if (attempts >= 5) {
        return alert("LOCKED");
    }

    window.pendingKey = k;

    document.getElementById(
        'purge-auth-overlay'
    ).style.display = 'flex';
};

document.getElementById(
    'confirmPurgeBtn'
).onclick = () => {

    if (
        document.getElementById(
            'purgeCodeField'
        ).value === "2135"
    ) {

        remove(
            ref(
                db,
                'gears/' + window.pendingKey
            )
        );

        cancelPurge();

        attempts = 0;
        addTerminalLog(`Purged ${window.pendingKey}`);

    } else {

        attempts++;

        alert(
            `FAILED. ${5 - attempts} REMAIN.`
        );
        addTerminalLog(`Purge code failed for ${window.pendingKey}`, 'warning');
    }
};

window.cancelPurge = () => {

    document.getElementById(
        'purge-auth-overlay'
    ).style.display = 'none';
};

/* COPY */

function bumpItemCount(fbKey, field) {
    const item =
        allData.find(i => i.fbKey === fbKey);

    if (!item) return;

    set(
        ref(db, `gears/${fbKey}/${field}`),
        Number(item[field] || 0) + 1
    );
}

window.copyId = (id, fbKey = null) => {

    navigator.clipboard.writeText(id);

    if (fbKey) {
        bumpItemCount(fbKey, 'copies');
    }

    showToast('ID COPIED');
    addTerminalLog(`Copied ID ${id}`);
};

window.copyCommand = (id, fbKey = null) => {

    const command =
        `game:GetService("InsertService"):LoadAsset(${id}).Parent = workspace`;

    navigator.clipboard.writeText(command);

    if (fbKey) {
        bumpItemCount(fbKey, 'copies');
    }

    showToast('COMMAND COPIED');
    addTerminalLog(`Copied command for ${id}`);
};

window.reportItem = (fbKey) => {

    const item =
        allData.find(i => i.fbKey === fbKey);

    if (!item) return;

    const reason =
        prompt(
            'Report this item as broken, patched, wrong ID, or bad description:',
            'broken'
        );

    if (!reason) return;

    set(
        ref(db, `gears/${fbKey}/reports`),
        Number(item.reports || 0) + 1
    );

    set(
        ref(db, `gears/${fbKey}/lastReport`),
        cleanText(reason).slice(0, 80)
    );

    showToast('REPORT SENT');
    addTerminalLog(`Reported ${item.name || item.id}`);
};

/* EXPORT */

window.exportJSON = () => {

    const blob = new Blob(
        [JSON.stringify(allData, null, 2)],
        { type: 'application/json' }
    );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement('a');

    a.href = url;

    a.download = 'vault-backup.json';

    a.click();

    URL.revokeObjectURL(url);
    addTerminalLog('Exported JSON backup');
};

window.importJSON = (event) => {

    if (!requireAdmin()) {
        event.target.value = '';
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const parsed = JSON.parse(reader.result);
            const items = Array.isArray(parsed)
                ? parsed
                : Object.values(parsed);

            if (!items.length) {
                alert('No items found in that backup.');
                return;
            }

            items.forEach(item => {
                if (!item.name || !item.id) return;

                set(push(vaultRef), {
                    name: String(item.name).trim(),
                    id: String(item.id).trim(),
                    desc: String(item.desc || '').trim(),
                    cat: item.cat || 'gears',
                    status: item.status || 'working',
                    copies: Number(item.copies || 0),
                    reports: Number(item.reports || 0),
                    time: item.time || Date.now()
                });
            });

            showToast('IMPORT COMPLETE');
            addTerminalLog(`Imported ${items.length} items from JSON`);
        } catch (err) {
            alert('Import failed. Make sure it is a valid JSON backup.');
            addTerminalLog('JSON import failed', 'warning');
        }

        event.target.value = '';
    };

    reader.readAsText(file);
};

window.toggleAdminMode = () => {

    if (isAdmin) {
        isAdmin = false;
        localStorage.setItem('adminMode', 'false');
        updateAdminUI();
        renderFiltered();
        renderFavorites();
        addTerminalLog('Admin mode disabled');
        return;
    }

    const code =
        prompt('Enter admin code:');

    if (code !== adminCode) {
        alert('Wrong admin code.');
        return;
    }

    isAdmin = true;
    localStorage.setItem('adminMode', 'true');
    updateAdminUI();
    renderFiltered();
    renderFavorites();
    addTerminalLog('Admin mode enabled');
};

function updateAdminUI() {
    document.body.classList.toggle('admin-mode', isAdmin);

    const btn =
        document.getElementById('adminToggleBtn');

    if (!btn) return;

    btn.innerHTML = isAdmin
        ? '<i class="fas fa-unlock"></i> ADMIN_ON'
        : '<i class="fas fa-lock"></i> ADMIN';
}

window.toggleChatCollapse = () => {
    const chat =
        document.querySelector('.chat-section');

    if (chat) {
        chat.classList.toggle('chat-collapsed');
    }
};

/* CTRL+K */

window.addEventListener('keydown', (e) => {

    if (e.ctrlKey && e.key === 'k') {

        e.preventDefault();

        document.getElementById(
            'searchInput'
        ).focus();
    }

    if (e.key === 'Escape') {

        closeModal();
    }
});

/* MATRIX */

const canvas =
    document.getElementById(
        'matrix-canvas'
    );

const ctx =
    canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const drops =
    Array(
        Math.floor(canvas.width / 20)
    ).fill(1);

setInterval(() => {

    ctx.fillStyle =
        "rgba(2,11,2,0.05)";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#004422";

    drops.forEach((y, i) => {

        ctx.fillText(
            Math.floor(Math.random() * 2),
            i * 20,
            y * 20
        );

        if (
            y * 20 > canvas.height
            &&
            Math.random() > 0.975
        ) {
            drops[i] = 0;
        }

        drops[i]++;
    });

}, 50);

/* CLOCK */

setInterval(() => {

    document.getElementById('clock')
        .innerText =
        new Date().toLocaleTimeString();

}, 1000);

/* INIT */
window.openAsset = (id) => {

    window.open(
        `https://www.roblox.com/catalog/${id}`,
        '_blank'
    );
};
applyDecorTheme(decorTheme);
syncBrainrotPanel();
updateFavoriteCounter();
renderFavorites();
updateAdminUI();
addTerminalLog('System boot complete');

const savedChatName =
    localStorage.getItem('chatName');

if (savedChatName) {
    const chatName =
        document.getElementById('chatName');

    if (chatName) {
        chatName.value = savedChatName;
    }
}
