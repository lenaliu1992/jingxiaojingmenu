# 静小静菜品毛利计算系统 - Claude Code 配置

> 本文件在每次对话开始时自动读取，包含项目专属信息

## 📌 项目概述

**项目名称**: 静小静菜单管理系统（菜品毛利计算）
**核心功能**: 餐厅菜品成本管理、毛利率计算、套餐定价
**技术栈**: React + TypeScript + Node.js + SQLite

---

## 🤖 自动质量保证流程

> 每次开发时,Claude会自动执行以下检查,减少bug率、提高开发效率

### 开发前检查 (自动执行)

每次开始新功能开发前,我会:
- [x] 需求理解: 用一句话描述功能目标
- [x] 数据实体: 明确涉及哪些数据结构/表/字段
- [x] API/函数设计: 确定需要哪些接口/函数
- [x] Bug预判: 预判可能出现什么问题

### 开发中检查 (实时)

编写代码时,我会确保:
- [x] TypeScript类型安全: 所有参数和返回值都有类型
- [x] 可选字段处理: 明确 `undefined` vs `null` vs `0` 的区别
- [x] 输入验证: 验证所有用户输入
- [x] 错误处理: try-catch + 友好错误提示
- [x] 不可变更新: 使用展开运算符而非直接修改

### 开发后检查 (自动触发)

完成代码编辑后,我会自动:
1. 检查修改了哪些文件
2. 根据项目类型运行相应检查清单
3. 发现问题时自动报告并给出修复建议
4. 无问题时静默完成

### 本项目关键文件位置

- **类型定义**: `types.ts`
- **API层**: `services/api/dishesApi.ts`, `services/api/mealsApi.ts`, `services/api/categoriesApi.ts`
- **前端组件**: `components/App.tsx`, `components/DishLibraryNew.tsx`, `components/MealListCompact.tsx`
- **后端路由**: `backend/src/routes/dishes.ts`, `backend/src/routes/meals.ts`, `backend/src/routes/categories.ts`

### 本项目常见Bug模式预防

1. **可选字段显示**
   ```typescript
   // ❌ 错误
   {dish.price}

   // ✅ 正确
   {dish.price !== undefined ? `¥${dish.price}` : '-'}
   // 或
   {dish.price || '-'}
   ```

2. **数据同步**
   ```typescript
   // API成功后立即更新state
   const handleCreateDish = async (dish: Omit<Dish, 'id'>) => {
     const newDish = await dishesApi.create(dish);
     setDishes([...dishes, newDish]); // 立即更新
   };
   ```

3. **类型转换 (前后端字段名)**
   ```typescript
   // 前端: camelCase
   interface Dish {
     categoryId?: string;
   }

   // 后端: snake_case
   interface DishRequest {
     category_id?: string;
   }

   // 转换函数
   const toSnakeCase = (obj: any): any => {
     // 转换逻辑...
   };
   ```

4. **边界条件**
   ```typescript
   // ❌ 可能崩溃
   dishes.filter(d => d.categoryName === selectedCategory)

   // ✅ 安全
   dishes.filter(d => d.categoryName === selectedCategory && d.name)

   // ❌ NaN
   const margin = (price - cost) / price * 100;

   // ✅ 安全
   const margin = price > 0 ? ((price - cost) / price * 100) : 0;
   ```

---

## 👤 用户信息

- **姓名**: Lena
- **角色**: 产品经理（不会写代码）
- **系统**: macOS
- **偏好**: 使用中文交流
- **目标**: 正在学习使用 Claude Code 辅助开发

---

## 🚀 快速启动

### 一键启动（推荐）

**macOS 用户**:
- 在 Finder 中双击 `一键启动项目.command`
- 或在终端执行：`./一键启动项目.command`

**命令行启动**:
```bash
npm run dev:all
```

这将同时启动：
- 🌐 前端界面：http://localhost:5173
- 🔧 后端 API：http://localhost:3001/api

### 其他启动命令

- `npm run dev` - 只启动前端
- `npm run dev:backend` - 只启动后端

---

## ⚙️ 项目配置

### 端口配置（重要！）

**确保以下文件端口一致**：

1. **前端配置** (`.env`):
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

2. **后端配置** (`backend/.env`):
   ```
   PORT=3001
   ```

> 💡 **历史问题**: 曾因端口不匹配（前端 3001 vs 后端 3000）导致"更新菜品失败"错误，现已修复。

### 依赖安装

