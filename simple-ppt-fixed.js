const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3300;

// 图片存放的目录
const IMAGES_DIR = path.join(__dirname, 'images');

// 确保images目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
}

// 直接提供静态文件访问
app.use('/images', express.static(IMAGES_DIR));

// 首页 - 纯HTML幻灯片，无复杂CSS和JS
app.get('/', (req, res) => {
  try {
    // 获取所有图片文件
    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => {
        // 仅选择支持的图片格式
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      });
    
    console.log('找到图片文件:', imageFiles);
    
    // 极简幻灯片HTML
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>超简单幻灯片</title>
      <style>
        body { margin: 0; padding: 0; background: #333; color: white; }
        img { 
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          object-fit: contain;
        }
        
        .info {
          position: fixed;
          bottom: 10px;
          left: 10px;
          background: rgba(0,0,0,0.7);
          padding: 10px;
          z-index: 100;
          font-family: Arial;
        }
      </style>
    </head>
    <body>
      <div class="info">找到${imageFiles.length}张图片</div>
      
      <!-- 直接显示第一张图片，不使用JS切换 -->
      <img src="/images/${imageFiles.length > 0 ? imageFiles[0] : ''}" alt="幻灯片">
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('出错:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`超简单幻灯片服务器已运行在 http://localhost:${PORT}`);
}); 