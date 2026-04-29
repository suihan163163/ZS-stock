/* ============================================================
 * 依赖引入 & 初始化
 * ============================================================ */
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8092;
const JWT_SECRET = process.env.JWT_SECRET || 'wzsp_jwt_secret_2026';

/* ============================================================
 * 中间件配置
 * ============================================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

/* ============================================================
 * 用户数据辅助函数 (users.json)
 * ============================================================ */
/* ============================================================
 * 数据文件路径
 * ============================================================ */
const USERS_FILE = path.join(__dirname, 'users.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

/* ============================================================
 * 初始化 orders.json
 * ============================================================ */
function initOrdersFile() {
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify({ orders: [], nextId: 1 }, null, 2), 'utf8');
  }
}
initOrdersFile();

function loadOrders() {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { orders: [], nextId: 1 };
  }
}

function saveOrders(data) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function loadUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      const defaultData = { users: [], nextId: 1 };
      fs.writeFileSync(USERS_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch (e) {
    return { users: [], nextId: 1 };
  }
}

function saveUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, phone: user.phone, countryCode: user.countryCode, role: user.role || 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/* ============================================================
 * 图片上传配置 (multer)
 * ============================================================ */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    cb(null, imagesDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `upload_${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const fileTypes = /jpeg|jpg|png|gif/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只接受图片文件 (jpeg, jpg, png, gif)'));
    }
  }
});

/* ============================================================
 * API 路由 — 图片上传
 * ============================================================ */
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有文件上传' });
    }
    const imagePath = `/images/${req.file.filename}`;
    res.status(200).json({
      success: true,
      message: '图片上传成功',
      imagePath: imagePath
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

/* ============================================================
 * API 路由 — 产品数据保存
 * ============================================================ */
app.post('/products.json', (req, res) => {
  try {
    fs.writeFileSync('./products.json', JSON.stringify(req.body, null, 2), 'utf8');
    res.status(200).json({ success: true, message: '数据保存成功' });
  } catch (error) {
    console.error('保存数据错误:', error);
    res.status(500).json({ success: false, message: '保存数据失败' });
  }
});

/* ============================================================
 * SMTP 邮件发送配置（预留，可在云服务器上配置环境变量）
 * ============================================================ */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'noreply@example.com',
    pass: process.env.SMTP_PASS || 'smtp_password'
  }
});

function sendResetEmail(email, resetLink) {
  return transporter.sendMail({
    from: `"WZSP Official" <${process.env.SMTP_USER || 'noreply@example.com'}>`,
    to: email,
    subject: '🔐 WZSP - Password Reset Request',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.08)">
        <h2 style="color:#0B3C6A;margin:0 0 16px">Password Reset Request</h2>
        <p style="color:#444;line-height:1.6">Hi there,</p>
        <p style="color:#444;line-height:1.6">We received a request to reset your password for your WZSP account. Click the button below to set a new password:</p>
        <div style="text-align:center;margin:28px 0">
          <a href="${resetLink}" style="display:inline-block;padding:14px 32px;background:#0B3C6A;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">Reset Password</a>
        </div>
        <p style="color:#888;font-size:13px;line-height:1.6">This link will expire in <strong>1 hour</strong>. If you didn't request this, please ignore this email.</p>
        <p style="color:#888;font-size:13px;margin-top:24px;border-top:1px solid #eee;padding-top:16px">WZSP Industrial Wholesale Team</p>
      </div>
    `
  });
}
/* ============================================================
 * API 路由 — 用户注册（邮箱 + 手机号 + 密保问题）
 * ============================================================ */
