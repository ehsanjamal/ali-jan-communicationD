/* ==========================================================================
   Ali Jan Communication — Product Detail Page Script
   Loads a single product from /api/public/products/:slug (by ?slug= in the
   URL), renders gallery/price/specs/badges, wires the WhatsApp order button
   (via whatsapp.js) and a Call button using the real number from Settings,
   and loads a small "Related Products" strip of the same productType.
   ========================================================================== */

var pdContactPhone = '923001234567'; // fallback — replaced once /public/settings loads

function escapeHtmlPd(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function moneyFmtPd(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-PK');
}

function getSlugFromUrl() {
  return new URLSearchParams(window.location.search).get('slug') || '';
}

function loadContactPhone() {
  fetch(API_BASE + '/public/settings')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success && data.settings && data.settings.contactPhone) {
        pdContactPhone = data.settings.contactPhone.replace(/\D/g, '');
      }
    })
    .catch(function () { /* keep the fallback number */ });
}

var conditionLabels = { new: 'New', used: 'Used' };
var ptaLabels = {
  pta_approved: 'PTA Approved',
  non_pta: 'Non-PTA',
  factory_unlocked: 'Factory Unlocked',
};
var typeLabelsPd = {
  new_phone: 'Mobile Phones (New)',
  used_phone: 'Mobile Phones (Used)',
  tablet: 'Tablets',
  smart_watch: 'Smart Watches',
  accessory: 'Accessories',
};

/* ---------- Gallery ---------- */
function renderGallery(product) {
  var imgBase = API_BASE.replace('/api', '');
  var images = (product.images && product.images.length) ? product.images : [];

  if (!images.length) {
    return (
      '<div class="pd-gallery-main"><span class="no-img">No Image</span></div>'
    );
  }

  var main = '<div class="pd-gallery-main"><img id="pdMainImg" src="' + imgBase + images[0] + '" alt="' + escapeHtmlPd(product.name) + '"></div>';

  var thumbs = '';
  if (images.length > 1) {
    thumbs = '<div class="pd-gallery-thumbs">' + images.map(function (img, i) {
      return '<img src="' + imgBase + img + '" data-full="' + imgBase + img + '" class="' + (i === 0 ? 'active' : '') + '">';
    }).join('') + '</div>';
  }

  return main + thumbs;
}

function attachGalleryEvents() {
  var mainImg = document.getElementById('pdMainImg');
  document.querySelectorAll('.pd-gallery-thumbs img').forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      if (mainImg) mainImg.src = thumb.dataset.full;
      document.querySelectorAll('.pd-gallery-thumbs img').forEach(function (t) { t.classList.remove('active'); });
      thumb.classList.add('active');
    });
  });
}

/* ---------- Badges ---------- */
function renderBadges(product) {
  var badges = [];
  if (product.isSoldOut) badges.push('<span class="pd-badge sold">Sold Out</span>');
  if (product.condition && conditionLabels[product.condition]) badges.push('<span class="pd-badge">' + conditionLabels[product.condition] + '</span>');
  if (product.ptaStatus && ptaLabels[product.ptaStatus]) badges.push('<span class="pd-badge">' + ptaLabels[product.ptaStatus] + '</span>');
  if (product.isFeatured) badges.push('<span class="pd-badge">Featured</span>');
  if (!badges.length) return '';
  return '<div class="pd-badges">' + badges.join('') + '</div>';
}

/* ---------- Price ---------- */
function renderPrice(product) {
  if (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price) {
    return '<div class="pd-price"><span class="now">' + moneyFmtPd(product.discountPrice) + '</span><span class="old">' + moneyFmtPd(product.price) + '</span></div>';
  }
  return '<div class="pd-price"><span class="now">' + moneyFmtPd(product.price) + '</span></div>';
}

/* ---------- Specs table ---------- */
function renderSpecs(product) {
  var rows = [];

  if (product.category && product.category.name) rows.push(['Category', product.category.name]);
  if (product.brand && product.brand.name) rows.push(['Brand', product.brand.name]);
  if (product.condition && conditionLabels[product.condition]) rows.push(['Condition', conditionLabels[product.condition]]);
  if (product.ptaStatus && ptaLabels[product.ptaStatus]) rows.push(['PTA Status', ptaLabels[product.ptaStatus]]);
  if (product.storage) rows.push(['Storage', product.storage]);
  if (product.ram) rows.push(['RAM', product.ram]);
  if (product.batteryHealth) rows.push(['Battery Health', product.batteryHealth]);
  if (product.warrantyDays) rows.push(['Warranty', product.warrantyDays + ' din']);
  rows.push(['Stock', product.isSoldOut ? 'Sold Out' : (product.stock > 0 ? product.stock + ' available' : 'Out of stock')]);

  if (product.specs) {
    var extra = product.specs instanceof Map ? product.specs : new Map(Object.entries(product.specs));
    extra.forEach(function (val, key) {
      if (val) rows.push([key, val]);
    });
  }

  if (!rows.length) return '';

  return (
    '<div class="pd-specs">' +
      rows.map(function (r) {
        return '<div class="row"><span>' + escapeHtmlPd(r[0]) + '</span><span>' + escapeHtmlPd(r[1]) + '</span></div>';
      }).join('') +
    '</div>'
  );
}

