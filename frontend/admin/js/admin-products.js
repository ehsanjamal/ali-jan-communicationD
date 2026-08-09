document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  // ---------- State ----------
  let currentType = '';
  let currentSearch = '';
  let currentPage = 1;
  let existingImages = []; // images already saved on the product being edited
  let deleteTargetId = null;

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  // ---------- Session check (reuses same pattern as dashboard) ----------
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
  const tbody = document.getElementById('productsTbody');
  const msgBox = document.getElementById('productsMsg');
  const pagination = document.getElementById('productsPagination');
  const typeTabs = document.getElementById('typeTabs');
  const searchInput = document.getElementById('searchInput');

  const modalOverlay = document.getElementById('productModalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const productForm = document.getElementById('productForm');
  const formError = document.getElementById('formError');
  const imagePreviewStrip = document.getElementById('imagePreviewStrip');

  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteProductName = document.getElementById('deleteProductName');

  const typeLabels = {
    new_phone: 'New Phone',
    used_phone: 'Used Phone',
    accessory: 'Accessory',
    tablet: 'Tablet',
    smart_watch: 'Smart Watch',
  };

  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.className = 'products-msg show' + (isError ? ' error' : '');
    if (text) setTimeout(() => { msgBox.className = 'products-msg'; }, 3500);
  };

  const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');

  // ---------- Load products ----------
  const loadProducts = async () => {
    tbody.innerHTML = '<tr><td colspan="7" class="products-empty">Loading...</td></tr>';
    try {
      const params = new URLSearchParams({ page: currentPage, limit: 12 });
      if (currentType) params.set('type', currentType);
      if (currentSearch) params.set('search', currentSearch);

      const res = await fetch(`${ADMIN_API_BASE}/products?${params.toString()}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load products');

      renderTable(data.products);
      renderPagination(data.pagination);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="products-empty">${err.message}</td></tr>`;
    }
  };

  const renderTable = (products) => {
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="products-empty">No products found. Click "Add Product" to create one.</td></tr>';
      return;
    }

    tbody.innerHTML = products.map((p) => `
      <tr>
        <td>
          ${p.images && p.images.length
            ? `<img class="product-thumb" src="${ADMIN_API_BASE.replace('/api', '')}${p.images[0]}" alt="${p.name}">`
            : '<div class="product-thumb product-thumb-empty">No image</div>'}
        </td>
        <td>
          <div class="product-name-cell">${p.name}</div>
        </td>
        <td>${typeLabels[p.productType] || p.productType}</td>
        <td>
          ${money(p.price)}
          ${p.discountPrice ? `<div class="product-discount">${money(p.discountPrice)}</div>` : ''}
        </td>
        <td>${p.stock}</td>
        <td>
          ${p.isSoldOut ? '<span class="status-pill status-soldout">Sold Out</span>' : '<span class="status-pill status-instock">In Stock</span>'}
          ${!p.isActive ? '<span class="status-pill status-inactive">Hidden</span>' : ''}
        </td>
        <td class="products-actions">
          <button class="row-btn edit-btn" data-id="${p._id}">Edit</button>
          <button class="row-btn delete-btn" data-id="${p._id}" data-name="${p.name}">Delete</button>
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

  const renderPagination = ({ page, pages }) => {
    if (pages <= 1) {
      pagination.innerHTML = '';
      return;
    }
    let html = '';
    for (let i = 1; i <= pages; i += 1) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    pagination.innerHTML = html;
    pagination.querySelectorAll('.page-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentPage = Number(btn.dataset.page);
        loadProducts();
      });
    });
  };

  // ---------- Filters ----------
  typeTabs.querySelectorAll('.type-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      typeTabs.querySelectorAll('.type-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentType = tab.dataset.type;
      currentPage = 1;
      loadProducts();
    });
  });

  let searchDebounce;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      loadProducts();
    }, 350);
  });

  // ---------- Modal: open / close ----------
  const resetForm = () => {
    productForm.reset();
    document.getElementById('productId').value = '';
    document.getElementById('f_isActive').checked = true;
    existingImages = [];
    imagePreviewStrip.innerHTML = '';
    formError.classList.remove('show');
    formError.textContent = '';
  };

  const openAddModal = () => {
    resetForm();
    modalTitle.textContent = 'Add Product';
    modalOverlay.classList.add('show');
  };

  const openEditModal = async (id) => {
    resetForm();
    modalTitle.textContent = 'Edit Product';
    modalOverlay.classList.add('show');

    try {
      const res = await fetch(`${ADMIN_API_BASE}/products/${id}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load product');

      const p = data.product;
      document.getElementById('productId').value = p._id;
      document.getElementById('f_name').value = p.name || '';
      document.getElementById('f_productType').value = p.productType || 'new_phone';
      document.getElementById('f_price').value = p.price ?? '';
      document.getElementById('f_discountPrice').value = p.discountPrice ?? '';
      document.getElementById('f_stock').value = p.stock ?? 0;
      document.getElementById('f_condition').value = p.condition || '';
      document.getElementById('f_ptaStatus').value = p.ptaStatus || '';
      document.getElementById('f_warrantyDays').value = p.warrantyDays || 0;
      document.getElementById('f_storage').value = p.storage || '';
      document.getElementById('f_ram').value = p.ram || '';
      document.getElementById('f_batteryHealth').value = p.batteryHealth || '';
      document.getElementById('f_description').value = p.description || '';
      document.getElementById('f_tags').value = (p.tags || []).join(', ');
      document.getElementById('f_isSoldOut').checked = !!p.isSoldOut;
      document.getElementById('f_isFeatured').checked = !!p.isFeatured;
      document.getElementById('f_isActive').checked = p.isActive !== false;

      existingImages = p.images || [];
      renderImagePreviews();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    }
  };

  const closeModal = () => {
    modalOverlay.classList.remove('show');
  };

  document.getElementById('addProductBtn').addEventListener('click', openAddModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  // ---------- Image previews (existing + newly chosen) ----------
  const renderImagePreviews = () => {
    let html = existingImages.map((url) => `
      <div class="preview-thumb">
        <img src="${ADMIN_API_BASE.replace('/api', '')}${url}" alt="">
        <button type="button" class="preview-remove" data-url="${url}">&times;</button>
      </div>
    `).join('');
    imagePreviewStrip.innerHTML = html;

    imagePreviewStrip.querySelectorAll('.preview-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        existingImages = existingImages.filter((u) => u !== btn.dataset.url);
        renderImagePreviews();
      });
    });
  };

  document.getElementById('f_images').addEventListener('change', (e) => {
    // Just show a lightweight local preview for newly chosen files (not yet uploaded)
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map((file) => {
      const url = URL.createObjectURL(file);
      return `<div class="preview-thumb preview-thumb-new"><img src="${url}" alt=""></div>`;
    }).join('');
    renderImagePreviews();
    imagePreviewStrip.insertAdjacentHTML('beforeend', newPreviews);
  });

  // ---------- Save (create / update) ----------
  productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formError.textContent = '';

    const id = document.getElementById('productId').value;
    const fd = new FormData();

    fd.append('name', document.getElementById('f_name').value.trim());
    fd.append('productType', document.getElementById('f_productType').value);
    fd.append('price', document.getElementById('f_price').value);
    fd.append('discountPrice', document.getElementById('f_discountPrice').value);
    fd.append('stock', document.getElementById('f_stock').value);
    fd.append('condition', document.getElementById('f_condition').value);
    fd.append('ptaStatus', document.getElementById('f_ptaStatus').value);
    fd.append('warrantyDays', document.getElementById('f_warrantyDays').value || 0);
    fd.append('storage', document.getElementById('f_storage').value);
    fd.append('ram', document.getElementById('f_ram').value);
    fd.append('batteryHealth', document.getElementById('f_batteryHealth').value);
    fd.append('description', document.getElementById('f_description').value);
    fd.append('tags', document.getElementById('f_tags').value);
    fd.append('isSoldOut', document.getElementById('f_isSoldOut').checked);
    fd.append('isFeatured', document.getElementById('f_isFeatured').checked);
    fd.append('isActive', document.getElementById('f_isActive').checked);

    if (id) {
      fd.append('existingImages', JSON.stringify(existingImages));
    }

    const files = document.getElementById('f_images').files;
    Array.from(files).forEach((file) => fd.append('images', file));

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const url = id ? `${ADMIN_API_BASE}/products/${id}` : `${ADMIN_API_BASE}/products`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save product');

      closeModal();
      showMsg(id ? 'Product updated.' : 'Product added.');
      loadProducts();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
    }
  });

  // ---------- Delete ----------
  const openDeleteModal = (id, name) => {
    deleteTargetId = id;
    deleteProductName.textContent = name;
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
      const res = await fetch(`${ADMIN_API_BASE}/products/${deleteTargetId}`, {
        method: 'DELETE',
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete product');

      closeDeleteModal();
      showMsg('Product deleted.');
      loadProducts();
    } catch (err) {
      showMsg(err.message, true);
      closeDeleteModal();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  // ---------- Init ----------
  loadProducts();
});
