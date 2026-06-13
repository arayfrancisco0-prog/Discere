const API_BASE = '';

async function api(path, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  };
  if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body);
  const res = await fetch(`${API_BASE}${path}`, config);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro na requisição');
  }
  return res.json();
}

function toast(message, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = message;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');
  return d.toLocaleDateString('pt-BR');
}

let adminUser = null;

async function checkAuth() {
  try {
    const data = await api('/api/auth/check');
    adminUser = data.admin;
    return adminUser;
  } catch {
    window.location.href = '/login.html';
    return null;
  }
}

function logout() {
  api('/api/auth/logout', { method: 'POST' });
  window.location.href = '/login.html';
}
