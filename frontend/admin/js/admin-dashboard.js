document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('ajc_admin_token');

  if (!token) {
    window.location.href = 'admin-login.html';
    return;
  }

  try {
    const res = await fetch(`${ADMIN_API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error('Session expired');
    }

    const admin = data.admin;
    document.getElementById('adminName').textContent = admin.name;
    document.getElementById('adminRole').textContent = admin.role;
    document.getElementById('adminAvatar').textContent = admin.name.charAt(0).toUpperCase();
    document.getElementById('welcomeHeading').textContent = `Welcome back, ${admin.name.split(' ')[0]}`;

    // Total Products stat (best-effort — ignore failures)
    try {
      const pRes = await fetch(`${ADMIN_API_BASE}/products?limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const pData = await pRes.json();
      if (pRes.ok && pData.success) {
        const card = document.querySelector('.admin-stat-card .value');
        const note = document.querySelector('.admin-stat-card .note');
        if (card) card.textContent = pData.pagination.total;
        if (note) note.textContent = 'Live count';
      }
    } catch (e) {
      // ignore — stat card just stays as "—"
    }
  } catch (err) {
    localStorage.removeItem('ajc_admin_token');
    localStorage.removeItem('ajc_admin_info');
    window.location.href = 'admin-login.html';
    return;
  }

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await fetch(`${ADMIN_API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      // even if the request fails, clear local session
    }
    localStorage.removeItem('ajc_admin_token');
    localStorage.removeItem('ajc_admin_info');
    window.location.href = 'admin-login.html';
  });

  // Placeholder nav items just show they're not built yet
  document.querySelectorAll('.admin-nav-item.soon-item').forEach((item) => {
    item.addEventListener('click', () => {
      alert('This section will be built in an upcoming step.');
    });
  });
});
