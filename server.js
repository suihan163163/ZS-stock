const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8092;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

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

app.post('/products.json', (req, res) => {
  try {
    fs.writeFileSync('./products.json', JSON.stringify(req.body, null, 2), 'utf8');
    res.status(200).json({ success: true, message: '数据保存成功' });
  } catch (error) {
    console.error('保存数据错误:', error);
    res.status(500).json({ success: false, message: '保存数据失败' });
  }
});

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