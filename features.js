/* THEME SYSTEM */
let currentTheme = localStorage.getItem('theme') || 'dark';
let editingKey = null;

window.toggleTheme = () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
    updateThemeIcon();
};

function applyTheme() {
    const root = document.documentElement;
    if (currentTheme === 'light') {
        root.style.setProperty('--bg', '#f5f5f5');
        root.style.setProperty('--panel', 'rgba(255,255,255,0.9)');
        root.style.setProperty('--border', '#ddd');
        document.body.style.color = '#333';
        document.body.style.background = '#f5f5f5';
        document.querySelectorAll('.card').forEach(c => {
            c.style.background = '#fff';
            c.style.color = '#333';
            c.style.borderColor = '#ddd';
        });
    } else {
        root.style.setProperty('--bg', '#020b02');
        root.style.setProperty('--panel', 'rgba(0,0,0,0.72)');
        root.style.setProperty('--border', '#103d2a');
        document.body.style.color = '#e0e0e0';
        document.body.style.background = '#020b02';
        document.querySelectorAll('.card').forEach(c => {
            c.style.background = '#111';
            c.style.color = '#e0e0e0';
            c.style.borderColor = 'rgba(255,255,255,.05)';
        });
    }
}

function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = currentTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function showSyncStatus(syncing = false) {
    const status = document.getElementById('sync-status');
    if (status) {
        if (syncing) {
            status.innerHTML = '<span class="sync-dot syncing"></span>SYNCING';
        } else {
            status.innerHTML = '<span class="sync-dot"></span>SYNCED';
        }
    }
}

/* EDIT SYSTEM */
window.openEditModal = (id) => {
    const item = allData.find(i => i.id === id);
    if (!item) return;
    editingKey = item.fbKey;
    document.getElementById('edit-name').value = item.name;
    document.getElementById('edit-id').value = item.id;
    document.getElementById('edit-desc').value = item.desc || '';
    document.getElementById('edit-status').value = item.status || 'working';
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeEditModal = () => {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.add('hidden');
    editingKey = null;
};

window.saveEdit = () => {
    if (!editingKey) return;
    const name = document.getElementById('edit-name').value.trim();
    const id = document.getElementById('edit-id').value.trim();
    const desc = document.getElementById('edit-desc').value.trim();
    const status = document.getElementById('edit-status').value;
    
    if (!name || !id) {
        alert('Name and ID are required');
        return;
    }
    
    showSyncStatus(true);
    
    const item = allData.find(i => i.fbKey === editingKey);
    set(ref(db, `gears/${editingKey}`), {
        name, id, desc,
        cat: item?.cat || 'gears',
        status, 
        time: Date.now()
    });
    
    setTimeout(() => {
        showSyncStatus(false);
        closeEditModal();
    }, 1000);
};

window.openEditFromModal = () => {
    closeModal();
    if (window.currentModalId) {
        openEditModal(window.currentModalId);
    }
};

window.toggleFavoriteFromModal = () => {
    if (window.currentModalId) {
        toggleFavorite(window.currentModalId);
    }
};

/* INIT ON LOAD */
document.addEventListener('DOMContentLoaded', () => {
    /* Inject theme toggle and sync status */
    const navRight = document.querySelector('.nav-right');
    if (navRight) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-toggle';
        themeBtn.onclick = toggleTheme;
        themeBtn.title = 'Toggle Dark/Light Mode';
        themeBtn.innerHTML = '<i class="fas fa-moon" id="theme-icon"></i>';
        navRight.insertBefore(themeBtn, navRight.firstChild);
        
        const syncStatus = document.createElement('div');
        syncStatus.id = 'sync-status';
        syncStatus.className = 'sync-status';
        syncStatus.innerHTML = '<span class="sync-dot"></span>SYNCED';
        navRight.insertBefore(syncStatus, navRight.firstChild.nextSibling);
    }
    
    /* Inject edit modal */
    const editModal = document.createElement('div');
    editModal.id = 'edit-modal';
    editModal.className = 'gear-modal hidden';
    editModal.innerHTML = `
        <div class="gear-modal-content" style="max-width:500px;">
            <button class="close-modal" onclick="closeEditModal()">×</button>
            <div class="modal-info" style="padding:40px;">
                <h2 style="margin-bottom:20px;color:var(--neon);">EDIT ITEM</h2>
                <input type="text" id="edit-name" placeholder="Item Name" style="width:100%;padding:12px;margin-bottom:10px;background:#050505;border:1px solid var(--border);color:white;border-radius:8px;font-family:inherit;box-sizing:border-box;">
                <input type="text" id="edit-id" placeholder="Roblox ID" style="width:100%;padding:12px;margin-bottom:10px;background:#050505;border:1px solid var(--border);color:white;border-radius:8px;font-family:inherit;box-sizing:border-box;">
                <textarea id="edit-desc" placeholder="Description" style="width:100%;padding:12px;margin-bottom:10px;background:#050505;border:1px solid var(--border);color:white;border-radius:8px;font-family:inherit;min-height:80px;resize:vertical;box-sizing:border-box;"></textarea>
                <select id="edit-status" style="width:100%;padding:12px;margin-bottom:10px;background:#050505;border:1px solid var(--border);color:white;border-radius:8px;font-family:inherit;box-sizing:border-box;">
                    <option value="working">WORKING</option>
                    <option value="patched">PATCHED</option>
                </select>
                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button class="btn-inject" onclick="saveEdit()" style="flex:1;">SAVE</button>
                    <button class="btn-inject" onclick="closeEditModal()" style="flex:1;background:#444;">CANCEL</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertBefore(editModal, document.body.firstChild);
    
    /* Add edit button to modal */
    setTimeout(() => {
        const modalButtons = document.querySelector('.modal-buttons');
        if (modalButtons) {
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn';
            editBtn.onclick = openEditFromModal;
            editBtn.textContent = '✏️ EDIT';
            modalButtons.appendChild(editBtn);
            
            const favBtn = document.getElementById('modal-fav-btn');
            if (favBtn) {
                favBtn.onclick = toggleFavoriteFromModal;
            }
        }
    }, 100);
    
    applyTheme();
    updateThemeIcon();
    showSyncStatus(false);
});
