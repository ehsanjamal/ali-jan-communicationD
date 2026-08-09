/* ==========================================================================
   Ali Jan Communication — WhatsApp Order Helper
   Shared by shop.js and product.js. Builds a pre-filled WhatsApp message
   with the product's name and price, and opens it against the real
   business number from Admin Panel > Settings (falls back to the number
   already used on the homepage contact section if settings can't load).
   ========================================================================== */

var siteWhatsappNumber = '923001234567'; // fallback — replaced once /public/settings loads

function loadWhatsappNumber() {
  fetch(API_BASE + '/public/settings')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.success && data.settings && data.settings.whatsappNumber) {
        siteWhatsappNumber = data.settings.whatsappNumber.replace(/\D/g, '');
      }
    })
    .catch(function () { /* keep the fallback number */ });
}

function moneyFmtWA(n) {
  return 'Rs. ' + Number(n).toLocaleString('en-PK');
}

// Builds the WhatsApp deep link for ordering a specific product.
function buildWhatsappOrderUrl(product) {
  var price = (product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price)
    ? product.discountPrice
    : product.price;

  var lines = [
    'Assalam-o-Alaikum, mujhe ye product order karna hai:',
    '',
    '📱 ' + product.name,
    '💰 Price: ' + moneyFmtWA(price),
  ];

  if (product.slug) {
    lines.push('🔗 ' + window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'product.html?slug=' + product.slug);
  }

  lines.push('', 'Please confirm availability. Shukriya!');

  var message = encodeURIComponent(lines.join('\n'));
  return 'https://wa.me/' + siteWhatsappNumber + '?text=' + message;
}

document.addEventListener('DOMContentLoaded', loadWhatsappNumber);
