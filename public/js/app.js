let currentUser = null;

async function checkAuth() {
  try {
    const data = await api('/api/auth/me');
    currentUser = data.user;
    renderSidebar();
    updatePublicHeader();
    return data.user;
  } catch {
    currentUser = null;
    renderSidebar();
    updatePublicHeader();
    return null;
  }
}

function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  if (!currentUser) { sidebar.innerHTML = ''; return; }

  const navItems = [
    { href: '/dashboard.html', icon: '📊', label: 'Painel', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
    { href: '/courses.html', icon: '📚', label: 'Cursos', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
    { href: '/badges.html', icon: '🏆', label: 'Conquistas', roles: ['STUDENT', 'TEACHER'] },
    { href: '/notifications.html', icon: '🔔', label: 'Notificações', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
    { href: '/profile.html', icon: '👤', label: 'Perfil', roles: ['STUDENT', 'TEACHER', 'ADMIN'] },
    { href: '/teacher-dashboard.html', icon: '📝', label: 'Professor', roles: ['TEACHER'] },
  ];

  const currentPath = window.location.pathname;
  const initial = getInitials(currentUser.name);

  sidebar.innerHTML = `
    <a href="/" class="sidebar-logo">Discere</a>
    <nav class="sidebar-nav">
      ${navItems.filter(n => n.roles.includes(currentUser.role)).map(n => `
        <a href="${n.href}" class="${currentPath === n.href ? 'active' : ''}">${n.icon} ${n.label}</a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">👤 ${escapeHtml(currentUser.name)}</div>
      <button onclick="logout()">🚪 Sair</button>
    </div>
  `;
}

function updatePublicHeader() {
  const authArea = document.getElementById('auth-area');
  if (!authArea) return;
  if (currentUser) {
    const initial = getInitials(currentUser.name);
    authArea.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:6px;border:1px solid var(--border);">
        <span style="width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;color:white;">${initial}</span>
        <a href="/dashboard.html" style="color:var(--fg);font-size:0.9rem;">${escapeHtml(currentUser.name.split(' ')[0])}</a>
      </div>`;
    const mobile = document.getElementById('auth-area-mobile');
    if (mobile) mobile.innerHTML = `<a href="/dashboard.html" style="color:var(--fg);">Painel</a><button onclick="logout()" style="background:none;border:none;color:var(--danger);font-family:var(--font);cursor:pointer;">Sair</button>`;
  } else {
    authArea.innerHTML = `<a href="/login.html" class="btn btn-ghost btn-sm" style="padding:6px 12px;">Entrar</a><a href="/register.html" class="btn btn-primary btn-sm" style="padding:6px 12px;">Cadastrar</a>`;
    const mobile = document.getElementById('auth-area-mobile');
    if (mobile) mobile.innerHTML = `<a href="/login.html">Entrar</a><a href="/register.html">Cadastrar</a>`;
  }
}

async function logout() {
  await api('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  window.location.href = '/';
}

function toggleMobileMenu() {
  const m = document.getElementById('nav-mobile');
  if (m) m.style.display = m.style.display === 'none' ? 'flex' : 'none';
}