app.post('/api/register', async (req, res) => {
  try {
    const { email, phone, countryCode, password, securityQuestion, securityAnswer } = req.body;
    if (!email || !phone || !countryCode || !password) {
      return res.status(400).json({ success: false, message: '请填写完整的注册信息' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少为6位' });
    }
    if (securityQuestion && !securityAnswer) {
      return res.status(400).json({ success: false, message: '请填写密保问题答案' });
    }

    const usersData = loadUsers();
    const emailExists = usersData.users.find(u => u.email === email);
    if (emailExists) {
      return res.status(409).json({ success: false, message: '该邮箱已注册' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = {
      id: usersData.nextId,
      email: email,
      phone: phone,
      countryCode: countryCode,
      password: hashedPassword,
      securityQuestion: securityQuestion || '',
      securityAnswer: securityAnswer ? securityAnswer.toLowerCase().trim() : '',
      role: 'user',
      resetToken: null,
      resetTokenExpiry: null,
      createdAt: new Date().toISOString()
    };
    usersData.users.push(newUser);
    usersData.nextId += 1;
    saveUsers(usersData);

    const token = signToken(newUser);
    res.status(201).json({
      success: true,
      message: '注册成功',
      token: token,
      user: { id: newUser.id, email: newUser.email, phone: newUser.phone, countryCode: newUser.countryCode, role: newUser.role }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ success: false, message: '注册失败，请稍后重试' });
  }
});

/* ============================================================
 * API 路由 — 用户登录（邮箱 + 密码）
 * ============================================================ */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: '请填写邮箱和密码' });
    }

    const usersData = loadUsers();
    const user = usersData.users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ success: false, message: '邮箱未注册' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '密码错误' });
    }

    const token = signToken(user);
    res.status(200).json({
      success: true,
      message: '登录成功',
      token: token,
      user: { id: user.id, email: user.email, phone: user.phone, countryCode: user.countryCode, role: user.role }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, message: '登录失败，请稍后重试' });
  }
});

/* ============================================================
 * API 路由 — 获取用户密保问题（用于密码找回验证）
 * ============================================================ */
app.post('/api/get-security-question', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: '请输入邮箱' });
    }

    const usersData = loadUsers();
    const user = usersData.users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ success: false, message: '邮箱未注册' });
    }
    if (!user.securityQuestion) {
      return res.status(400).json({ success: false, message: '该账号未设置密保问题，请联系客服' });
    }

    res.status(200).json({
      success: true,
      securityQuestion: user.securityQuestion
    });
  } catch (error) {
    console.error('获取密保问题失败:', error);
    res.status(500).json({ success: false, message: '获取失败，请稍后重试' });
  }
});

/* ============================================================
 * API 路由 — 忘记密码（发送重置邮件）
 * ============================================================ */
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email, securityAnswer } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: '请输入邮箱地址' });
    }

    const usersData = loadUsers();
    const user = usersData.users.find(u => u.email === email);
    if (!user) {
      return res.status(200).json({
        success: true,
        message: '如果该邮箱已注册，重置链接已发送到您的邮箱'
      });
    }

    if (user.securityAnswer && securityAnswer) {
      if (user.securityAnswer !== securityAnswer.toLowerCase().trim()) {
        return res.status(401).json({ success: false, message: '密保答案不正确' });
      }
    } else if (user.securityQuestion) {
      return res.status(400).json({ success: false, message: '需要验证密保问题' });
    }

    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600 * 1000;

    const userIdx = usersData.users.findIndex(u => u.email === email);
    usersData.users[userIdx].resetToken = resetToken;
    usersData.users[userIdx].resetTokenExpiry = resetTokenExpiry;
    saveUsers(usersData);

    const resetLink = `http://localhost:${PORT}/reset-password.html?token=${resetToken}`;

    try {
      await sendResetEmail(email, resetLink);
      res.status(200).json({
        success: true,
        message: '重置链接已发送到您的邮箱，请在1小时内点击链接重置密码'
      });
    } catch (emailError) {
      console.error('邮件发送失败:', emailError);
      res.status(200).json({
        success: true,
        message: `重置令牌已生成（开发模式）。重置链接: ${resetLink}`,
        resetLink: resetLink
      });
    }
  } catch (error) {
    console.error('忘记密码请求失败:', error);
    res.status(500).json({ success: false, message: '请求失败，请稍后重试' });
  }
});

