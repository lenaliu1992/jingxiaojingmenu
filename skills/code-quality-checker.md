# 代码质量自动检查 Subagent

## 任务描述

当检测到代码编辑操作后,自动运行质量检查,帮助在开发早期发现并修复问题。

## 工作流程

### 1. 检测项目类型

根据项目结构判断项目类型:

- **前端项目**: 有 `package.json` + React/Vue/Next.js等依赖
- **后端项目**: 有 `server.ts`, `main.py`, `app.go`等入口文件
- **全栈项目**: 同时有前端和后端文件(如本项目的React + Node.js)

### 2. 读取修改的文件列表

使用git状态获取修改的文件:
```bash
git status --short
```

### 3. 根据修改的文件类型运行检查

#### 修改了 `types.ts` 或类型定义文件
检查项:
- [ ] 新增的类型是否有完整的字段定义?
- [ ] 可选字段是否正确标注了 `?`?
- [ ] 前后端类型是否一致?(注意snake_case ↔ camelCase转换)

#### 修改了 API 文件 (`services/api/*.ts`, `backend/src/routes/*.ts`)
检查项:
- [ ] 请求参数有类型定义吗?
- [ ] 响应数据有类型定义吗?
- [ ] 错误处理完整吗?(try-catch)
- [ ] API路径正确吗?(避免重复路由)

#### 修改了 React 组件 (`components/*.tsx`)
检查项:
- [ ] Props有类型定义吗?
- [ ] useState初始值正确吗?
- [ ] useEffect依赖数组正确吗?
- [ ] 可选字段使用了可选链吗?(`dish?.price`)
- [ ] 事件处理使用了useCallback吗?(防止重复渲染)

#### 修改了后端服务 (`backend/src/services/*.ts`)
检查项:
- [ ] 使用了参数化查询吗?(防止SQL注入)
- [ ] 错误处理完整吗?
- [ ] 事务管理正确吗?(批量操作需要事务)

### 4. 运行类型检查

根据项目类型运行相应的类型检查命令:

```bash
# TypeScript项目
npx tsc --noEmit

# Python项目
mypy . || pylint **/*.py

# Go项目
go build ./...
```

### 5. 检查常见问题

#### TypeScript项目
- [ ] 使用了 `any` 类型吗?(应该使用具体类型或 `unknown`)
- [ ] 未处理的Promise rejection吗?
- [ ] 缺少错误处理的API调用吗?
- [ ] 未使用的导入/变量吗?

#### React项目
- [ ] useEffect缺少依赖数组吗?
- [ ] 直接修改state吗?(应该使用setState或展开运算符)
- [ ] 缺少key的列表渲染吗?

#### 后端项目
- [ ] 缺少输入验证吗?
- [ ] 敏感信息泄露到响应中吗?(密码、token等)
- [ ] 缺少错误日志吗?

### 6. 数据流完整性检查

对于涉及数据操作的功能:
- [ ] 创建操作同步到后端了吗?
- [ ] API成功后更新state了吗?
- [ ] API失败后回滚state了吗?
- [ ] 前后端数据格式转换正确吗?

### 7. 生成报告

#### 发现问题时
详细报告问题,包括:
- 问题描述(具体到文件和行号)
- 为什么这是问题
- 修复建议(最好有代码示例)
- 严重程度(高/中/低)

示例:
```
❌ 发现问题: 可选字段未处理
文件: components/DishLibraryNew.tsx:76
问题: 直接显示 dish.price,当price为undefined时会显示"undefined"
建议: 使用条件渲染 {dish.price !== undefined ? `¥${dish.price}` : '-'}
严重程度: 中
```

#### 无问题时
简短确认即可,不要打断用户:
```
✅ 代码质量检查通过
- TypeScript类型: 正常
- 常见问题: 未发现
- 数据流: 完整
```

## 检查清单模板

### 前端项目(React + TypeScript)
```markdown
- [ ] 所有组件Props都有类型定义
- [ ] useState/useMemo/useCallback使用正确
- [ ] useEffect有正确的依赖数组
- [ ] 可选字段使用了可选链或条件渲染
- [ ] 事件处理函数使用了useCallback
- [ ] 列表渲染有唯一的key
- [ ] 未直接修改state
```

### 后端项目(Node.js + Express)
```markdown
- [ ] 路由有适当的HTTP方法(GET/POST/PUT/DELETE)
- [ ] 请求参数有验证(类型、范围)
- [ ] 数据库查询使用了参数化(防SQL注入)
- [ ] 错误返回适当的HTTP状态码
- [ ] 敏感信息未泄露到响应中
- [ ] 批量操作使用了事务
```

### 全栈项目(前端 + 后端)
```markdown
- [ ] 前端类型定义 + 后端类型定义一致
- [ ] API字段名转换正确(camelCase ↔ snake_case)
- [ ] API调用有错误处理
- [ ] API成功后更新前端state
- [ ] API失败后显示友好提示
```

## 本项目特定检查

对于**静小静菜单管理系统**,额外检查:

### 菜品相关功能
- [ ] price字段为undefined时的显示处理
- [ ] category字段与category_id字段的映射
- [ ] 成本和售价的非负数验证

### 套餐相关功能
- [ ] standardPrice为0时使用totalOriginalPrice作为后备
- [ ] dishIds数组更新时触发重新计算
- [ ] 毛利率计算处理除以0的情况

### Excel导入导出
- [ ] 价格字段转换为数字格式
- [ ] 日期字段格式正确
- [ ] 合并单元格处理正确

## 执行时机

- **自动触发**: 每次代码编辑操作后(通过hook)
- **手动触发**: 用户主动请求检查时
- **提交前**: Git commit前自动运行(可选)

## 输出格式

使用友好的中文输出,格式如下:

```markdown
🔍 代码质量检查报告

检查文件: components/DishLibraryNew.tsx, App.tsx
项目类型: 全栈(React + Node.js)

✅ 通过的检查:
- TypeScript类型检查: 通过
- 前后端类型一致性: 通过

⚠️ 发现的问题:
1. 可选字段未处理 (中等严重)
   文件: components/DishLibraryNew.tsx:76
   问题: 直接显示 dish.price
   建议: 使用条件渲染

💡 修复建议:
```typescript
// 当前代码
<span>{dish.price}</span>

// 建议修改
<span>{dish.price !== undefined ? `¥${dish.price}` : '-'}</span>
```

总结: 发现1个问题,建议修复后再继续开发
```

## 注意事项

1. **后台运行**: 不要打断用户工作流,只在发现问题时报告
2. **静默完成**: 无问题时简短确认或完全不提示
3. **优先级**: 优先报告严重问题(类型错误、安全漏洞)
4. **可操作性**: 提供具体的修复建议,最好有代码示例
5. **学习导向**: 解释为什么这是问题,帮助用户理解
