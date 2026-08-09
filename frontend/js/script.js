/* ==========================================================================
   Ali Jan Communication — Frontend Script
   Price-list tabs now load real products from the backend (/api/public/products)
   instead of the old static sample list. Deal-of-the-day countdown unchanged.
   ========================================================================== */

var loadedBoards = {};

function moneyFmt(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-PK');
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function renderTicket(p) {
  var priceHtml;
  if (p.discountPrice && p.discountPrice > 0 && p.discountPrice < p.price) {
    priceHtml =
      '<span class="price"><span class="now">' + moneyFmt(p.discountPrice) +
      '</span> <span class="old">' + moneyFmt(p.price) + '</span></span>';
  } else {
    priceHtml = '<span class="price">' + moneyFmt(p.price) + '</span>';
  }

  var tagHtml = '';
  if (p.isSoldOut) {
    tagHtml = '<span class="tag">Sold Out</span>';
  } else if (p.condition === 'used') {
    tagHtml = '<span class="tag">Used</span>';
  } else if (p.condition === 'new') {
    tagHtml = '<span class="tag">New</span>';
  }

  return (
    '<div class="ticket">' +
    '<span class="name">' + escapeHtml(p.name) + '</span>' +
    tagHtml +
    '<span class="filler"></span>' +
    priceHtml +
    '</div>'
  );
}

function loadBoard(type) {
  if (loadedBoards[type]) return; // load each tab's products only once per page view
  loadedBoards[type] = true;

  var board = document.getElementById('board-' + type);
  if (!board) return;

  board.innerHTML = '<div class="ticket"><span class="name">Loading...</span></div>';

  fetch(API_BASE + '/public/products?type=' + encodeURIComponent(type) + '&limit=100')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success || !data.products || data.products.length === 0) {
        board.innerHTML =
          '<div class="ticket"><span class="name">Is category mein filhal koi product listed nahi hai.</span></div>';
        return;
      }
      board.innerHTML = data.products.map(renderTicket).join('');
    })
    .catch(function () {
      loadedBoards[type] = false; // allow retry on tab click
      board.innerHTML =
        '<div class="ticket"><span class="name">Products load nahi ho sake. Dobara koshish karein.</span></div>';
    });
}

function showCat(cat, btn) {
  document.querySelectorAll('.cat-panel').forEach(function (p) {
    p.classList.remove('active');
  });
  document.querySelectorAll('.cat-tab').forEach(function (t) {
    t.classList.remove('active');
  });
  document.getElementById('cat-' + cat).classList.add('active');
  btn.classList.add('active');

  var typeByCat = {
    new: 'new_phone',
    used: 'used_phone',
    watches: 'smart_watch',
    tablets: 'tablet',
    accessories: 'accessory',
  };
  loadBoard(typeByCat[cat]);
}

// Load the first (default active) tab's products as soon as the page is ready.
document.addEventListener('DOMContentLoaded', function () {
  loadBoard('new_phone');
  loadBannerSlider();
  loadPromoBanner();
  loadHomeCategories();
  loadSiteSettings();
});

/* ==========================================================================
   Banner slider (Admin Panel > Banners & Slider, placement = "slider")
   ========================================================================== */
var sliderIndex = 0;
var sliderSlides = [];

function loadBannerSlider() {
  var section = document.getElementById('bannerSlider');
  var track = document.getElementById('sliderTrack');
  var dots = document.getElementById('sliderDots');
  if (!section || !track) return;

  fetch(API_BASE + '/public/banners?placement=slider')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success || !data.banners || data.banners.length === 0) return;
      sliderSlides = data.banners;

      track.innerHTML = sliderSlides.map(function (b) {
        var copy = (b.title || b.subtitle)
          ? '<div class="slide-copy">' +
            (b.title ? '<h3>' + escapeHtml(b.title) + '</h3>' : '') +
            (b.subtitle ? '<p>' + escapeHtml(b.subtitle) + '</p>' : '') +
            '</div>'
          : '';
        var img = '<img src="' + API_BASE.replace('/api', '') + b.image + '" alt="' + escapeHtml(b.title || '') + '">';
        return b.linkUrl
          ? '<a class="banner-slide" href="' + b.linkUrl + '">' + img + copy + '</a>'
          : '<div class="banner-slide">' + img + copy + '</div>';
      }).join('');

      dots.innerHTML = sliderSlides.map(function (_, i) {
        return '<button data-i="' + i + '" class="' + (i === 0 ? 'active' : '') + '"></button>';
      }).join('');

      dots.querySelectorAll('button').forEach(function (btn) {
        btn.addEventListener('click', function () {
          goToSlide(parseInt(btn.dataset.i, 10));
        });
      });

      section.style.display = sliderSlides.length ? 'block' : 'none';

      if (sliderSlides.length > 1) {
        setInterval(function () { goToSlide((sliderIndex + 1) % sliderSlides.length); }, 5000);
      }
    })
    .catch(function () { /* silently keep the slider hidden */ });
}