/* ============================================================
 * API 路由 — 重置密码（通过 token）
 * ============================================================ */
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: '请提供重置令牌和新密码' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '密码长度至少为6位' });
    }

    const usersData = loadUsers();
    const user = usersData.users.find(u => u.resetToken === token && u.resetTokenExpiry > Date.now());
    if (!user) {
      return res.status(400).json({ success: false, message: '重置链接已失效或无效，请重新申请' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const userIdx = usersData.users.findIndex(u => u.resetToken === token);
    usersData.users[userIdx].password = hashedPassword;
    usersData.users[userIdx].resetToken = null;
    usersData.users[userIdx].resetTokenExpiry = null;
    saveUsers(usersData);

    res.status(200).json({
      success: true,
      message: '密码重置成功，请使用新密码登录'
    });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ success: false, message: '重置失败，请稍后重试' });
  }
});

/* ============================================================
 * JWT 认证中间件
 * ============================================================ */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : req.query.token;
  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(403).json({ success: false, message: 'Token 无效或已过期' });
  }
}

/* ============================================================
 * 业务接口 — 询价单 / 订单系统
 * ============================================================ */

/* POST /api/inquiries — 提交询价单（需登录） */
app.post('/api/inquiries', authenticateToken, (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: '请至少添加一件商品到询价单' });
    }

    const ordersData = loadOrders();
    const newOrder = {
      id: ordersData.nextId,
      userId: req.user.id,
      userEmail: req.user.email,
      userPhone: req.user.phone || '',
      items: items,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    ordersData.orders.push(newOrder);
    ordersData.nextId += 1;
    saveOrders(ordersData);

    res.status(201).json({
      success: true,
      message: '询价单已提交',
      order: newOrder
    });
  } catch (error) {
    console.error('提交询价单失败:', error);
    res.status(500).json({ success: false, message: '提交失败，请稍后重试' });
  }
});

/* GET /api/inquiries — 获取询价单列表（需登录） */
app.get('/api/inquiries', authenticateToken, (req, res) => {
  try {
    const ordersData = loadOrders();

    if (req.user.role === 'admin') {
      /* 管理员查看所有询价单 */
      return res.status(200).json({
        success: true,
        data: ordersData.orders,
        total: ordersData.orders.length
      });
    } else {
      /* 普通用户仅查看自己的询价单 */
      const userOrders = ordersData.orders.filter(o => o.userId === req.user.id);
      return res.status(200).json({
        success: true,
        data: userOrders,
        total: userOrders.length
      });
    }
  } catch (error) {
    console.error('获取询价单失败:', error);
    res.status(500).json({ success: false, message: '获取失败，请稍后重试' });
  }
});

/* GET /api/users — 获取用户列表（仅管理员） */
app.get('/api/users', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权访问此接口' });
    }

    const usersData = loadUsers();
    /* 过滤掉敏感信息 */
    const safeUsers = usersData.users.map(u => ({
      id: u.id,
      email: u.email,
      phone: u.phone || '',
      countryCode: u.countryCode || '+86',
      role: u.role || 'user',
      createdAt: u.createdAt || '',
      securityQuestion: u.securityQuestion || ''
    }));

    res.status(200).json({
      success: true,
      data: safeUsers,
      total: safeUsers.length
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ success: false, message: '获取失败，请稍后重试' });
  }
});

/* ============================================================
 * API 路由 — 外链图片下载转存
 * ============================================================ */
