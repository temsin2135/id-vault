let editingKey = null;

function showSyncStatus(syncing = false) {
    const status = document.getElementById('sync-status');
    if (!status) return;

    status.innerHTML = syncing
        ? '<span class="sync-dot syncing"></span>SYNCING'
        : '<span class="sync-dot"></span>SYNCED';
}

window.openEditModal = (id) => {
    if (!window.requireAdmin()) return;

    const item = window.allData.find(i => i.id === id);
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
    if (!window.requireAdmin()) return;
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

    const item = window.allData.find(i => i.fbKey === editingKey);
    window.set(window.ref(window.db, `gears/${editingKey}`), {
        name,
        id,
        desc,
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

document.addEventListener('DOMContentLoaded', () => {
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

    setTimeout(() => {
        const modalButtons = document.querySelector('.modal-buttons');
        if (modalButtons) {
            const editBtn = document.createElement('button');
            editBtn.className = 'edit-btn admin-only';
            editBtn.onclick = openEditFromModal;
            editBtn.textContent = '✏ EDIT';
            modalButtons.appendChild(editBtn);

            const favBtn = document.getElementById('modal-fav-btn');
            if (favBtn) {
                favBtn.onclick = toggleFavoriteFromModal;
            }
        }
    }, 100);
});
