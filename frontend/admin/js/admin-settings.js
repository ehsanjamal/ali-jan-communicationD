document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');
  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  const authHeaders = () => ({ Authorization: `Bearer ${token}` });

  // ---------- Session check (same pattern as other admin pages) ----------
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
  const msgBox = document.getElementById('settingsMsg');
  const form = document.getElementById('settingsForm');
  const formError = document.getElementById('formError');
  const saveBtn = document.getElementById('saveBtn');

  const showMsg = (text, isError = false) => {
    msgBox.textContent = text;
    msgBox.className = isError ? 'products-msg show error' : 'products-msg show';
    setTimeout(() => { msgBox.className = 'products-msg'; }, 3000);
  };

  const fill = (settings) => {
    document.getElementById('f_siteName').value = settings.siteName || '';
    document.getElementById('f_contactPhone').value = settings.contactPhone || '';
    document.getElementById('f_contactEmail').value = settings.contactEmail || '';
    document.getElementById('f_whatsappNumber').value = settings.whatsappNumber || '';
    document.getElementById('f_isStoreOpen').value = settings.isStoreOpen === false ? 'false' : 'true';
    document.getElementById('f_address').value = settings.address || '';
    const social = settings.socialLinks || {};
    document.getElementById('f_facebook').value = social.facebook || '';
    document.getElementById('f_instagram').value = social.instagram || '';
    document.getElementById('f_tiktok').value = social.tiktok || '';
    document.getElementById('f_youtube').value = social.youtube || '';
    document.getElementById('f_warrantyPolicy').value = settings.warrantyPolicy || '';
    document.getElementById('f_ptaPolicyInfo').value = settings.ptaPolicyInfo || '';
  };

  // ---------- Load current settings ----------
  const loadSettings = async () => {
    try {
      const res = await fetch(`${ADMIN_API_BASE}/settings`, { headers: authHeaders(), credentials: 'include' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to load settings');
      fill(data.settings);
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    }
  };

  // ---------- Save settings ----------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.remove('show');
    formError.textContent = '';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const payload = {
      siteName: document.getElementById('f_siteName').value.trim(),
      contactPhone: document.getElementById('f_contactPhone').value.trim(),
      contactEmail: document.getElementById('f_contactEmail').value.trim(),
      whatsappNumber: document.getElementById('f_whatsappNumber').value.trim(),
      isStoreOpen: document.getElementById('f_isStoreOpen').value === 'true',
      address: document.getElementById('f_address').value.trim(),
      socialLinks: {
        facebook: document.getElementById('f_facebook').value.trim(),
        instagram: document.getElementById('f_instagram').value.trim(),
        tiktok: document.getElementById('f_tiktok').value.trim(),
        youtube: document.getElementById('f_youtube').value.trim(),
      },
      warrantyPolicy: document.getElementById('f_warrantyPolicy').value.trim(),
      ptaPolicyInfo: document.getElementById('f_ptaPolicyInfo').value.trim(),
    };

    try {
      const res = await fetch(`${ADMIN_API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to save settings');
      fill(data.settings);
      showMsg('Settings saved successfully.');
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.add('show');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Settings';
    }
  });

  loadSettings();
});
