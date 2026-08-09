document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  let existingImage = null; // current saved image URL (or null) for the banner being edited
  let deleteTargetId = null;

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  const placementLabel = (p) => (p === 'slider' ? 'Homepage Slider' : 'Promo Banner');

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
  const tbody = document.getElementById('bannersTbody');
  const msgBox = document.getElementById('bannersMsg');
  const placementFilter = document.getElementById('placementFilter');

  const modalOverlay = document.getElementById('bannerModalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const bannerForm = document.getElementById('bannerForm');
  const formError = document.getElementById('formError');
  const imagePreviewStrip = document.getElementById('imagePreviewStrip');

  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteBannerName = document.getElementById('deleteBannerName');

  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.className = 'products-msg show' + (isError ? ' error' : '');
    if (text) setTimeout(() => { msgBox.className = 'products-msg'; }, 3500);
  };

  // ---------- Load banners ----------
  const loadBanners = async () => {
    tbody.innerHTML = '<tr><td colspan="6" class="products-empty">Loading...</td></tr>';
    try {
      const qs = placementFilter.value ? `?placement=${placementFilter.value}` : '';
      const res = await fetch(`${ADMIN_API_BASE}/banners${qs}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load banners');
      renderTable(data.banners);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="products-empty">${err.message}</td></tr>`;
    }
  };

  const renderTable = (banners) => {
    if (!banners.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="products-empty">No banners found. Click "Add Banner" to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = banners.map((b) => `
      <tr>
        <td>
          ${b.image
            ? `<img class="product-thumb" src="${ADMIN_API_BASE.replace('/api', '')}${b.image}" alt="${b.title || ''}">`
            : '<div class="product-thumb product-thumb-empty">No image</div>'}
        </td>
        <td><div class="product-name-cell">${b.title || '<em>Untitled</em>'}</div></td>
        <td>${placementLabel(b.placement)}</td>
        <td>${b.sortOrder}</td>
        <td>
          ${b.isActive ? '<span class="status-pill status-instock">Active</span>' : '<span class="status-pill status-inactive">Hidden</span>'}
        </td>
        <td class="products-actions">
          <button class="row-btn edit-btn" data-id="${b._id}">Edit</button>
          <button class="row-btn delete-btn" data-id="${b._id}" data-name="${b.title || placementLabel(b.placement)}">Delete</button>
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

  placementFilter.addEventListener('change', loadBanners);

  // ---------- Modal: open / close ----------
  const resetForm = () => {
    bannerForm.reset();
    document.getElementById('bannerId').value = '';
    document.getElementById('f_placement').value = 'slider';
    document.getElementById('f_isActive').checked = true;
    existingImage = null;
    imagePreviewStrip.innerHTML = '';
    formError.classList.remove('show');
    formError.textContent = '';
  };

  const openAddModal = () => {
    resetForm();
    modalTitle.textContent = 'Add Banner';
    modalOverlay.classList.add('show');
  };

  const openEditModal = async (id) => {
    resetForm();
    modalTitle.textContent = 'Edit Banner';
    modalOverlay.classList.add('show');

    try {
      const res = await fetch(`${ADMIN_API_BASE}/banners/${id}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load banner');

      const b = data.banner;
      document.getElementById('bannerId').value = b._id;
      document.getElementById('f_placement').value = b.placement || 'slider';
      document.getElementById('f_title').value = b.title || '';
      document.getElementById('f_subtitle').value = b.subtitle || '';
      document.getElementById('f_linkUrl').value = b.linkUrl || '';
      document.getElementById('f_sortOrder').value = b.sortOrder || 0;
      document.getElementById('f_isActive').checked = b.isActive !== false;

      existingImage = b.image || null;
      renderImagePreview();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    }
  };

  const closeModal = () => {
    modalOverlay.classList.remove('show');
  };

  document.getElementById('addBannerBtn').addEventListener('click', openAddModal);
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
  bannerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formError.textContent = '';

    const id = document.getElementById('bannerId').value;
    const file = document.getElementById('f_image').files[0];

    if (!id && !file) {
      formError.textContent = 'Image is required for a new banner.';
      formError.classList.add('show');
      return;
    }

    const fd = new FormData();
    fd.append('placement', document.getElementById('f_placement').value);
    fd.append('title', document.getElementById('f_title').value.trim());
    fd.append('subtitle', document.getElementById('f_subtitle').value.trim());
    fd.append('linkUrl', document.getElementById('f_linkUrl').value.trim());
    fd.append('sortOrder', document.getElementById('f_sortOrder').value || 0);
    fd.append('isActive', document.getElementById('f_isActive').checked);
    if (file) fd.append('image', file);

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const url = id ? `${ADMIN_API_BASE}/banners/${id}` : `${ADMIN_API_BASE}/banners`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save banner');

      closeModal();
      showMsg(id ? 'Banner updated.' : 'Banner added.');
      loadBanners();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Banner';
    }
  });

  // ---------- Delete ----------
  const openDeleteModal = (id, name) => {
    deleteTargetId = id;
    deleteBannerName.textContent = name;
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
      const res = await fetch(`${ADMIN_API_BASE}/banners/${deleteTargetId}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete banner');

      closeDeleteModal();
      showMsg('Banner deleted.');
      loadBanners();
    } catch (err) {
      showMsg(err.message, true);
      closeDeleteModal();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  // ---------- Init ----------
  loadBanners();
});