app.post('/api/fetch-image', async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, message: '缺少图片路径' });
  }

  const imagesDir = path.join(__dirname, 'images');
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }

  const isHttp = /^https?:\/\//i.test(url);
  const isLocal = /^file:\/\/\//i.test(url) || /^[A-Za-z]:[\\\/]/.test(url);

  if (isHttp) {
    try {
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 15000,
        maxContentLength: 10 * 1024 * 1024,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      });

      const contentType = response.headers['content-type'] || '';
      const extMap = {
        'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png',
        'image/gif': '.gif', 'image/webp': '.webp', 'image/bmp': '.bmp'
      };
      const ext = extMap[contentType.split(';')[0].trim().toLowerCase()] || '.jpg';

      const filename = `upload_${Date.now()}${ext}`;
      const filePath = path.join(imagesDir, filename);
      fs.writeFileSync(filePath, response.data);

      res.status(200).json({ success: true, imagePath: `/images/${filename}` });
    } catch (error) {
      console.warn(`[fetch-image] 网络下载失败: ${url} - ${error.message}`);
      res.status(200).json({ success: false, imagePath: '/images/default.jpg' });
    }
  } else if (isLocal) {
    try {
      let localPath = url;
      if (/^file:\/\/\//i.test(localPath)) {
        localPath = localPath.replace(/^file:\/\/\//i, '');
        localPath = decodeURIComponent(localPath);
        localPath = localPath.replace(/\//g, path.sep);
        if (/^[A-Za-z]\//.test(localPath)) {
          localPath = localPath[0] + ':' + localPath.slice(1);
        }
      }

      if (!fs.existsSync(localPath)) {
        console.warn(`[fetch-image] 本地文件不存在: ${localPath}`);
        return res.status(200).json({ success: false, imagePath: '/images/default.jpg' });
      }

      const extMap = { '.jpg': '.jpg', '.jpeg': '.jpg', '.png': '.png', '.gif': '.gif', '.webp': '.webp', '.bmp': '.bmp', '.svg': '.svg' };
      const originalExt = path.extname(localPath).toLowerCase();
      const ext = extMap[originalExt] || '.jpg';

      const filename = `upload_${Date.now()}${ext}`;
      const destPath = path.join(imagesDir, filename);
      fs.copyFileSync(localPath, destPath);

      console.log(`[fetch-image] 本地拷贝成功: ${localPath} -> ${destPath}`);
      res.status(200).json({ success: true, imagePath: `/images/${filename}` });
    } catch (error) {
      console.warn(`[fetch-image] 本地拷贝失败: ${url} - ${error.message}`);
      res.status(200).json({ success: false, imagePath: '/images/default.jpg' });
    }
  } else {
    res.status(400).json({ success: false, message: '无法识别的图片路径格式' });
  }
});

/* ============================================================
 * API 路由 — 批量上传 Excel 模板下载（含级联下拉）
 * ============================================================ */