/* ---------- Actions ---------- */
function renderActions(product) {
  var wishlisted = typeof isInWishlist === 'function' && isInWishlist(product.slug);
  return (
    '<div class="pd-actions">' +
      '<a href="#" class="pd-btn-wa" id="pdWaBtn">' +
        '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2m0 1.67c2.21 0 4.29.86 5.85 2.42a8.23 8.23 0 012.42 5.82c0 4.55-3.71 8.24-8.27 8.24a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 01-1.26-4.38c0-4.55 3.71-8.24 8.24-8.24m-4.53 4.72c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.35.99 2.52.12.16 1.7 2.72 4.19 3.71.58.25 1.04.4 1.4.51.59.19 1.13.16 1.55.1.47-.07 1.46-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.46-.28-.24-.12-1.46-.72-1.68-.8-.23-.08-.39-.12-.56.12-.16.24-.64.8-.78.97-.14.16-.29.18-.53.06-.24-.12-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.35-1.68-.14-.24-.02-.37.11-.49.11-.11.24-.29.36-.43.12-.14.16-.24.24-.4.08-.16.04-.31-.02-.43-.06-.12-.56-1.35-.77-1.85-.2-.48-.4-.42-.56-.42h-.4z"/></svg>' +
        'Order on WhatsApp' +
      '</a>' +
      '<a href="tel:+' + pdContactPhone + '" class="pd-btn-call">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>' +
        'Call Now' +
      '</a>' +
      '<button type="button" class="pd-btn-call' + (wishlisted ? ' pd-wish-on' : '') + '" id="pdWishBtn">' +
        (wishlisted ? '♥ Saved to Wishlist' : '♡ Add to Wishlist') +
      '</button>' +
    '</div>'
  );
}

/* ---------- Main render ---------- */
function renderProduct(product) {
  document.title = product.name + ' — Ali Jan Communication';
  document.getElementById('pageTitle').textContent = product.name + ' — Ali Jan Communication';
  document.getElementById('breadcrumbCurrent').textContent = product.name;

  if (product.category && product.category.name) {
    var crumb = document.getElementById('breadcrumb');
    var currentSpan = document.getElementById('breadcrumbCurrent');
    var catLink = document.createElement('a');
    catLink.href = 'shop.html?category=' + product.category._id;
    catLink.textContent = product.category.name;
    var sep = document.createElement('span');
    sep.className = 'sep';
    sep.textContent = '/';
    crumb.insertBefore(catLink, currentSpan);
    crumb.insertBefore(sep, currentSpan);
  }

  var brandHtml = product.brand && product.brand.name ? '<div class="pd-brand">' + escapeHtmlPd(product.brand.name) + '</div>' : '';

  var html =
    '<div class="pd-grid">' +
      '<div class="pd-gallery">' + renderGallery(product) + '</div>' +
      '<div class="pd-info">' +
        brandHtml +
        '<h1 class="pd-name">' + escapeHtmlPd(product.name) + '</h1>' +
        renderBadges(product) +
        renderPrice(product) +
        renderSpecs(product) +
        (product.description ? '<p class="pd-desc">' + escapeHtmlPd(product.description) + '</p>' : '') +
        renderActions(product) +
      '</div>' +
    '</div>';

  document.getElementById('pdWrap').innerHTML = html;
  attachGalleryEvents();

  var waBtn = document.getElementById('pdWaBtn');
  if (waBtn) {
    waBtn.addEventListener('click', function (e) {
      e.preventDefault();
      window.open(buildWhatsappOrderUrl(product), '_blank');
    });
  }

  var wishBtn = document.getElementById('pdWishBtn');
  if (wishBtn) {
    wishBtn.addEventListener('click', function () {
      var nowIn = toggleWishlist(product);
      wishBtn.classList.toggle('pd-wish-on', nowIn);
      wishBtn.textContent = nowIn ? '♥ Saved to Wishlist' : '♡ Add to Wishlist';
    });
  }

  loadRelated(product);
}

function renderNotFound() {
  document.getElementById('pdWrap').innerHTML = '<div class="pd-error">Ye product nahi mila. <a href="shop.html">Shop par wapas jayein</a>.</div>';
}

/* ---------- Related products ---------- */
function renderRelatedCard(p) {
  var imgBase = API_BASE.replace('/api', '');
  var img = (p.images && p.images[0])
    ? '<img src="' + imgBase + p.images[0] + '" alt="' + escapeHtmlPd(p.name) + '">'
    : '<span class="no-img">No Image</span>';

  var priceHtml = (p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price)
    ? '<span class="now">' + moneyFmtPd(p.discountPrice) + '</span><span class="old">' + moneyFmtPd(p.price) + '</span>'
    : '<span class="now">' + moneyFmtPd(p.price) + '</span>';

  return (
    '<div class="product-card">' +
      '<a class="pc-img" href="product.html?slug=' + p.slug + '">' + img + '</a>' +
      '<div class="pc-body">' +
        '<a href="product.html?slug=' + p.slug + '" class="pc-name">' + escapeHtmlPd(p.name) + '</a>' +
        '<div class="pc-price">' + priceHtml + '</div>' +
      '</div>' +
    '</div>'
  );
}

function loadRelated(product) {
  var params = new URLSearchParams();
  if (product.productType) params.set('type', product.productType);
  params.set('limit', 4);

  fetch(API_BASE + '/public/products?' + params.toString())
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) return;
      var related = data.products.filter(function (p) { return p.slug !== product.slug; }).slice(0, 4);
      if (!related.length) return;
      document.getElementById('relatedGrid').innerHTML = related.map(renderRelatedCard).join('');
      document.getElementById('relatedSection').style.display = 'block';
    })
    .catch(function () {});
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', function () {
  loadContactPhone();

  var slug = getSlugFromUrl();
  if (!slug) {
    renderNotFound();
    return;
  }

  fetch(API_BASE + '/public/products/' + encodeURIComponent(slug))
    .then(function (res) {
      if (!res.ok) throw new Error('not found');
      return res.json();
    })
    .then(function (data) {
      if (!data.success || !data.product) throw new Error('not found');
      renderProduct(data.product);
    })
    .catch(function () {
      renderNotFound();
    });
});
