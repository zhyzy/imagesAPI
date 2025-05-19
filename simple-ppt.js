const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3200;

// 图片存放的目录
const IMAGES_DIR = path.join(__dirname, 'images');

// 确保images目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
}

// 首页 - 欢迎页面
app.get('/', (req, res) => {
  res.send(`
    <h1>简易图片幻灯片API</h1>
    <p>访问 <a href="/ppt">/ppt</a> 查看幻灯片</p>
  `);
});

// 幻灯片API
app.get('/ppt', (req, res) => {
  try {
    // 获取URL参数
    const theme = req.query.theme || '默认';
    
    // 获取所有图片文件
    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => {
        // 仅选择支持的图片格式
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      });

    if (imageFiles.length === 0) {
      return res.status(404).send('没有可用的图片');
    }

    // 为幻灯片准备图片完整URL
    const imageUrls = imageFiles.map(file => {
      return `/img/${encodeURIComponent(file)}`;
    });

    // 生成简单的幻灯片HTML
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>简易幻灯片 - ${theme}</title>
        <style>
          body { margin: 0; padding: 0; background: #000; height: 100vh; overflow: hidden; }
          .slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; transition: opacity 1s; }
          .slide.active { opacity: 1; }
          .slide img { width: 100%; height: 100%; object-fit: cover; }
        </style>
      </head>
      <body>
        ${imageUrls.map((url, index) => `
          <div class="slide ${index === 0 ? 'active' : ''}">
            <img src="${url}" alt="幻灯片">
          </div>
        `).join('')}
        
        <script>
          const slides = document.querySelectorAll('.slide');
          let current = 0;
          
          setInterval(() => {
            slides[current].classList.remove('active');
            current = (current + 1) % slides.length;
            slides[current].classList.add('active');
          }, 3000);
        </script>
      </body>
      </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('提供幻灯片时出错:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 图片访问API
app.get('/img/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const imagePath = path.join(IMAGES_DIR, filename);
    
    if (!fs.existsSync(imagePath)) {
      return res.status(404).send('图片不存在');
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('提供图片时出错:', error);
    res.status(500).send('服务器错误');
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`简易幻灯片服务器已运行在 http://localhost:${PORT}`);
  console.log(`访问 http://localhost:${PORT}/ppt 查看幻灯片`);
}); 