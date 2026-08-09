document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  let deleteTargetId = null;

  const authHeaders = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

  // ---------- Session check ----------
  try {
    const res = await fetch(`${ADMIN_API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
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
  const tbody = document.getElementById('offersTbody');
  const msgBox = document.getElementById('offersMsg');
  const modalOverlay = document.getElementById('offerModalOverlay');
  const modalTitle = document.getElementById('modalTitle');
  const offerForm = document.getElementById('offerForm');
  const formError = document.getElementById('formError');
  const deleteModalOverlay = document.getElementById('deleteModalOverlay');
  const deleteOfferName = document.getElementById('deleteOfferName');
  const appliesToSelect = document.getElementById('f_appliesTo');
  const categoryRow = document.getElementById('targetCategoryRow');
  const brandRow = document.getElementById('targetBrandRow');
  const productRow = document.getElementById('targetProductRow');
  const categorySelect = document.getElementById('f_category');
  const brandSelect = document.getElementById('f_brand');
  const productSelect = document.getElementById('f_product');

  const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.className = `products-msg ${isError ? 'products-msg-error' : 'products-msg-success'}`;
    setTimeout(() => { msgBox.textContent = ''; msgBox.className = 'products-msg'; }, 2500);
  };

  // ---------- Load target option lists (categories/brands/products) ----------
  let categories = [];
  let brands = [];
  let products = [];

  const loadTargetLists = async () => {
    try {
      const [catRes, brandRes, prodRes] = await Promise.all([
        fetch(`${ADMIN_API_BASE}/categories`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }),
        fetch(`${ADMIN_API_BASE}/brands`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }),
        fetch(`${ADMIN_API_BASE}/products?limit=100`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' }),
      ]);
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      const prodData = await prodRes.json();

      categories = catData.success ? catData.categories : [];
      brands = brandData.success ? brandData.brands : [];
      products = prodData.success ? prodData.products : [];

      categorySelect.innerHTML = categories.map((c) => `<option value="${c._id}">${c.name}</option>`).join('');
      brandSelect.innerHTML = brands.map((b) => `<option value="${b._id}">${b.name}</option>`).join('');
      productSelect.innerHTML = products.map((p) => `<option value="${p._id}">${p.name}</option>`).join('');
    } catch (err) { /* selects stay empty — still usable for "All Products" offers */ }
  };

  const syncTargetRows = () => {
    const val = appliesToSelect.value;
    categoryRow.style.display = val === 'category' ? 'block' : 'none';
    brandRow.style.display = val === 'brand' ? 'block' : 'none';
    productRow.style.display = val === 'product' ? 'block' : 'none';
  };
  appliesToSelect.addEventListener('change', syncTargetRows);

  // ---------- Load + render offers ----------
  const loadOffers = async () => {
    tbody.innerHTML = '<tr><td colspan="6" class="products-empty">Loading...</td></tr>';
    try {
      const res = await fetch(`${ADMIN_API_BASE}/offers`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load offers');
      renderTable(data.offers);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="products-empty">${err.message}</td></tr>`;
    }
  };

  const targetLabel = (o) => {
    if (o.appliesTo === 'category') return o.category ? `Category: ${o.category.name}` : 'Category';
    if (o.appliesTo === 'brand') return o.brand ? `Brand: ${o.brand.name}` : 'Brand';
    if (o.appliesTo === 'product') return o.product ? `Product: ${o.product.name}` : 'Product';
    return 'All Products';
  };

  const renderTable = (offers) => {
    if (!offers.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="products-empty">Koi offer nahi mila. "Add Offer" par click karein.</td></tr>';
      return;
    }

    tbody.innerHTML = offers.map((o) => `
      <tr>
        <td><div class="product-name-cell">${o.title}</div></td>
        <td>${o.discountType === 'percentage' ? o.discountValue + '%' : money(o.discountValue)}</td>
        <td>${targetLabel(o)}</td>
        <td style="font-size:0.78rem;">${fmtDate(o.startsAt)} – ${fmtDate(o.endsAt)}</td>
        <td>${o.isActive ? '<span class="status-pill status-instock">Active</span>' : '<span class="status-pill status-inactive">Inactive</span>'}</td>
        <td class="products-actions">
          <button class="row-btn edit-btn" data-id="${o._id}">Edit</button>
          <button class="row-btn delete-btn" data-id="${o._id}" data-name="${o.title}">Delete</button>
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

  // ---------- Modal open/close ----------
  const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

  const resetForm = () => {
    offerForm.reset();
    document.getElementById('offerId').value = '';
    document.getElementById('f_discountType').value = 'percentage';
    appliesToSelect.value = 'all';
    syncTargetRows();
    formError.classList.remove('show');
    formError.textContent = '';
  };

  const openAddModal = async () => {
    resetForm();
    modalTitle.textContent = 'Add Offer';
    modalOverlay.classList.add('show');
    if (!categories.length && !brands.length && !products.length) await loadTargetLists();
  };

  const openEditModal = async (id) => {
    resetForm();
    modalTitle.textContent = 'Edit Offer';
    modalOverlay.classList.add('show');
    if (!categories.length && !brands.length && !products.length) await loadTargetLists();

    try {
      const res = await fetch(`${ADMIN_API_BASE}/offers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load offer');

      const o = data.offer;
      document.getElementById('offerId').value = o._id;
      document.getElementById('f_title').value = o.title;
      document.getElementById('f_description').value = o.description || '';
      document.getElementById('f_discountType').value = o.discountType;
      document.getElementById('f_discountValue').value = o.discountValue;
      appliesToSelect.value = o.appliesTo;
      syncTargetRows();
      if (o.category) categorySelect.value = o.category._id || o.category;
      if (o.brand) brandSelect.value = o.brand._id || o.brand;
      if (o.product) productSelect.value = o.product._id || o.product;
      document.getElementById('f_startsAt').value = toDateInput(o.startsAt);
      document.getElementById('f_endsAt').value = toDateInput(o.endsAt);
      document.getElementById('f_isActive').checked = o.isActive;
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    }
  };

  const closeModal = () => modalOverlay.classList.remove('show');

  document.getElementById('addOfferBtn').addEventListener('click', openAddModal);
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

  // ---------- Save (create / update) ----------
  offerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formError.textContent = '';

    const id = document.getElementById('offerId').value;
    const appliesTo = appliesToSelect.value;

    const payload = {
      title: document.getElementById('f_title').value.trim(),
      description: document.getElementById('f_description').value,
      discountType: document.getElementById('f_discountType').value,
      discountValue: document.getElementById('f_discountValue').value,
      appliesTo,
      category: appliesTo === 'category' ? categorySelect.value : '',
      brand: appliesTo === 'brand' ? brandSelect.value : '',
      product: appliesTo === 'product' ? productSelect.value : '',
      startsAt: document.getElementById('f_startsAt').value,
      endsAt: document.getElementById('f_endsAt').value,
      isActive: document.getElementById('f_isActive').checked,
    };

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
      const url = id ? `${ADMIN_API_BASE}/offers/${id}` : `${ADMIN_API_BASE}/offers`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save offer');

      closeModal();
      showMsg(id ? 'Offer updated.' : 'Offer added.');
      loadOffers();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Offer';
    }
  });

  // ---------- Delete ----------
  const openDeleteModal = (id, name) => {
    deleteTargetId = id;
    deleteOfferName.textContent = name;
    deleteModalOverlay.classList.add('show');
  };
  const closeDeleteModal = () => {
    deleteModalOverlay.classList.remove('show');
    deleteTargetId = null;
  };

  document.getElementById('deleteCancelBtn').addEventListener('click', closeDeleteModal);
  deleteModalOverlay.addEventListener('click', (e) => { if (e.target === deleteModalOverlay) closeDeleteModal(); });

  document.getElementById('deleteConfirmBtn').addEventListener('click', async () => {
    if (!deleteTargetId) return;
    const btn = document.getElementById('deleteConfirmBtn');
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    try {
      const res = await fetch(`${ADMIN_API_BASE}/offers/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to delete offer');

      closeDeleteModal();
      showMsg('Offer deleted.');
      loadOffers();
    } catch (err) {
      showMsg(err.message, true);
      closeDeleteModal();
    } finally {
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  // ---------- Init ----------
  loadOffers();
});
