# 🎫TickBook

火车票 / 报销凭证编辑记录网站，支持多人注册使用。以真实车票样式展示票据信息，编辑时右侧实时预览。

## ✏功能

- 用户注册 / 登录 / 退出
- 创建、编辑、删除、查看票据
- 中国火车票样式视觉展示
- 编辑时右侧实时预览车票效果
- 按车次、站名、乘客名搜索筛选
- 数据隔离：每个用户只能看到自己的票据

## 🔨技术栈

| 层 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite |
| 路由 | React Router v7 |
| 状态管理 | Zustand |
| 样式 | Tailwind CSS |
| 后端 | Supabase（BaaS） |
| 数据库 | PostgreSQL（Supabase 托管） |

详见 [technology/tech-stack.md](technology/tech-stack.md)

## 🚀快速开始

### 1. 创建 Supabase 项目

注册 [Supabase](https://supabase.com)，创建一个新项目。

### 2. 初始化数据库

在 Supabase 后台的 **SQL Editor** 中，执行 `supabase-init.sql` 里的全部 SQL 语句。

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入 Supabase 项目信息：

```
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_ANON_KEY=你的-anon-key
```

> 在 Supabase 后台 Settings → API 中可以找到这两个值。

### ✅4. 启动项目

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:5173，注册账号即可使用。

## 📂项目结构

```
src/
├── components/          -- 可复用组件
│   ├── Header.tsx          导航栏
│   ├── Layout.tsx          页面布局壳
│   ├── ProtectedRoute.tsx  登录守卫
│   ├── TicketCard.tsx      票据列表卡片
│   ├── TicketForm.tsx      新建 / 编辑表单
│   └── TicketTemplate.tsx  火车票视觉模板
├── pages/              -- 页面组件
│   ├── LoginPage.tsx       登录 / 注册
│   ├── Dashboard.tsx       票据列表（首页）
│   ├── TicketCreate.tsx    新建票据
│   ├── TicketEdit.tsx      编辑票据
│   └── TicketDetail.tsx    票据详情
├── services/           -- 数据操作层
│   └── ticketService.ts    Supabase CRUD 封装
├── stores/             -- 状态管理
│   └── authStore.ts        用户登录状态
├── lib/                -- 第三方库初始化
│   └── supabase.ts         Supabase 客户端
└── types/              -- TypeScript 类型
    └── index.ts            Ticket 类型定义
```