function goToSlide(i) {
  sliderIndex = i;
  var track = document.getElementById('sliderTrack');
  if (!track) return;
  track.style.transform = 'translateX(-' + (i * 100) + '%)';
  document.querySelectorAll('#sliderDots button').forEach(function (btn, idx) {
    btn.classList.toggle('active', idx === i);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var prev = document.getElementById('sliderPrev');
  var next = document.getElementById('sliderNext');
  if (prev) prev.addEventListener('click', function () {
    if (!sliderSlides.length) return;
    goToSlide((sliderIndex - 1 + sliderSlides.length) % sliderSlides.length);
  });
  if (next) next.addEventListener('click', function () {
    if (!sliderSlides.length) return;
    goToSlide((sliderIndex + 1) % sliderSlides.length);
  });
});

/* ==========================================================================
   Promo banner (Admin Panel > Banners & Slider, placement = "banner")
   ========================================================================== */
function loadPromoBanner() {
  var section = document.getElementById('promoBanner');
  if (!section) return;

  fetch(API_BASE + '/public/banners?placement=banner')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success || !data.banners || data.banners.length === 0) return;
      var b = data.banners[0]; // show the top (lowest sortOrder) promo banner
      var img = '<img src="' + API_BASE.replace('/api', '') + b.image + '" alt="' + escapeHtml(b.title || '') + '">';
      section.innerHTML = b.linkUrl ? '<a href="' + b.linkUrl + '">' + img + '</a>' : img;
      section.style.display = 'block';
    })
    .catch(function () { /* silently keep it hidden */ });
}

/* ==========================================================================
   Homepage categories (Admin Panel > Categories) — replaces the static
   fallback cards with real categories once they load, if any exist.
   ========================================================================== */
function loadHomeCategories() {
  var grid = document.getElementById('categoryGrid');
  if (!grid) return;

  fetch(API_BASE + '/public/categories')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success || !data.categories || data.categories.length === 0) return; // keep the static fallback cards
      grid.innerHTML = data.categories.slice(0, 8).map(function (c) {
        var iconHtml = c.image
          ? '<div class="cat-icon has-img"><img src="' + API_BASE.replace('/api', '') + c.image + '" alt="' + escapeHtml(c.name) + '"></div>'
          : '<div class="cat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="11" y1="18" x2="13" y2="18"/></svg></div>';
        return (
          '<div class="cat-card">' + iconHtml +
          '<h3>' + escapeHtml(c.name) + '</h3>' +
          '<a href="shop.html?category=' + c._id + '">Explore Now &rarr;</a>' +
          '</div>'
        );
      }).join('');
    })
    .catch(function () { /* keep the static fallback cards */ });
}

/* ==========================================================================
   Site settings (Admin Panel > Settings) — used to point the WhatsApp
   button at the real business number instead of the hardcoded placeholder.
   ========================================================================== */
function loadSiteSettings() {
  fetch(API_BASE + '/public/settings')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success || !data.settings) return;
      var s = data.settings;
      if (s.whatsappNumber) {
        var btn = document.getElementById('contactWhatsappBtn');
        if (btn) btn.href = 'https://wa.me/' + s.whatsappNumber.replace(/\D/g, '');
      }
    })
    .catch(function () { /* keep the placeholder link */ });
}

// simple countdown
var totalSec = 12 * 3600 + 45 * 60 + 30;
setInterval(function () {
  if (totalSec <= 0) return;
  totalSec--;
  var h = Math.floor(totalSec / 3600),
    m = Math.floor((totalSec % 3600) / 60),
    s = totalSec % 60;
  document.getElementById('cd-h').textContent = String(h).padStart(2, '0');
  document.getElementById('cd-m').textContent = String(m).padStart(2, '0');
  document.getElementById('cd-s').textContent = String(s).padStart(2, '0');
}, 1000);
