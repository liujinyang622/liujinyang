// server.js
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_USER = process.env.ADMIN_USER || '刘金洋';
const ADMIN_PASS = process.env.ADMIN_PASS || '51162120150806319X';
const SESSION_SECRET = process.env.SESSION_SECRET || 'replace_with_secure_secret';

app.use(bodyParser.json({ limit: '15mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 24 * 3600 * 1000 }
}));

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// 初始化 SQLite 数据库
const DB_FILE = path.join(__dirname, 'db.sqlite3');
const db = new sqlite3.Database(DB_FILE);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    name TEXT,
    contact_type TEXT,
    contact_value TEXT,
    teacher TEXT,
    image_path TEXT,
    created_at INTEGER,
    status TEXT,
    qr_path TEXT
  )`);
});

// HTML 转义
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, function (m) {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
  });
}

// 检查同名并标记异常
function updateDuplicateStatus(name, callback) {
  db.all(`SELECT id FROM cards WHERE name = ? AND status != 'deleted'`, [name], (err, rows) => {
    if (err) return callback(err);
    if (rows.length >= 2) {
      const ids = rows.map(r => r.id);
      const placeholders = ids.map(()=>'?').join(',');
      db.run(`UPDATE cards SET status = 'exception' WHERE id IN (${placeholders})`, ids, callback);
    } else if (rows.length === 1) {
      db.run(`UPDATE cards SET status = 'normal' WHERE id = ?`, [rows[0].id], callback);
    } else callback(null);
  });
}

// API: 保存卡片（接收前端 dataURL 图片）
app.post('/api/cards', (req, res) => {
  const { name, contact_type, contact_value, teacher, imageData } = req.body;
  if (!name || !contact_type || !contact_value || !teacher || !imageData) {
    return res.status(400).json({ error: '参数不完整' });
  }
  const id = uuidv4();
  const filename = `${id}.png`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFile(filePath, buffer, (err) => {
    if (err) return res.status(500).json({ error: '保存图片失败' });
    const createdAt = Date.now();
    const qrPath = `/card/${id}`;
    db.run(`INSERT INTO cards (id,name,contact_type,contact_value,teacher,image_path,created_at,status,qr_path)
            VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, name, contact_type, contact_value, teacher, `/uploads/${filename}`, createdAt, 'normal', qrPath],
      (err2) => {
        if (err2) return res.status(500).json({ error: '数据库写入失败' });
        updateDuplicateStatus(name, (uerr) => {
          if (uerr) console.error('updateDuplicateStatus', uerr);
          res.json({ success: true, id });
        });
      });
  });
});

// 提供 uploads 静态文件
app.use('/uploads', express.static(UPLOAD_DIR));

// 前端扫码访问的卡片页面
app.get('/card/:id', (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
    if (err || !row) {
      return res.send(`<h2>二维码无效或不存在</h2>`);
    }
    if (row.status === 'deleted') {
      return res.send(`<h2>二维码已失效（已删除）</h2>`);
    }
    if (row.status === 'exception') {
      return res.send(`<h2>该卡片被标记为异常，请联系管理员</h2>`);
    }
    res.send(`
      <div style="font-family: Arial; padding:20px;">
        <h2>学生自助返校系统 卡片信息</h2>
        <p><strong>姓名：</strong>${escapeHtml(row.name)}</p>
        <p><strong>联系方式类型：</strong>${escapeHtml(row.contact_type)}</p>
        <p><strong>联系方式：</strong>${escapeHtml(row.contact_value)}</p>
        <p><strong>小学班主任：</strong>${escapeHtml(row.teacher)}</p>
        <p><img src="${row.image_path}" style="max-width:320px; border:1px solid #ccc;" /></p>
      </div>
    `);
  });
});

// 管理登录
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: '用户名或密码错误' });
  }
});

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: '未登录' });
}

// 获取所有卡片
app.get('/api/admin/cards', requireAdmin, (req, res) => {
  db.all(`SELECT * FROM cards ORDER BY created_at DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: '查询失败' });
    res.json({ cards: rows });
  });
});

// 删除（标记 deleted）
app.post('/api/admin/cards/:id/delete', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '未找到卡片' });
    db.run(`UPDATE cards SET status = 'deleted' WHERE id = ?`, [id], (uerr) => {
      if (uerr) return res.status(500).json({ error: '删除失败' });
      res.json({ success: true });
    });
  });
});

// 恢复
app.post('/api/admin/cards/:id/restore', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '未找到卡片' });
    db.run(`UPDATE cards SET status = 'normal' WHERE id = ?`, [id], (uerr) => {
      if (uerr) return res.status(500).json({ error: '恢复失败' });
      updateDuplicateStatus(row.name, (derr) => {
        if (derr) console.error(derr);
        res.json({ success: true });
      });
    });
  });
});

// 标为异常
app.post('/api/admin/cards/:id/mark-exception', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.run(`UPDATE cards SET status = 'exception' WHERE id = ?`, [id], (err) => {
    if (err) return res.status(500).json({ error: '操作失败' });
    res.json({ success: true });
  });
});

// 标为正常
app.post('/api/admin/cards/:id/mark-normal', requireAdmin, (req, res) => {
  const id = req.params.id;
  db.get(`SELECT * FROM cards WHERE id = ?`, [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '未找到卡片' });
    db.run(`UPDATE cards SET status = 'normal' WHERE id = ?`, [id], (uerr) => {
      if (uerr) return res.status(500).json({ error: '操作失败' });
      updateDuplicateStatus(row.name, (derr) => {
        if (derr) console.error(derr);
        res.json({ success: true });
      });
    });
  });
});

// 管理登出
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

