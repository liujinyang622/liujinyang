// public/js/admin.js
async function api(path, opts = {}) {
  const res = await fetch(path, opts);
  if (res.status === 401) throw new Error('未登录');
  return res.json();
}

document.getElementById('loginBtn').addEventListener('click', async () => {
  const user = document.getElementById('adminUser').value;
  const pass = document.getElementById('adminPass').value;
  try {
    const r = await api('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass })
    });
    if (r.success) {
      document.getElementById('loginBox').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      loadCards();
    } else {
      document.getElementById('loginMsg').textContent = '登录失败';
    }
  } catch (e) {
    document.getElementById('loginMsg').textContent = '登录失败';
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  location.reload();
});

async function loadCards() {
  try {
    const data = await api('/api/admin/cards');
    const tbody = document.querySelector('#cardsTable tbody');
    tbody.innerHTML = '';
    data.cards.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><img src="${c.image_path}" /></td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.contact_type)}: ${escapeHtml(c.contact_value)}</td>
        <td>${escapeHtml(c.teacher)}</td>
        <td>${escapeHtml(c.status)}</td>
        <td>
          ${c.status !== 'deleted' ? `<button data-id="${c.id}" class="delBtn">删除</button>` : `<button data-id="${c.id}" class="restoreBtn">恢复</button>`}
          <button data-id="${c.id}" class="markExceptionBtn">标为异常</button>
          <button data-id="${c.id}" class="markNormalBtn">标为正常</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.delBtn').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await api(`/api/admin/cards/${id}/delete`, { method: 'POST' });
      loadCards();
    }));
    document.querySelectorAll('.restoreBtn').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await api(`/api/admin/cards/${id}/restore`, { method: 'POST' });
      loadCards();
    }));
    document.querySelectorAll('.markExceptionBtn').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await api(`/api/admin/cards/${id}/mark-exception`, { method: 'POST' });
      loadCards();
    }));
    document.querySelectorAll('.markNormalBtn').forEach(b => b.addEventListener('click', async (e) => {
      const id = e.target.dataset.id;
      await api(`/api/admin/cards/${id}/mark-normal`, { method: 'POST' });
      loadCards();
    }));
  } catch (e) {
    alert('加载失败，可能未登录');
    location.reload();
  }
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}
