# TickBook🎫

火车票 / 报销凭证编辑记录网站，支持多人注册使用。以真实车票样式展示票据信息，编辑时右侧实时预览，支持六种纸质票根模板。

## ✏功能

- 用户注册 / 登录 / 退出
- 创建、编辑、删除、查看票据
- 票据按年份 → 月份分组，按时间排序
- **真实票根模板**：蓝色磁票、红色磁票、广深红磁票、红色软纸票、蓝色软纸票、广深红票六种背景
- 编辑时右侧实时预览，文字叠加在票根背景上
- 站名英文拼音自动生成，无需手填
- 车次下方向右箭头装饰
- 虚线框可编辑服务提示文字
- 右下角可编辑二维码，微信扫码读取
- **保存为图片**：票根可一键保存为 PNG 图片下载
- 按车次、站名、乘客名搜索筛选
- **数据统计**：出行单据数、累计花费、到访城市、乘车时长
- **列车种类占比**：饼图展示 G/D/C/K/Z/T/Y/L 各车次分类
- **按月消费分析**：柱状图展示每月出行开销
- **高频站点 TOP10**：出行频次排行
- 数据隔离：每个用户只能看到自己的票据

## 🛠技术栈

| 层 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite |
| 路由 | React Router v7 |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 图表 | Recharts |
| 截图保存 | modern-screenshot |
| 二维码 | qrcode |
| 拼音 | pinyin-pro |
| 后端 | Supabase（BaaS） |
| 数据库 | PostgreSQL（Supabase 托管） |

## 🚀快速开始

### 1. 创建 Supabase 项目

注册 [Supabase](https://supabase.com)，创建一个新项目。

### 2. 初始化数据库

在 Supabase 后台的 **SQL Editor** 中，先执行 `supabase-init.sql`（建表），再执行 `migration-v1.1.0.sql`（新增字段）。

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入 Supabase 项目信息：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的-anon-key
```

> 在 Supabase 后台 Settings → API 中可以找到这两个值。

### 4. 启动项目

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173，注册账号即可使用。

## 📂项目结构

```
TickBook/
├── .env.example                  # 环境变量模板
├── .gitignore                    # Git 忽略规则
├── index.html                    # 入口 HTML
├── package.json                  # 项目依赖
├── tailwind.config.js            # Tailwind CSS 配置
├── vite.config.ts                # Vite 构建配置
├── tsconfig.json                 # TypeScript 配置
├── supabase-init.sql             # 数据库建表脚本
├── migration-v1.1.0.sql          # 数据库迁移脚本
│
├── public/                       # 静态资源
│   ├── favicon.svg
│   ├── icons.svg
│   └── templates/                # 六种空白票根图片
│
└── src/                          # 源代码
    ├── main.tsx                  # 应用入口
    ├── App.tsx                   # 根组件（路由配置）
    ├── index.css                 # 全局样式
    │
    ├── components/               # 可复用组件
    │   ├── Header.tsx            # 导航栏
    │   ├── Layout.tsx            # 页面布局 + 侧边栏
    │   ├── ProtectedRoute.tsx    # 登录守卫
    │   ├── TicketCard.tsx        # 票据列表卡片
    │   ├── TicketForm.tsx        # 新建 / 编辑表单
    │   └── TicketTemplate.tsx    # 火车票视觉模板
    │
    ├── pages/                    # 页面组件
    │   ├── LoginPage.tsx         # 登录 / 注册
    │   ├── Dashboard.tsx         # 票据列表（按年/月分组）
    │   ├── TicketCreate.tsx      # 新建票据
    │   ├── TicketEdit.tsx        # 编辑票据
    │   ├── TicketDetail.tsx      # 票据详情（含保存图片）
    │   └── Statistics.tsx        # 数据统计
    │
    ├── services/                 # 数据操作层
    │   ├── ticketService.ts      # 票据 CRUD
    │   └── statistics.ts         # 统计计算服务
    │
    ├── stores/                   # 状态管理
    │   └── authStore.ts          # 用户登录状态
    │
    ├── lib/                      # 第三方库初始化
    │   └── supabase.ts           # Supabase 客户端
    │
    ├── config/                   # 模板配置
    │   └── templates.ts          # 六种票根模板坐标+样式定义
    │
    ├── types/                    # TypeScript 类型
    │   └── index.ts              # Ticket 类型定义
    │
    └── utils/                    # 工具函数
        ├── statCalc.ts           # 统计计算工具
        └── pinyin.ts             # 中文→拼音转换
```
