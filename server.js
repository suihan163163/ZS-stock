const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

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

    const category1List = Object.keys(categories);
    const category2Map = {};
    const category3Map = {};
    for (const [c1, subs] of Object.entries(categories)) {
      if (subs && typeof subs === 'object') {
        category2Map[c1] = Object.keys(subs);
        for (const [c2, l3] of Object.entries(subs)) {
          if (Array.isArray(l3) && l3.length > 0) {
            category3Map[`${c1}|${c2}`] = l3;
          }
        }
      }
    }

    const allCategory2 = [...new Set(Object.values(category2Map).flat())];
    const allCategory3 = [...new Set(Object.values(category3Map).flat())];

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

    for (let i = 2; i <= maxRows + 1; i++) {
      ws.getCell(`F${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${category1List.join(',')}"`],
        showErrorMessage: true,
        errorTitle: '分类错误',
        error: '请从下拉列表中选择一级分类'
      };

      ws.getCell(`G${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${allCategory2.join(',')}"`],
        showErrorMessage: true,
        errorTitle: '分类错误',
        error: '请从下拉列表中选择二级分类'
      };

      ws.getCell(`H${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${allCategory3.join(',')}"`],
        showErrorMessage: true,
        errorTitle: '分类错误',
        error: '请从下拉列表中选择三级分类'
      };

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

    const refSheet = workbook.addWorksheet('分类参考', {
      properties: { tabColor: { argb: 'FF0B3C6A' } }
    });

    refSheet.addRow(['一级分类', '二级分类', '三级分类']);
    refSheet.getRow(1).font = { bold: true, size: 11 };
    let refRow = 2;
    for (const [c1, subs] of Object.entries(categories)) {
      if (subs && typeof subs === 'object') {
        const c2Keys = Object.keys(subs);
        if (c2Keys.length === 0) {
          refSheet.addRow([c1, '', '']);
          refRow++;
        } else {
          for (const c2 of c2Keys) {
            const l3 = subs[c2];
            if (Array.isArray(l3) && l3.length > 0) {
              for (const c3 of l3) {
                refSheet.addRow([c1, c2, c3]);
                refRow++;
              }
            } else {
              refSheet.addRow([c1, c2, '']);
              refRow++;
            }
          }
        }
      } else {
        refSheet.addRow([c1, '', '']);
        refRow++;
      }
    }

    refSheet.getColumn(1).width = 28;
    refSheet.getColumn(2).width = 22;
    refSheet.getColumn(3).width = 22;

    ws.getColumn(1).width = 22;
    ws.getColumn(2).width = 18;
    ws.getColumn(3).width = 15;
    ws.getColumn(4).width = 12;
    ws.getColumn(5).width = 35;
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

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}/`);
  console.log(`管理面板地址: http://localhost:${PORT}/admin.html`);
});
