# 随机图片API

一个简单的随机图片API服务器，支持本地图片和云存储图片

## 功能

- 访问API时随机返回一张图片
- 支持JPG、JPEG、PNG和GIF格式
- 支持幻灯片播放模式，可用作网站背景
- 支持从.txt文件中读取腾讯云等图床的图片链接
- 支持按分类返回不同主题的图片

## 安装与使用

### 准备工作

1. 确保已安装Node.js (推荐v14或更高版本)
2. 克隆或下载此项目

### 安装依赖

```bash
npm install
```

### 添加图片

有两种方式添加图片：

#### 1. 本地图片

将图片文件放入`images`文件夹中。支持的格式包括：
- JPG/JPEG
- PNG
- GIF

#### 2. 云存储图片

在`images`文件夹中创建.txt文件，每行一个图片URL，例如：

**images/default.txt**:
```
https://cdn.zhihuiyun.work/meinv2/1.jpg
https://cdn.zhihuiyun.work/meinv2/2.jpg
https://cdn.zhihuiyun.work/meinv2/3.jpg
```

**images/风景.txt**:
```
https://cdn.example.com/scenery/pic1.jpg
https://cdn.example.com/scenery/pic2.jpg
```

### 启动服务器

```bash
npm start
```

或者开发模式（自动重启）:

```bash
npm run dev
```

服务器默认运行在 http://localhost:3100

### 使用API

#### 随机单张图片

直接访问API获取随机图片：
```
http://localhost:3100/             # 使用默认分类
http://localhost:3100/?type=风景    # 使用风景分类
```

在HTML中使用：
```html
<!-- 默认分类 -->
<img src="http://localhost:3100" alt="随机图片">

<!-- 指定分类 -->
<img src="http://localhost:3100/?type=风景" alt="随机风景">
```

#### 幻灯片背景模式

访问幻灯片背景API：
```
http://localhost:3100/ppt                               # 使用默认分类
http://localhost:3100/ppt?type=风景                      # 使用风景分类
http://localhost:3100/ppt?theme=樱花&type=风景           # 指定主题和分类
```

此API设计为可直接用作网站背景，可以通过iframe嵌入到网站中：

```html
<iframe src="http://localhost:3100/ppt?theme=樱花&type=风景" 
        frameborder="0" 
        style="position:fixed; top:0; left:0; bottom:0; right:0; width:100%; height:100%; border:none; margin:0; padding:0; overflow:hidden; z-index:-1;">
</iframe>
```

支持的参数：

1. **type**: 图片分类
   - 对应images文件夹中的txt文件名
   - 默认为default

2. **theme**: 控制背景主题
   - 默认（不传参数时）
   - 樱花
   - 海洋
   - 森林
   - 原神

3. **effect**: 控制过渡效果
   - 淡入淡出（不传参数时）
   - 滑动
   - 缩放

4. **interval**: 控制切换间隔时间（毫秒）
   - 默认3000 (3秒)

## 调试

访问调试页面可以查看所有可用的分类和图片：
```
http://localhost:3100/debug
```

## 部署到服务器

### 1. 准备项目文件

确保项目结构完整：
- index.js (主服务器文件)
- package.json (依赖配置)
- images/ 目录 (存放本地图片和.txt链接文件)

### 2. 在服务器上安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y  # Ubuntu/Debian

# 安装Node.js和npm
apt install nodejs npm -y

# 安装进程管理器(PM2)
npm install -g pm2
```

### 3. 上传项目到服务器并启动

```bash
# 进入项目目录
cd /path/to/project

# 安装依赖
npm install

# 使用PM2启动并设为开机自启
pm2 start index.js --name "random-image-api"
pm2 save
pm2 startup
```

### 4. 配置Nginx反向代理

```nginx
server {
    listen 80;
    server_name 你的域名;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
``` 