/* ==========================================================================
   Ali Jan Communication — Wishlist Page Script
   Renders the saved items from localStorage (via wishlist.js), with a
   Remove button and a WhatsApp order button per item. No backend calls.
   ========================================================================== */

function escapeHtmlWl(str) {
  var div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function moneyFmtWl(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-PK');
}

function renderWishlistCard(item) {
  var imgBase = API_BASE.replace('/api', '');
  var img = item.image
    ? '<img src="' + imgBase + item.image + '" alt="' + escapeHtmlWl(item.name) + '">'
    : '<span class="no-img">No Image</span>';

  var priceHtml = (item.discountPrice && item.discountPrice > 0 && item.discountPrice < item.price)
    ? '<span class="now">' + moneyFmtWl(item.discountPrice) + '</span><span class="old">' + moneyFmtWl(item.price) + '</span>'
    : '<span class="now">' + moneyFmtWl(item.price) + '</span>';

  return (
    '<div class="product-card">' +
      '<a class="pc-img" href="product.html?slug=' + item.slug + '">' + img + '</a>' +
      '<div class="pc-body">' +
        '<a href="product.html?slug=' + item.slug + '" class="pc-name">' + escapeHtmlWl(item.name) + '</a>' +
        '<div class="pc-price">' + priceHtml + '</div>' +
        '<div class="pc-actions">' +
          '<button class="pc-btn pc-wa" data-order-btn data-slug="' + item.slug + '">WhatsApp</button>' +
          '<button class="pc-btn" data-remove-btn data-slug="' + item.slug + '">Remove</button>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function renderWishlist() {
  var list = getWishlist();
  var grid = document.getElementById('wishlistGrid');
  var countEl = document.getElementById('wishlistCount');

  if (!list.length) {
    grid.innerHTML = '<div class="shop-empty">Aapki wishlist khali hai. <a href="shop.html">Shop karein</a> aur pasandeeda products save karein.</div>';
    countEl.textContent = '';
    return;
  }

  countEl.textContent = list.length + ' item' + (list.length === 1 ? '' : 's') + ' saved';
  grid.innerHTML = list.map(renderWishlistCard).join('');

  document.querySelectorAll('[data-order-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = list.find(function (x) { return x.slug === btn.dataset.slug; });
      if (!item) return;
      window.open(buildWhatsappOrderUrl(item), '_blank');
    });
  });

  document.querySelectorAll('[data-remove-btn]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      removeFromWishlist(btn.dataset.slug);
      renderWishlist();
    });
  });
}

document.addEventListener('DOMContentLoaded', renderWishlist);
