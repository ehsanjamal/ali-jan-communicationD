document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, skip straight to the dashboard
  const existingToken = localStorage.getItem('ajc_admin_token');
  if (existingToken) {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const errorBox = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginBtn');

  const showError = (message) => {
    errorBox.textContent = message;
    errorBox.classList.add('show');
  };

  const hideError = () => {
    errorBox.classList.remove('show');
    errorBox.textContent = '';
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showError('Please enter both email and password.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';

    try {
      const res = await fetch(`${ADMIN_API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('ajc_admin_token', data.token);
      localStorage.setItem('ajc_admin_info', JSON.stringify(data.admin));

      window.location.href = 'admin-dashboard.html';
    } catch (err) {
      showError(err.message || 'Something went wrong. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }
  });
});