app.get('/api/template', async (req, res) => {
  try {
    let categories = {};
    let tags = [];

    const productsPath = path.join(__dirname, 'products.json');
    if (fs.existsSync(productsPath)) {
      const raw = fs.readFileSync(productsPath, 'utf8');
      const data = JSON.parse(raw);
      if (data.categories && typeof data.categories === 'object') {
        categories = data.categories;
      }
      if (Array.isArray(data.tags)) {
        tags = data.tags;
      }
    }

    const c1List = Object.keys(categories);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'WZSP Admin';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Products', {
      properties: { defaultColWidth: 20 }
    });

    const headerRow = [
      '产品名称', '型号', '规格', '起订量', '描述',
      '一级分类', '二级分类', '三级分类', '标签', '图片路径'
    ];
    const header = ws.addRow(headerRow);
    header.eachCell((cell) => {
      cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B3C6A' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });
    ws.getRow(1).height = 28;

    const maxRows = 1000;
    for (let i = 2; i <= maxRows + 1; i++) {
      const row = ws.addRow(['', '', '', '', '', '', '', '', '', '']);
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
      });
    }

    // --- RefData hidden sheet for cascading dropdowns ---
    const refWs = workbook.addWorksheet('RefData');
    refWs.state = 'veryHidden';

    // Column A: all level-1 categories (source for level-1 dropdown)
    refWs.getCell(1, 1).value = '一级分类';
    c1List.forEach((c1, i) => {
      refWs.getCell(i + 2, 1).value = c1;
    });
    refWs.getColumn(1).width = 28;

    let colIdx = 2;

    // For each level-1 category: a column with its level-2 children
    // Named range name = category name with spaces replaced by underscores
    for (const c1 of c1List) {
      const c2List = Object.keys(categories[c1] || {});
      const c1Name = c1.replace(/ /g, '_');
      const col = colIdx;
      refWs.getCell(1, col).value = c1Name;

      if (c2List.length > 0) {
        c2List.forEach((c2, i) => {
          refWs.getCell(i + 2, col).value = c2;
        });
        workbook.definedNames.add(`RefData!$${colLetter(col)}$2:$${colLetter(col)}$${c2List.length + 1}`, c1Name);
      } else {
        workbook.definedNames.add(`RefData!$${colLetter(col)}$2:$${colLetter(col)}$2`, c1Name);
      }
      refWs.getColumn(col).width = 22;
      colIdx++;
    }

    // For each level-2 category: a column with its level-3 children
    // Named range name = category name with spaces replaced by underscores
    for (const c1 of c1List) {
      const c2List = Object.keys(categories[c1] || {});
      for (const c2 of c2List) {
        const c3List = categories[c1][c2] || [];
        const c2Name = c2.replace(/ /g, '_');
        const col = colIdx;
        refWs.getCell(1, col).value = c2Name;

        if (c3List.length > 0) {
          c3List.forEach((c3, i) => {
            refWs.getCell(i + 2, col).value = c3;
          });
          workbook.definedNames.add(`RefData!$${colLetter(col)}$2:$${colLetter(col)}$${c3List.length + 1}`, c2Name);
        } else {
          workbook.definedNames.add(`RefData!$${colLetter(col)}$2:$${colLetter(col)}$2`, c2Name);
        }
        refWs.getColumn(col).width = 22;
        colIdx++;
      }
    }

    // --- Data Validation with cascading INDIRECT logic ---
    for (let i = 2; i <= maxRows + 1; i++) {
      // F column: level-1 category - direct reference to RefData column A
      ws.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`RefData!$A$2:$A$${c1List.length + 1}`],
        showErrorMessage: true,
        errorTitle: '分类错误',
        error: '请从下拉列表中选择一级分类'
      };

      // G column: level-2 category - INDIRECT based on level-1 selection
      ws.getCell(`G${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`INDIRECT(SUBSTITUTE($F${i}," ","_"))`],
        showErrorMessage: true,
        errorTitle: '分类错误',
        error: '请先选择一级分类'
      };

      // H column: level-3 category - INDIRECT based on level-2 selection
      ws.getCell(`H${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`INDIRECT(SUBSTITUTE($G${i}," ","_"))`],
        showErrorMessage: true,
        errorTitle: '分类错误',
        error: '请先选择二级分类'
      };

      // I column: tags
      if (tags.length > 0) {
        ws.getCell(`I${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [`"${tags.join(',')}"`],
          showErrorMessage: true,
          errorTitle: '标签错误',
          error: '请从下拉列表中选择标签'
        };
      }
    }

    ws.getColumn(1).width = 22;
    ws.getColumn(2).width = 20;
    ws.getColumn(3).width = 20;
    ws.getColumn(4).width = 20;
    ws.getColumn(5).width = 35;
    ws.getColumn(5).eachCell({ includeEmpty: true }, function(cell) {
      cell.alignment = { wrapText: true };
    });
    ws.getColumn(6).width = 22;
    ws.getColumn(7).width = 22;
    ws.getColumn(8).width = 22;
    ws.getColumn(9).width = 15;
    ws.getColumn(10).width = 30;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', "attachment; filename*=UTF-8''" + encodeURIComponent('产品导入模板.xlsx'));

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('生成模板错误:', error);
    res.status(500).json({ success: false, message: '生成模板失败: ' + error.message });
  }
});

function colLetter(idx) {
  let letter = '';
  while (idx > 0) {
    const mod = (idx - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    idx = Math.floor((idx - 1) / 26);
  }
  return letter;
}

/* ============================================================
 * 服务器启动（自动处理端口占用）
 * ============================================================ */
function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}/`);
    console.log(`管理面板地址: http://localhost:${port}/admin.html`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${port} 已占用，尝试端口 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error(err);
    }
  });
}

startServer(PORT);