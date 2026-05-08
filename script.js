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

/* GLOBAL */

let allData = [];

let currentFilter = 'all';

let favorites =
    JSON.parse(localStorage.getItem('favorites')) || [];

let attempts = 0;

let lastMessageTime = 0;

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

    if (!msg) return;

    if (msg.length > 120) {
        return alert("Message too long.");
    }

    push(chatRef, {
        msg: msg
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;"),
        time: now
    });

    lastMessageTime = now;

    document.getElementById('chatMsg').value = '';
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
                    <small>
                        [${new Date(m.time)
                            .toLocaleTimeString()}]
                    </small>
                    ${m.msg}
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

    updateStats();

    renderFiltered();
});

/* RENDER */

function render(items) {

    const grid =
        document.getElementById('vault-grid');

    const empty =
        document.getElementById('empty-state');

    if (!items.length) {

        grid.innerHTML = '';

        empty.style.display = 'block';

        return;
    }

    empty.style.display = 'none';

    grid.innerHTML = items.map(item => `

        <div class="card"
            onclick="openModal('${item.fbKey}')">

            <img
                class="asset-preview"
                loading="lazy"

                src="https://assetgame.roblox.com/Thumbs/Asset.ashx?width=420&height=420&assetId=${item.id}"

                onerror="
                    this.src='https://via.placeholder.com/420x420?text=NO+IMAGE'
                "
            >

            <div
                onclick="
                    event.stopPropagation();
                    toggleStatus(
                        '${item.fbKey}',
                        '${item.status}'
                    )
                "

                class="status-tag ${item.status || 'working'}"
            >
                ${(item.status || 'working').toUpperCase()}
            </div>

            <div class="card-title">
                ${item.name}
            </div>

            <div
                class="item-id"

                onclick="
                    event.stopPropagation();
                    copyId('${item.id}')
                "
            >
                ${item.id}
            </div>

            <div class="item-desc">
                ${item.desc || ''}
            </div>

            <div class="card-actions">

                <button
                    class="fav-btn"

                    onclick="
                        event.stopPropagation();
                        toggleFavorite('${item.id}')
                    "
                >
                    <i class="
                        ${favorites.includes(item.id)
                            ? 'fas'
                            : 'far'}
                        fa-star
                    "></i>
                </button>

                <button
                    class="purge-btn"

                    onclick="
                        event.stopPropagation();
                        requestPurge('${item.fbKey}')
                    "
                >
                    PURGE
                </button>

            </div>

        </div>

    `).join('');
}

/* FILTER */

function renderFiltered() {

    let filtered = [...allData];

    if (currentFilter !== 'all') {

        filtered = filtered.filter(
            i => i.cat === currentFilter
        );
    }

    const q =
        document.getElementById('searchInput')
        ?.value
        ?.toLowerCase() || '';

    if (q) {

        filtered = filtered.filter(i =>
            i.name.toLowerCase().includes(q)
            ||
            i.id.includes(q)
            ||
            (i.desc || '')
                .toLowerCase()
                .includes(q)
        );
    }

    const sort =
        document.getElementById('sortSelect')
        ?.value;

    if (sort === 'alpha') {

        filtered.sort((a, b) =>
            a.name.localeCompare(b.name)
        );

    } else {

        filtered.sort((a, b) =>
            (b.time || 0)
            -
            (a.time || 0)
        );
    }

    render(filtered);
}

/* SEARCH */

window.handleSearch = () => {

    const q =
        document.getElementById('searchInput')
        .value
        .toLowerCase();

    const box =
        document.getElementById('search-suggestions');

    if (!q) {

        box.innerHTML = '';

        return renderFiltered();
    }

    const suggestions = allData
        .filter(i =>
            i.name.toLowerCase().includes(q)
        )
        .slice(0, 5);

    box.innerHTML = suggestions.map(s => `
        <div
            class="suggestion-item"
            onclick="quickSearch('${s.name}')"
        >
            ${s.name}
        </div>
    `).join('');

    renderFiltered();
};

window.quickSearch = (name) => {

    document.getElementById('searchInput')
        .value = name;

    document.getElementById('search-suggestions')
        .innerHTML = '';

    renderFiltered();
};

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
};

/* SORT */

window.sortItems = () => {
    renderFiltered();
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

    grid.innerHTML = favItems.map(item => `
        <div class="card">

            <img
                class="asset-preview"

                src="https://assetgame.roblox.com/Thumbs/Asset.ashx?width=420&height=420&assetId=${item.id}"
            >

            <div class="card-title">
                ${item.name}
            </div>

            <div class="item-id">
                ${item.id}
            </div>

        </div>
    `).join('');
}

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

    } else {

        document
            .querySelectorAll('.nav-btn')[0]
            .classList.add('active-nav');
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

    document.getElementById('gear-modal')
        .classList.remove('hidden');
};

window.closeModal = () => {

    document.getElementById('gear-modal')
        .classList.add('hidden');
};

window.modalCopy = () => {

    if (window.currentModalId) {
        copyId(window.currentModalId);
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
}

/* ACTIONS */

window.addItem = () => {

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
};

window.toggleStatus = (k, s) => {

    set(
        ref(db, `gears/${k}/status`),
        s === 'patched'
            ? 'working'
            : 'patched'
    );
};

window.requestPurge = (k) => {

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

    } else {

        attempts++;

        alert(
            `FAILED. ${5 - attempts} REMAIN.`
        );
    }
};

window.cancelPurge = () => {

    document.getElementById(
        'purge-auth-overlay'
    ).style.display = 'none';
};

/* COPY */

window.copyId = (id) => {

    navigator.clipboard.writeText(id);

    const toast =
        document.getElementById('toast');

    toast.style.display = 'block';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 1500);
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

updateFavoriteCounter();
renderFavorites();