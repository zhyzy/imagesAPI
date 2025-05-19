const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3100;

// 图片存放的目录
const IMAGES_DIR = path.join(__dirname, 'images');
// 图片链接文件的目录（与IMAGES_DIR相同）
const IMAGE_LINKS_DIR = IMAGES_DIR;

// 确保images目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR);
}

// 添加静态文件服务
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images'))); // 直接提供图片目录

// 服务静态HTML文件
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-image.html'));
});

// 获取图片链接的函数
function getImageLinks(category = 'default') {
  try {
    const fileExt = '.txt';
    const filePath = path.join(IMAGE_LINKS_DIR, category + fileExt);
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`链接文件不存在: ${filePath}，将使用默认文件`);
      // 如果指定的分类文件不存在，尝试使用default.txt
      if (category !== 'default') {
        return getImageLinks('default');
      }
      // 如果连default.txt也不存在，返回空数组
      return [];
    }
    
    // 读取文件内容并按行分割
    const content = fs.readFileSync(filePath, 'utf-8');
    const links = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#')); // 忽略空行和注释行
    
    console.log(`从 ${category}.txt 加载了 ${links.length} 个图片链接`);
    return links;
  } catch (error) {
    console.error(`获取图片链接时出错:`, error);
    return [];
  }
}

// 获取本地图片文件的函数
function getLocalImageFiles() {
  try {
    const imageFiles = fs.readdirSync(IMAGES_DIR)
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
      });
    return imageFiles;
  } catch (error) {
    console.error(`获取本地图片时出错:`, error);
    return [];
  }
}

// 随机单张图片API
app.get('/', (req, res) => {
  try {
    // 获取查询参数中的分类，默认为default
    const category = req.query.type || 'default';
    
    // 获取图片链接
    const imageLinks = getImageLinks(category);
    
    // 如果没有图片链接，尝试使用本地图片
    if (imageLinks.length === 0) {
      const localImages = getLocalImageFiles();
      if (localImages.length === 0) {
        return res.status(404).send('没有可用的图片');
      }
      
      // 随机选择一张本地图片
      const randomIndex = Math.floor(Math.random() * localImages.length);
      const randomImage = localImages[randomIndex];
      const imagePath = path.join(IMAGES_DIR, randomImage);
      
      // 确定图片的MIME类型
      const ext = path.extname(randomImage).toLowerCase();
      let contentType = 'image/jpeg'; // 默认为JPEG
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.gif') contentType = 'image/gif';
      
      // 设置正确的内容类型并返回本地图片
      res.setHeader('Content-Type', contentType);
      return fs.createReadStream(imagePath).pipe(res);
    }
    
    // 随机选择一个远程图片链接
    const randomIndex = Math.floor(Math.random() * imageLinks.length);
    const imageUrl = imageLinks[randomIndex];
    
    console.log(`随机选择的图片URL: ${imageUrl}`);
    
    // 重定向到远程图片URL
    res.redirect(imageUrl);
  } catch (error) {
    console.error('提供图片时出错:', error);
    res.status(500).send('服务器错误');
  }
});

// 调试页面 - 显示所有可用图片
app.get('/debug', (req, res) => {
  try {
    // 获取查询参数中的分类，默认为default
    const category = req.query.type || 'default';
    
    // 获取本地图片文件
    const localImages = getLocalImageFiles();
    
    // 获取远程图片链接
    const imageLinks = getImageLinks(category);
    
    // 获取所有可用的.txt文件
    const txtFiles = fs.readdirSync(IMAGE_LINKS_DIR)
      .filter(file => path.extname(file).toLowerCase() === '.txt')
      .map(file => path.basename(file, '.txt'));
    
    let html = `
      <h1>调试页面</h1>
      
      <h2>可用分类</h2>
      <ul>
        ${txtFiles.map(cat => `
          <li>
            <a href="/debug?type=${cat}">${cat}</a>
            (随机图片: <a href="/?type=${cat}" target="_blank">/?type=${cat}</a> | 
            幻灯片: <a href="/ppt?type=${cat}" target="_blank">/ppt?type=${cat}</a>)
          </li>
        `).join('')}
      </ul>
      
      <h2>当前分类: ${category}</h2>
      <p>远程图片链接: ${imageLinks.length}个</p>
      <ul>
        ${imageLinks.map((url, i) => `
          <li>
            ${i+1}. ${url} 
            <a href="${url}" target="_blank">查看</a>
          </li>
        `).join('')}
      </ul>
      
      <hr>
      
      <h2>本地图片文件</h2>
      <p>本地图片: ${localImages.length}张</p>
      <ul>
        ${localImages.map((file, i) => `
          <li>
            ${i+1}. ${file} 
            <a href="/images/${encodeURIComponent(file)}" target="_blank">查看</a>
          </li>
        `).join('')}
      </ul>
      
      <hr>
      
      <h2>测试访问</h2>
      <p><a href="/ppt" target="_blank">查看幻灯片</a></p>
    `;
    
    res.send(html);
  } catch (error) {
    res.status(500).send('调试错误: ' + error.message);
  }
});

