# English Study UI (前端)

英语学习平台的 H5 移动端，基于 Vue3 + Vant 4 构建。

> 后端项目：[english-study](https://github.com/NameOfGoy/english-study)（go-zero + PostgreSQL）

## 功能特性

- **首页仪表盘**：今日学习/复习/加强/抽查统计 + 总体进度
- **词典管理**
  - 单词 / 短语两套独立视图
  - 详情卡：音标、词性、释义、例句、图片
  - **单词/短语删除**：详情页右上角按钮 + Vant 确认对话框 + 后端级联清学习状态/标签关联
  - 中文反查 stardict 词库 + 批量勾选添加
  - 三种视图（字母 / 状态 / 标签）+ 标签筛选
  - 词条释义在线编辑
  - 图片重新生成 / 上传 / 网络搜索 / 裁剪
  - 文本导入支持 `[tag]` 段标签 / `[---]` 终止符 / 行末 `[t1] [t2]` 多标签（后端规则）
- **四种练习模式 + 全局标签筛选**
  - 学习 / 复习 / 加强 / 抽查
  - 卡片切换、AI 例句、图片轮播、TTS 发音
  - 学习模式下可即时编辑释义、生成例句
  - 顶部 `TagFilterBar`：多选 + "全部" 互斥，localStorage 持久化，跨 4 模式生效
- **标签管理**
  - 系统标签 + 用户标签分组
  - 普通用户：系统标签段没有操作按钮（即代表只读）
  - 超管：系统标签也可编辑/删除；新建时切换 `is_system` 开关
- **跨用户分享**
  - 生成 5 分钟有效期的分享 token（按词类型 / 标签筛选）
  - 输入 token 预览 + 三种标签导入模式：**不带 / 仅系统 / 全部**
- **导入任务历史**：按日期范围筛选，查看异步导入进度
- **用户系统**：账号密码 + 微信登录、记住密码（明文存 localStorage 是已知风险，单用户便利取舍）

## 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | Vue 3.3 + Composition API |
| UI 库 | [Vant 4](https://vant-ui.github.io/vant/) （移动端组件） |
| 路由 | Vue Router 4 |
| HTTP | Axios |
| 构建 | Vite 4 |
| 样式 | SCSS |
| 图片裁剪 | vue-cropper |

## 目录结构

```
src/
├── api/                    # 后端 API 调用封装
│   ├── dashboard.js
│   ├── dictionary.js
│   ├── practice.js
│   ├── share.js
│   ├── tag.js
│   ├── user.js
│   └── file.js
├── components/             # 复用组件
│   ├── TabBar.vue          # 底部 tab 栏
│   ├── dictionary/         # 词典相关组件
│   │   ├── WordDetailView.vue  # 含右上角删除按钮
│   │   ├── PhraseDetailView.vue
│   │   ├── SearchAddModal.vue
│   │   ├── ShareGenerateModal.vue
│   │   ├── ShareImportModal.vue # 含 3 种标签导入模式 radio
│   │   ├── TranslationEditModal.vue
│   │   ├── TagEditModal.vue
│   │   └── ImportModal.vue
│   ├── practice/           # 练习相关组件
│   │   ├── TagFilterBar.vue   # 全局标签筛选 (多选+全部互斥+localStorage)
│   │   └── ImageCarousel.vue
│   └── profile/
│       └── ImportTaskList.vue
├── composables/            # 组合式函数
│   ├── useCardPictureEditor.js
│   ├── useAudioPlayer.js
│   ├── usePracticeCards.js
│   └── ...
├── views/                  # 页面
│   ├── Dashboard.vue       # 首页
│   ├── Dictionary.vue      # 词典入口
│   ├── DictionaryWords.vue
│   ├── DictionaryPhrases.vue
│   ├── Practice.vue        # 练习入口
│   ├── PracticeStudy.vue
│   ├── PracticeReview.vue
│   ├── PracticeStrength.vue
│   ├── PracticeSpot.vue
│   ├── ImportTaskHistory.vue
│   ├── TagManage.vue
│   ├── Profile.vue
│   ├── Login.vue
│   └── Register.vue
├── router/                 # 路由配置（含 isTokenExpired 主动检查 + requiresAuth 守卫）
├── utils/
│   ├── auth.js             # localStorage + setRole/isAdmin (含 JWT claims fallback)
│   ├── request.js          # Axios 封装 (401 自动跳登录)
│   └── practiceTagFilter.js # 练习全局标签筛选的 localStorage 读写
├── styles/                 # 全局样式
└── main.js                 # 入口
```

## 快速开始

### 前置要求

- Node.js 18+
- npm / pnpm / yarn
- 后端服务已启动（默认 `http://localhost:8888`），见 [english-study](https://github.com/NameOfGoy/english-study)

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

默认监听 `http://localhost:3000`，会自动打开浏览器。API 请求通过 vite 代理转发到后端 `http://localhost:8888`。

### 构建生产包

```bash
npm run build
```

产物输出到 `dist/`。

### 预览构建结果

```bash
npm run preview
```

## 配置说明

API 代理配置在 `vite.config.js`：

```js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8888',   // 后端地址
      changeOrigin: true,
    }
  }
}
```

生产部署时通常用 Nginx 反代 `/api` 到后端服务，与前端静态资源同源。

## 部署

推荐用 Docker：

```bash
docker build -t english-study-ui:<ver> .
docker run -d -p 80:80 english-study-ui:<ver>
```

或直接静态托管 `dist/` 目录到任意静态站点服务（Nginx / OSS / Vercel 等）。

> Nginx 配置 (`nginx.conf` 已自带): SPA fallback (`location /`) 显式 `Cache-Control: no-cache`，避免每次部署后浏览器把旧的 `index.html` 缓住、引用到已不存在的 JS 分包，导致路由 push 静默失败。Vite 生成的 JS/CSS 文件名带 content hash，长缓存 (`immutable`) 没问题。

## 相关仓库

- [english-study](https://github.com/NameOfGoy/english-study) — Go 后端 API

## License

MIT
