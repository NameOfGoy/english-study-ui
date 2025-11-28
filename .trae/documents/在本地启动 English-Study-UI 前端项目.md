## 环境要求
- Node.js: 建议 v18 LTS（Vite 4 兼容 Node >=14.18，推荐 18+）
- 包管理器: npm（项目存在 `package-lock.json`）
- 端口: 前端 `3000`，后端代理 `8888`
- 操作系统: Windows（PowerShell）

## 关键配置来源
- 启动脚本: `e:\frontend\English-Study-UI\package.json:7-10`
- Vite 开发服务器与代理: `e:\frontend\English-Study-UI\vite.config.js:12-23`
- Axios 基础地址与资源 URL 处理: `e:\frontend\English-Study-UI\src\utils\request.js:7-19`、`e:\frontend\English-Study-UI\src\utils\request.js:128-151`

## 安装依赖
- 在项目根目录执行: `npm install`
- 若出现网络问题：可考虑使用国内镜像（如 `npm config set registry https://registry.npmmirror.com`）

## 启动开发服务器
- 在项目根目录执行: `npm run dev`
- 期望行为：自动打开浏览器并访问 `http://localhost:3000`
- 说明：
  - `package.json` 定义了 `dev`: `vite`（`e:\frontend\English-Study-UI\package.json:7`）
  - `vite.config.js` 指定 `server.host=0.0.0.0`、`port=3000`、`open=true`（`e:\frontend\English-Study-UI\vite.config.js:12-16`）

## API 代理与资源说明
- 代理配置：`/api` → `http://localhost:8888`（`e:\frontend\English-Study-UI\vite.config.js:17-21`）
- Axios 基础地址：运行时拼接 `window.location.protocol//host/api`（`e:\frontend\English-Study-UI\src\utils\request.js:7-14`）
- 资源地址处理：
  - 本地（`localhost/127.0.0.1`）：`/api/v1/file/...` 将改写到 `http://193.112.111.2:39000/...`（`e:\frontend\English-Study-UI\src\utils\request.js:139-146`）
  - 生产：使用 `window.location.origin + path`（`e:\frontend\English-Study-UI\src\utils\request.js:148-151`）
- 启动后，如果后端未在 `8888` 端口运行，前端仍可打开，但 `/api` 请求会失败（界面有失败提示）。

## 验证与预览
- 启动成功后访问：`http://localhost:3000`
- 我将使用 IDE 的预览来确认服务已启动，并提供可点击的预览链接

## 常见问题与处理
- 端口被占用：修改 `vite.config.js` 的 `server.port` 或停止占用端口的进程
- Node 版本过低：升级至 18+（推荐）
- 依赖安装失败：切换 npm 源或清理缓存 `npm cache clean --force`
- 防火墙拦截：允许 `node`/`vite` 通过防火墙
- 后端未启动：按代理目标在本机启动后端或临时改代理地址

## 执行步骤（我来执行）
1. 检查 Node 版本：`node -v`
2. 安装依赖：`npm install`
3. 启动开发服：`npm run dev`
4. 验证并提供预览链接

请确认以上计划，我将立即执行并在本地跑起来。