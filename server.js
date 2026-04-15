const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8092;

// 配置中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 配置静态文件服务
app.use(express.static(__dirname));

// 配置 Multer 存储
const storage = multer.diskStorage({
  // 设置文件存储位置
  destination: function (req, file, cb) {
    // 确保 images 目录存在
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }
    cb(null, imagesDir);
  },
  // 设置文件名
  filename: function (req, file, cb) {
    // 使用时间戳重命名文件，防止重复
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `upload_${timestamp}${ext}`);
  }
});

// 创建 Multer 实例，配置为只接受图片文件
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // 只接受图片文件
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

// 处理文件上传请求
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    // 检查是否有文件上传
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有文件上传' });
    }
    
    // 构建图片路径
    const imagePath = `/images/${req.file.filename}`;
    
    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '图片上传成功',
      imagePath: imagePath
    });
  } catch (error) {
    // 处理错误
    res.status(500).json({ success: false, message: '上传失败: ' + error.message });
  }
});

// 处理保存产品数据的请求
app.post('/products.json', (req, res) => {
  try {
    // 保存数据到 products.json 文件
    fs.writeFileSync('./products.json', JSON.stringify(req.body, null, 2), 'utf8');
    res.status(200).json({ success: true, message: '数据保存成功' });
  } catch (error) {
    console.error('保存数据错误:', error);
    res.status(500).json({ success: false, message: '保存数据失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}/`);
  console.log(`管理面板地址: http://localhost:${PORT}/admin.html`);
});