// 幻灯片API - 带缩放效果
app.get('/ppt', (req, res) => {
  try {
    // 获取URL参数
    const theme = req.query.theme || '默认';
    const effect = req.query.effect || '缩放';
    const interval = parseInt(req.query.interval) || 3000;
    const category = req.query.type || 'default';  // 添加分类参数
    
    console.log(`[幻灯片请求] 主题: ${theme}, 效果: ${effect}, 间隔: ${interval}ms, 分类: ${category}`);
    
    // 获取图片链接
    const imageLinks = getImageLinks(category);
    let useLocalImages = false;
    let imageFiles = [];
    
    // 如果没有远程链接，尝试使用本地图片
    if (imageLinks.length === 0) {
      imageFiles = getLocalImageFiles();
      useLocalImages = true;
      console.log(`[幻灯片] 没有找到远程链接，使用 ${imageFiles.length} 张本地图片`);
    } else {
      console.log(`[幻灯片] 找到 ${imageLinks.length} 张远程图片链接`);
    }
    
    // 如果本地图片也没有，返回错误
    if (useLocalImages && imageFiles.length === 0) {
      return res.status(404).send('没有可用的图片');
    }

    // 定义颜色主题
    let bgColor = '#000';
    let overlayColor = 'rgba(0,0,0,0.3)';
    
    if (theme === '樱花') {
      bgColor = '#ffebf2';
      overlayColor = 'rgba(255,150,187,0.2)';
    } else if (theme === '海洋') {
      bgColor = '#e6f7ff';
      overlayColor = 'rgba(0,153,204,0.2)';
    } else if (theme === '森林') {
      bgColor = '#e6ffe6';
      overlayColor = 'rgba(51,153,51,0.2)';
    } else if (theme === '原神') {
      bgColor = '#1a1a2e';
      overlayColor = 'rgba(41, 50, 65, 0.3)';
    }

    // 强化版HTML - 添加缩放动画效果
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>幻灯片背景</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { 
          height: 100%;
          overflow: hidden;
          background-color: ${bgColor};
          font-family: Arial, sans-serif;
        }
        
        /* 幻灯片容器 */
        .slideshow {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        
        /* 幻灯片叠加层 */
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: ${overlayColor};
          z-index: 5;
          pointer-events: none;
        }
        
        /* 每个幻灯片 */
        .slide {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          z-index: 1;
          transition: opacity 1s ease-in-out;
        }
        
        /* 当前活跃的幻灯片 */
        .slide.active {
          opacity: 1;
          z-index: 2;
        }
        
        /* 幻灯片图片 */
        .slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        /* 缩放效果 */
        .zoom-effect .slide img {
          transform: scale(1.5);
          transition: transform 5s ease-out;
        }
        
        .zoom-effect .slide.active img {
          transform: scale(1.0);
        }
        
        /* 信息显示 */
        .info {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: rgba(0,0,0,0.5);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 10;
          opacity: 0.7;
          transition: opacity 0.3s;
        }
        
        .info:hover {
          opacity: 1;
        }
      </style>
    </head>
    <body>
      <div class="overlay"></div>
      
      <div class="slideshow zoom-effect">
        ${useLocalImages ? 
          imageFiles.map((file, i) => `
            <div class="slide ${i === 0 ? 'active' : ''}">
              <img src="/images/${encodeURIComponent(file)}" alt="幻灯片${i+1}">
            </div>
          `).join('') : 
          imageLinks.map((url, i) => `
            <div class="slide ${i === 0 ? 'active' : ''}">
              <img src="${url}" alt="幻灯片${i+1}">
            </div>
          `).join('')}
      </div>
      
      <div class="info">主题: ${theme} | 分类: ${category} | 图片: ${useLocalImages ? imageFiles.length : imageLinks.length}张</div>
      
      <script>
        // 增强版幻灯片脚本
        window.onload = function() {
          // 获取所有幻灯片元素
          var slides = document.querySelectorAll('.slide');
          var currentSlide = 0;
          var slideCount = slides.length;
          
          console.log('加载了 ' + slideCount + ' 张幻灯片');
          
          if(slideCount <= 1) {
            console.log('只有一张图片，不需要切换');
            return; // 如果只有一张图片，不需要切换
          }
          
          // 预加载所有图片
          slides.forEach(function(slide) {
            var img = slide.querySelector('img');
            if (img) {
              var newImg = new Image();
              newImg.src = img.src;
            }
          });
          
          // 幻灯片切换函数
          function nextSlide() {
            // 隐藏当前幻灯片
            slides[currentSlide].classList.remove('active');
            
            // 移到下一张幻灯片
            currentSlide = (currentSlide + 1) % slideCount;
            
            // 显示新的当前幻灯片
            slides[currentSlide].classList.add('active');
            
            console.log('切换到幻灯片 ' + (currentSlide + 1));
          }
          
          // 设置定时器自动切换幻灯片
          var slideInterval = setInterval(nextSlide, ${interval});
          
          // 鼠标悬停时暂停幻灯片
          document.querySelector('.slideshow').addEventListener('mouseenter', function() {
            clearInterval(slideInterval);
            console.log('幻灯片暂停');
          });
          
          // 鼠标离开时继续幻灯片
          document.querySelector('.slideshow').addEventListener('mouseleave', function() {
            slideInterval = setInterval(nextSlide, ${interval});
            console.log('幻灯片继续');
          });
        };
      </script>
    </body>
    </html>
    `;
    
    res.send(html);
  } catch (error) {
    console.error('幻灯片错误:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 直接图片访问 - 简化版，确保图片可以正常显示
app.get('/direct-image/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const imagePath = path.join(IMAGES_DIR, filename);
    
    console.log(`[图片请求] ${filename}`);
    
    if (!fs.existsSync(imagePath)) {
      console.error(`图片不存在: ${imagePath}`);
      return res.status(404).send('图片不存在');
    }
    
    res.sendFile(imagePath);
  } catch (error) {
    console.error('提供图片时出错:', error);
    res.status(500).send('图片服务器错误');
  }
});

// 旧的API路径保持不变
app.get('/api/image/:filename', (req, res) => {
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
  console.log(`随机图片API已运行在 http://localhost:${PORT}`);
  console.log(`幻灯片背景API: http://localhost:${PORT}/ppt`);
  console.log(`调试页面: http://localhost:${PORT}/debug`);
  
  // 显示当前可用图片
  try {
    // 检查.txt文件
    const txtFiles = fs.readdirSync(IMAGE_LINKS_DIR)
      .filter(file => path.extname(file).toLowerCase() === '.txt');
    console.log(`发现 ${txtFiles.length} 个图片链接文件:`);
    txtFiles.forEach((file, i) => {
      const category = path.basename(file, '.txt');
      const links = getImageLinks(category);
      console.log(` - ${i+1}. ${file}: ${links.length} 个链接`);
    });
    
    // 检查本地图片
    const localImages = getLocalImageFiles();
    console.log(`本地图片: ${localImages.length}张`);
    if (localImages.length > 0) {
      localImages.forEach((img, i) => console.log(` - ${i+1}. ${img}`));
    }
  } catch (err) {
    console.error('无法读取图片目录或链接文件:', err);
  }
}); 