```bash
# 前端依赖
npm install

# 后端依赖
cd backend && npm install && cd ..
```

---

## 📁 项目结构

```
jingxiaojingmenu/
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── routes/            # API 路由
│   │   ├── services/          # 业务逻辑
│   │   ├── config/            # 数据库配置
│   │   └── server.ts          # 服务器入口
│   ├── data/                  # SQLite 数据库文件
│   │   └── margin-master.db
│   └── package.json
│
├── services/                   # 前端 API 服务层
│   └── api/
│       ├── client.ts          # Axios 客户端
│       └── dishesApi.ts       # 菜品相关 API
│
├── components/                 # React 组件
│   ├── DishLibrary.tsx        # 菜品库
│   ├── ComboBuilder.tsx       # 套餐构建器
│   └── MarginCalculator.tsx   # 毛利率计算器
│
├── App.tsx                     # 主应用
├── .env                        # 前端环境变量
├── 一键启动项目.command        # macOS 启动脚本
├── 一键启动项目.bat            # Windows 启动脚本
├── package.json
└── CLAUDE.md                   # 本文件
```

---

## 🔧 核心功能模块

### 1. 菜品管理
- **文件**: `components/DishLibrary.tsx`
- **功能**: 添加、编辑、删除菜品
- **API**: `GET/POST/PUT/DELETE /api/dishes`

### 2. 套餐构建
- **文件**: `components/ComboBuilder.tsx`
- **功能**: 拖拽创建套餐、计算成本
- **依赖**: `@dnd-kit` 拖拽库

### 3. 毛利率计算
- **文件**: `components/MarginCalculator.tsx`
- **公式**: `毛利率 = (售价 - 成本) / 售价 × 100%`

### 4. 数据导入
- **功能**: Excel 批量导入菜品
- **依赖**: `xlsx` 库

---

## 🗄️ 数据库

**类型**: SQLite (sql.js)
**位置**: `backend/data/margin-master.db`

### 核心表结构

**dishes (菜品表)**:
```sql
CREATE TABLE dishes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cost REAL NOT NULL,        -- 成本
  price REAL,                 -- 售价
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,         -- 软删除
  source TEXT                 -- 来源: 'initial' | 'user'
);
```

---

## 🐛 常见问题

### Q: 修改菜品时提示"更新菜品失败"
**A**: 检查前后端端口是否一致
- 前端 `.env` 中的 `VITE_API_URL`
- 后端 `backend/.env` 中的 `PORT`
- 应该都是 3001

### Q: 后端服务无法启动
**A**:
1. 检查是否安装了后端依赖：`cd backend && npm install`
2. 检查 3001 端口是否被占用
3. 查看后端终端的错误信息

### Q: 数据没有保存
**A**:
- 确保使用了 API 模式（`.env` 中 `VITE_USE_API=true`）
- 检查后端服务是否正常运行
- 查看浏览器控制台的网络请求

---

## 📝 开发规范

### 代码风格
- 使用 TypeScript
- React 函数组件 + Hooks
- API 调用统一使用 `services/api/` 层

### 提交规范
```
feat: 新功能
fix: 修复 bug
refactor: 重构
docs: 文档更新
```

### 测试流程
1. 启动项目：`npm run dev:all`
2. 测试菜品编辑功能
3. 验证数据持久化
4. 刷新页面确认数据保存

---

## 🎯 产品方法论

**核心原则**: 极致简单
- 专注一个功能并做到极致
- 避免"功能堆砌"
- 产品三段论：预测 → 单点击穿 → All-in

**当前项目定位**:
- 单点突破：菜品毛利计算
- 目标用户：餐厅老板/厨师
- 核心价值：简单、准确、高效

---

## 📚 重要文件

| 文件 | 用途 |
|------|------|
| `backend/src/server.ts` | 后端服务器入口（端口配置） |
| `backend/src/routes/dishes.ts` | 菜品 API 路由 |
| `services/api/client.ts` | 前端 API 客户端（端口配置） |
| `.env` | 前端环境变量 |
| `backend/.env` | 后端环境变量 |

---

## 🔄 更新记录

**2025-01-26**
- ✅ 修复前后端端口不匹配问题
- ✅ 添加一键启动脚本（macOS .command + Windows .bat）
- ✅ 统一端口配置为 3001
- ✅ 添加 `concurrently` 支持同时启动前后端
- ✅ 更新 README 启动说明

---

*最后更新：2025-01-26*
