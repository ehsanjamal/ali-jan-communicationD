/* ==========================================================================
   Ali Jan Communication — Shop Page Script
   Loads products from /api/public/products with type/category/brand/search/
   sort/page filters, and populates the Category & Brand filter lists from
   /api/public/categories and /api/public/brands.
   ========================================================================== */

var shopState = {
  type: '',
  category: '',
  brand: '',
  search: '',
  sort: '',
  page: 1,
};

function escapeHtmlShop(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function moneyFmtShop(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-PK');
}

function readStateFromUrl() {
  var params = new URLSearchParams(window.location.search);
  shopState.type = params.get('type') || '';
  shopState.category = params.get('category') || '';
  shopState.brand = params.get('brand') || '';
  shopState.search = params.get('search') || '';
  shopState.sort = params.get('sort') || '';
  shopState.page = parseInt(params.get('page'), 10) || 1;
}

function pushStateToUrl() {
  var params = new URLSearchParams();
  if (shopState.type) params.set('type', shopState.type);
  if (shopState.category) params.set('category', shopState.category);
  if (shopState.brand) params.set('brand', shopState.brand);
  if (shopState.search) params.set('search', shopState.search);
  if (shopState.sort) params.set('sort', shopState.sort);
  if (shopState.page > 1) params.set('page', shopState.page);
  var qs = params.toString();
  history.replaceState(null, '', window.location.pathname + (qs ? '?' + qs : ''));
}

function updateBreadcrumb() {
  var el = document.getElementById('breadcrumbCurrent');
  if (!el) return;
  var typeLabels = {
    new_phone: 'Mobile Phones (New)',
    used_phone: 'Mobile Phones (Used)',
    tablet: 'Tablets',
    smart_watch: 'Smart Watches',
    accessory: 'Accessories',
  };
  el.textContent = shopState.search
    ? 'Search: "' + shopState.search + '"'
    : (typeLabels[shopState.type] || 'Shop All Products');
}

/* ---------- Filter lists (categories / brands) ---------- */
function loadFilterLists() {
  fetch(API_BASE + '/public/categories')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) return;
      var list = document.getElementById('categoryFilterList');
      var html = '<button class="filter-item' + (!shopState.category ? ' active' : '') + '" data-category="">All Categories</button>';
      html += data.categories.map(function (c) {
        return '<button class="filter-item' + (shopState.category === c._id ? ' active' : '') + '" data-category="' + c._id + '">' + escapeHtmlShop(c.name) + '</button>';
      }).join('');
      list.innerHTML = html;
      list.querySelectorAll('.filter-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
          shopState.category = btn.dataset.category;
          shopState.page = 1;
          syncActiveFilters();
          pushStateToUrl();
          fetchProducts();
        });
      });
    })
    .catch(function () {});

  fetch(API_BASE + '/public/brands')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) return;
      var list = document.getElementById('brandFilterList');
      var html = '<button class="filter-item' + (!shopState.brand ? ' active' : '') + '" data-brand="">All Brands</button>';
      html += data.brands.map(function (b) {
        return '<button class="filter-item' + (shopState.brand === b._id ? ' active' : '') + '" data-brand="' + b._id + '">' + escapeHtmlShop(b.name) + '</button>';
      }).join('');
      list.innerHTML = html;
      list.querySelectorAll('.filter-item').forEach(function (btn) {
        btn.addEventListener('click', function () {
          shopState.brand = btn.dataset.brand;
          shopState.page = 1;
          syncActiveFilters();
          pushStateToUrl();
          fetchProducts();
        });
      });
    })
    .catch(function () {});
}

function syncActiveFilters() {
  document.querySelectorAll('#typeFilterList .filter-item').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.type === shopState.type);
  });
  document.querySelectorAll('#categoryFilterList .filter-item').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.category === shopState.category);
  });
  document.querySelectorAll('#brandFilterList .filter-item').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.brand === shopState.brand);
  });
  updateBreadcrumb();
}

/* ---------- Product card ---------- */
function renderProductCard(p) {
  var img = (p.images && p.images[0])
    ? '<img src="' + API_BASE.replace('/api', '') + p.images[0] + '" alt="' + escapeHtmlShop(p.name) + '">'
    : '<span class="no-img">No Image</span>';

  var badge = '';
  if (p.isSoldOut) badge = '<span class="pc-badge sold">Sold Out</span>';
  else if (p.condition === 'used') badge = '<span class="pc-badge">Used</span>';
  else if (p.isFeatured) badge = '<span class="pc-badge">Featured</span>';

  var priceHtml;
  if (p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price) {
    priceHtml = '<span class="now">' + moneyFmtShop(p.discountPrice) + '</span><span class="old">' + moneyFmtShop(p.price) + '</span>';
  } else {
    priceHtml = '<span class="now">' + moneyFmtShop(p.price) + '</span>';
  }

  var brandHtml = p.brand && p.brand.name ? '<div class="pc-brand">' + escapeHtmlShop(p.brand.name) + '</div>' : '';
  var wishlisted = typeof isInWishlist === 'function' && isInWishlist(p.slug);

  return (
    '<div class="product-card">' +
      '<a class="pc-img" href="product.html?slug=' + p.slug + '">' + badge + img + '</a>' +
      '<div class="pc-body">' +
        brandHtml +
        '<a href="product.html?slug=' + p.slug + '" class="pc-name">' + escapeHtmlShop(p.name) + '</a>' +
        '<div class="pc-price">' + priceHtml + '</div>' +
        '<div class="pc-actions">' +
          '<a class="pc-btn" href="product.html?slug=' + p.slug + '">View Details</a>' +
          '<button class="pc-btn pc-wa" data-order-btn data-slug="' + p.slug + '">WhatsApp</button>' +
          '<button class="pc-btn pc-wish' + (wishlisted ? ' pc-wish-on' : '') + '" data-wishlist-btn data-slug="' + p.slug + '">' + (wishlisted ? '♥' : '♡') + '</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function attachWishlistButtons(products) {
  document.querySelectorAll('[data-wishlist-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = products.find(function (x) { return x.slug === btn.dataset.slug; });
      if (!p) return;
      var nowIn = toggleWishlist(p);
      btn.classList.toggle('pc-wish-on', nowIn);
      btn.textContent = nowIn ? '♥' : '♡';
    });
  });
}

