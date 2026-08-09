document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  let existingLogo = null; // current saved logo URL (or null) for the brand being edited
  let deleteTargetId = null;

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  // ---------- Session check ----------
  try {
    const res = await fetch(`${ADMIN_API_BASE}/auth/me`, {
      headers: authHeaders(),
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('Session expired');

    document.getElementById('adminName').textContent = data.admin.name;
    document.getElementById('adminRole').textContent = data.admin.role;
    document.getElementById('adminAvatar').textContent = data.admin.name.charAt(0).toUpperCase();
  } catch (err) {
    localStorage.removeItem('ajc_admin_token');
    localStorage.removeItem('ajc_admin_info');
    window.location.href = 'admin-login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetch(`${ADMIN_API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {}
    localStorage.removeItem('ajc_admin_token');
    localStorage.removeItem('ajc_admin_info');
    window.location.href = 'admin-login.html';
  });

  document.querySelectorAll('.admin-nav-item.soon-item').forEach((item) => {
    item.addEventListener('click', () => alert('This section will be built in an upcoming step.'));
  });

  // ---------- Elements ----------
  const tbody = document.getElementById('brandsTbody');
  const msgBox = document.getElementById('brandsMsg');

  const modalOverlay = document.getElementById('brandModalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const brandForm = document.getElementById('brandForm');
  const formError = document.getElementById('formError');
  const imagePreviewStrip = document.getElementById('imagePreviewStrip');

  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteBrandName = document.getElementById('deleteBrandName');

  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.className = 'products-msg show' + (isError ? ' error' : '');
    if (text) setTimeout(() => { msgBox.className = 'products-msg'; }, 3500);
  };

  // ---------- Load brands ----------
  const loadBrands = async () => {
    tbody.innerHTML = '<tr><td colspan="5" class="products-empty">Loading...</td></tr>';
    try {
      const res = await fetch(`${ADMIN_API_BASE}/brands`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load brands');
      renderTable(data.brands);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="products-empty">${err.message}</td></tr>`;
    }
  };

  const renderTable = (brands) => {
    if (!brands.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="products-empty">No brands found. Click "Add Brand" to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = brands.map((b) => `
      <tr>
        <td>
          ${b.logo
            ? `<img class="product-thumb" src="${ADMIN_API_BASE.replace('/api', '')}${b.logo}" alt="${b.name}">`
            : '<div class="product-thumb product-thumb-empty">No logo</div>'}
        </td>
        <td><div class="product-name-cell">${b.name}</div></td>
        <td>${b.slug}</td>
        <td>
          ${b.isActive ? '<span class="status-pill status-instock">Active</span>' : '<span class="status-pill status-inactive">Hidden</span>'}
        </td>
        <td class="products-actions">
          <button class="row-btn edit-btn" data-id="${b._id}">Edit</button>
          <button class="row-btn delete-btn" data-id="${b._id}" data-name="${b.name}">Delete</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.edit-btn').forEach((btn) => {
      btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    tbody.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', () => openDeleteModal(btn.dataset.id, btn.dataset.name));
    });
  };

  // ---------- Modal: open / close ----------
  const resetForm = () => {
    brandForm.reset();
    document.getElementById('brandId').value = '';
    document.getElementById('f_isActive').checked = true;
    existingLogo = null;
    imagePreviewStrip.innerHTML = '';
    formError.classList.remove('show');
    formError.textContent = '';
  };

  const openAddModal = () => {
    resetForm();
    modalTitle.textContent = 'Add Brand';
    modalOverlay.classList.add('show');
  };

  const openEditModal = async (id) => {
    resetForm();
    modalTitle.textContent = 'Edit Brand';
    modalOverlay.classList.add('show');

    try {
      const res = await fetch(`${ADMIN_API_BASE}/brands/${id}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load brand');

      const b = data.brand;
      document.getElementById('brandId').value = b._id;
      document.getElementById('f_name').value = b.name || '';
      document.getElementById('f_isActive').checked = b.isActive !== false;

      existingLogo = b.logo || null;
      renderImagePreview();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    }
  };

  const closeModal = () => {
    modalOverlay.classList.remove('show');
  };

  document.getElementById('addBrandBtn').addEventListener('click', openAddModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ---------- Logo preview (existing or newly chosen) ----------
  const renderImagePreview = () => {
    imagePreviewStrip.innerHTML = existingLogo
      ? `<div class="preview-thumb"><img src="${ADMIN_API_BASE.replace('/api', '')}${existingLogo}" alt=""></div>`
      : '';
  };

  document.getElementById('f_logo').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      renderImagePreview();
      return;
    }
    const url = URL.createObjectURL(file);
    imagePreviewStrip.innerHTML = `<div class="preview-thumb preview-thumb-new"><img src="${url}" alt=""></div>`;
  });

  // ---------- Save (create / update) ----------
  brandForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formError.textContent = '';

    const id = document.getElementById('brandId').value;
    const fd = new FormData();

    fd.append('name', document.getElementById('f_name').value.trim());
    fd.append('isActive', document.getElementById('f_isActive').checked);

    const file = document.getElementById('f_logo').files[0];
    if (file) fd.append('logo', file);

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const url = id ? `${ADMIN_API_BASE}/brands/${id}` : `${ADMIN_API_BASE}/brands`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save brand');

      closeModal();
      showMsg(id ? 'Brand updated.' : 'Brand added.');
      loadBrands();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Brand';
    }
  });

  // ---------- Delete ----------
  const openDeleteModal = (id, name) => {
    deleteTargetId = id;
    deleteBrandName.textContent = name;
    deleteModalOverlay.classList.add('show');
  };

  const closeDeleteModal = () => {
    deleteModalOverlay.classList.remove('show');
    deleteTargetId = null;
  };

  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  deleteModalOverlay.addEventListener('click', (e) => {
    if (e.target === deleteModalOverlay) closeDeleteModal();
  });

  document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
    if (!deleteTargetId) return;
    const btn = document.getElementById('deleteConfirmBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    try {
      const res = await fetch(`${ADMIN_API_BASE}/brands/${deleteTargetId}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete brand');

      closeDeleteModal();
      showMsg('Brand deleted.');
      loadBrands();
    } catch (err) {
      showMsg(err.message, true);
      closeDeleteModal();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  // ---------- Init ----------
  loadBrands();
});
