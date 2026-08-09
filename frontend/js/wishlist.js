/* ==========================================================================
   Ali Jan Communication — Wishlist Helper (localStorage based, no backend)
   Shared by shop.js, product.js, and wishlist.html. Stores a small snapshot
   of each saved product (slug, name, price, discountPrice, image) so the
   wishlist page can render without extra API calls.
   ========================================================================== */

var WISHLIST_KEY = 'ajc_wishlist';

function getWishlist() {
  try {
    var raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveWishlist(list) {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  } catch (e) { /* storage unavailable — ignore */ }
}

function isInWishlist(slug) {
  return getWishlist().some(function (item) { return item.slug === slug; });
}

// product: { slug, name, price, discountPrice, images }
function addToWishlist(product) {
  var list = getWishlist();
  if (list.some(function (item) { return item.slug === product.slug; })) return;
  list.push({
    slug: product.slug,
    name: product.name,
    price: product.price,
    discountPrice: product.discountPrice || null,
    image: (product.images && product.images[0]) || null,
  });
  saveWishlist(list);
  updateWishlistCount();
}

function removeFromWishlist(slug) {
  var list = getWishlist().filter(function (item) { return item.slug !== slug; });
  saveWishlist(list);
  updateWishlistCount();
}

function toggleWishlist(product) {
  if (isInWishlist(product.slug)) {
    removeFromWishlist(product.slug);
    return false;
  }
  addToWishlist(product);
  return true;
}

function updateWishlistCount() {
  var count = getWishlist().length;
  document.querySelectorAll('[data-wishlist-count]').forEach(function (el) {
    el.textContent = count;
  });
}

document.addEventListener('DOMContentLoaded', updateWishlistCount);