function attachOrderButtons(products) {
  document.querySelectorAll('[data-order-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = products.find(function (x) { return x.slug === btn.dataset.slug; });
      if (!p) return;
      window.open(buildWhatsappOrderUrl(p), '_blank');
    });
  });
}

/* ---------- Fetch + render products ---------- */
function fetchProducts() {
  var grid = document.getElementById('productGrid');
  var countEl = document.getElementById('shopCount');
  grid.innerHTML = '<div class="shop-empty">Loading products...</div>';

  var params = new URLSearchParams();
  if (shopState.type) params.set('type', shopState.type);
  if (shopState.category) params.set('category', shopState.category);
  if (shopState.brand) params.set('brand', shopState.brand);
  if (shopState.search) params.set('search', shopState.search);
  if (shopState.sort) params.set('sort', shopState.sort);
  params.set('page', shopState.page);
  params.set('limit', 12);

  fetch(API_BASE + '/public/products?' + params.toString())
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) throw new Error('Failed to load');

      if (!data.products.length) {
        grid.innerHTML = '<div class="shop-empty">Koi product nahi mila. Filters change kar ke dobara koshish karein.</div>';
        countEl.textContent = '0 products found';
        renderPagination(data.pagination);
        return;
      }

      grid.innerHTML = data.products.map(renderProductCard).join('');
      attachOrderButtons(data.products);
      attachWishlistButtons(data.products);
      countEl.textContent = data.pagination.total + ' product' + (data.pagination.total === 1 ? '' : 's') + ' found';
      renderPagination(data.pagination);
    })
    .catch(function () {
      grid.innerHTML = '<div class="shop-empty">Products load nahi ho sake. Dobara koshish karein.</div>';
      countEl.textContent = '';
    });
}

function renderPagination(pagination) {
  var el = document.getElementById('pagination');
  if (!pagination || pagination.pages <= 1) {
    el.innerHTML = '';
    return;
  }
  var html = '';
  html += '<button' + (pagination.page === 1 ? ' disabled' : '') + ' data-page="' + (pagination.page - 1) + '">&larr;</button>';
  for (var i = 1; i <= pagination.pages; i++) {
    html += '<button class="' + (i === pagination.page ? 'active' : '') + '" data-page="' + i + '">' + i + '</button>';
  }
  html += '<button' + (pagination.page === pagination.pages ? ' disabled' : '') + ' data-page="' + (pagination.page + 1) + '">&rarr;</button>';
  el.innerHTML = html;

  el.querySelectorAll('button:not([disabled])').forEach(function (btn) {
    btn.addEventListener('click', function () {
      shopState.page = parseInt(btn.dataset.page, 10);
      pushStateToUrl();
      fetchProducts();
      window.scrollTo({ top: document.querySelector('.shop-layout').offsetTop - 20, behavior: 'smooth' });
    });
  });
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function () {
  readStateFromUrl();
  updateBreadcrumb();

  document.getElementById('searchInput').value = shopState.search;
  document.getElementById('filterSearch').value = shopState.search;
  document.getElementById('sortSelect').value = shopState.sort;

  document.querySelectorAll('#typeFilterList .filter-item').forEach(function (btn) {
    if (btn.dataset.type === shopState.type) btn.classList.add('active');
    btn.addEventListener('click', function () {
      shopState.type = btn.dataset.type;
      shopState.page = 1;
      syncActiveFilters();
      pushStateToUrl();
      fetchProducts();
    });
  });

  document.getElementById('sortSelect').addEventListener('change', function (e) {
    shopState.sort = e.target.value;
    shopState.page = 1;
    pushStateToUrl();
    fetchProducts();
  });

  var searchTimer = null;
  document.getElementById('filterSearch').addEventListener('input', function (e) {
    clearTimeout(searchTimer);
    var val = e.target.value;
    searchTimer = setTimeout(function () {
      shopState.search = val.trim();
      shopState.page = 1;
      updateBreadcrumb();
      pushStateToUrl();
      fetchProducts();
    }, 400);
  });

  document.getElementById('filterClear').addEventListener('click', function () {
    shopState = { type: '', category: '', brand: '', search: '', sort: '', page: 1 };
    document.getElementById('filterSearch').value = '';
    document.getElementById('sortSelect').value = '';
    syncActiveFilters();
    pushStateToUrl();
    fetchProducts();
  });

  loadFilterLists();
  syncActiveFilters();
  fetchProducts();
});
