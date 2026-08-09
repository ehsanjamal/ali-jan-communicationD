document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  // ---------- State ----------
  let currentFilter = 'all'; // 'all' | 'featured'
  let currentSearch = '';
  let currentPage = 1;

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
  const tbody = document.getElementById('featuredTbody');
  const msgBox = document.getElementById('featuredMsg');
  const pagination = document.getElementById('featuredPagination');
  const filterTabs = document.getElementById('featuredTabs');
  const searchInput = document.getElementById('searchInput');

  const typeLabels = {
    new_phone: 'New Phone',
    used_phone: 'Used Phone',
    accessory: 'Accessory',
    tablet: 'Tablet',
    smart_watch: 'Smart Watch',
  };
  const money = (n) => 'Rs ' + Number(n || 0).toLocaleString('en-PK');

  const showMsg = (text, type = 'success') => {
    msgBox.textContent = text;
    msgBox.className = `products-msg products-msg-${type}`;
    setTimeout(() => { msgBox.textContent = ''; msgBox.className = 'products-msg'; }, 2500);
  };

  // ---------- Load ----------
  const loadProducts = async () => {
    tbody.innerHTML = '<tr><td colspan="5" class="products-empty">Loading...</td></tr>';
    try {
      const params = new URLSearchParams();
      if (currentFilter === 'featured') params.set('featured', 'true');
      if (currentSearch) params.set('search', currentSearch);
      params.set('page', currentPage);
      params.set('limit', 20);

      const res = await fetch(`${ADMIN_API_BASE}/products?${params.toString()}`, {
        headers: authHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load products');

      renderTable(data.products);
      renderPagination(data.pagination);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5" class="products-empty">${err.message}</td></tr>`;
    }
  };

  const renderTable = (products) => {
    if (!products.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="products-empty">Koi product nahi mila.</td></tr>';
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
        <td>${money(p.price)}</td>
        <td>
          <button class="row-btn star-btn ${p.isFeatured ? 'star-on' : ''}" data-id="${p._id}" data-featured="${p.isFeatured}">
            ${p.isFeatured ? '★ Featured' : '☆ Mark Featured'}
          </button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.star-btn').forEach((btn) => {
      btn.addEventListener('click', () => toggleFeatured(btn));
    });
  };

  const toggleFeatured = async (btn) => {
    const id = btn.dataset.id;
    const nextValue = btn.dataset.featured !== 'true';
    btn.disabled = true;
    try {
      const form = new FormData();
      form.append('isFeatured', String(nextValue));

      const res = await fetch(`${ADMIN_API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: authHeaders(),
        credentials: 'include',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Update failed');

      showMsg(nextValue ? 'Product featured mark ho gaya.' : 'Product featured se hata diya gaya.');
      loadProducts();
    } catch (err) {
      showMsg(err.message, 'error');
      btn.disabled = false;
    }
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
  filterTabs.querySelectorAll('.type-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      filterTabs.querySelectorAll('.type-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
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
    }, 400);
  });

  loadProducts();
});
