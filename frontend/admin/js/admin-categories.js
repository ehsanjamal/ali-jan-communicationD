document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  let existingImage = null; // current saved image URL (or null) for the category being edited
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
  const tbody = document.getElementById('categoriesTbody');
  const msgBox = document.getElementById('categoriesMsg');

  const modalOverlay = document.getElementById('categoryModalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const categoryForm = document.getElementById('categoryForm');
  const formError = document.getElementById('formError');
  const imagePreviewStrip = document.getElementById('imagePreviewStrip');

  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteCategoryName = document.getElementById('deleteCategoryName');

  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.className = 'products-msg show' + (isError ? ' error' : '');
    if (text) setTimeout(() => { msgBox.className = 'products-msg'; }, 3500);
  };

  // ---------- Load categories ----------
  const loadCategories = async () => {
    tbody.innerHTML = '<tr><td colspan="5" class="products-empty">Loading...</td></tr>';
    try {
      const res = await fetch(`${ADMIN_API_BASE}/categories`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load categories');
      renderTable(data.categories);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="products-empty">${err.message}</td></tr>`;
    }
  };

  const renderTable = (categories) => {
    if (!categories.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="products-empty">No categories found. Click "Add Category" to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map((c) => `
      <tr>
        <td>
          ${c.image
            ? `<img class="product-thumb" src="${ADMIN_API_BASE.replace('/api', '')}${c.image}" alt="${c.name}">`
            : '<div class="product-thumb product-thumb-empty">No image</div>'}
        </td>
        <td><div class="product-name-cell">${c.name}</div></td>
        <td>${c.sortOrder}</td>
        <td>
          ${c.isActive ? '<span class="status-pill status-instock">Active</span>' : '<span class="status-pill status-inactive">Hidden</span>'}
        </td>
        <td class="products-actions">
          <button class="row-btn edit-btn" data-id="${c._id}">Edit</button>
          <button class="row-btn delete-btn" data-id="${c._id}" data-name="${c.name}">Delete</button>
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
    categoryForm.reset();
    document.getElementById('categoryId').value = '';
    document.getElementById('f_isActive').checked = true;
    existingImage = null;
    imagePreviewStrip.innerHTML = '';
    formError.classList.remove('show');
    formError.textContent = '';
  };

  const openAddModal = () => {
    resetForm();
    modalTitle.textContent = 'Add Category';
    modalOverlay.classList.add('show');
  };

  const openEditModal = async (id) => {
    resetForm();
    modalTitle.textContent = 'Edit Category';
    modalOverlay.classList.add('show');

    try {
      const res = await fetch(`${ADMIN_API_BASE}/categories/${id}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load category');

      const c = data.category;
      document.getElementById('categoryId').value = c._id;
      document.getElementById('f_name').value = c.name || '';
      document.getElementById('f_sortOrder').value = c.sortOrder || 0;
      document.getElementById('f_isActive').checked = c.isActive !== false;

      existingImage = c.image || null;
      renderImagePreview();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    }
  };

  const closeModal = () => {
    modalOverlay.classList.remove('show');
  };

  document.getElementById('addCategoryBtn').addEventListener('click', openAddModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ---------- Image preview (existing or newly chosen) ----------
  const renderImagePreview = () => {
    imagePreviewStrip.innerHTML = existingImage
      ? `<div class="preview-thumb"><img src="${ADMIN_API_BASE.replace('/api', '')}${existingImage}" alt=""></div>`
      : '';
  };

  document.getElementById('f_image').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      renderImagePreview();
      return;
    }
    const url = URL.createObjectURL(file);
    imagePreviewStrip.innerHTML = `<div class="preview-thumb preview-thumb-new"><img src="${url}" alt=""></div>`;
  });

  // ---------- Save (create / update) ----------
  categoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formError.textContent = '';

    const id = document.getElementById('categoryId').value;
    const fd = new FormData();

    fd.append('name', document.getElementById('f_name').value.trim());
    fd.append('sortOrder', document.getElementById('f_sortOrder').value || 0);
    fd.append('isActive', document.getElementById('f_isActive').checked);

    const file = document.getElementById('f_image').files[0];
    if (file) fd.append('image', file);

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const url = id ? `${ADMIN_API_BASE}/categories/${id}` : `${ADMIN_API_BASE}/categories`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save category');

      closeModal();
      showMsg(id ? 'Category updated.' : 'Category added.');
      loadCategories();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Category';
    }
  });

  // ---------- Delete ----------
  const openDeleteModal = (id, name) => {
    deleteTargetId = id;
    deleteCategoryName.textContent = name;
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
      const res = await fetch(`${ADMIN_API_BASE}/categories/${deleteTargetId}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete category');

      closeDeleteModal();
      showMsg('Category deleted.');
      loadCategories();
    } catch (err) {
      showMsg(err.message, true);
      closeDeleteModal();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  // ---------- Init ----------
  loadCategories();
});
