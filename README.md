# 个人运动计划管理器

一个基于 Node.js + Express + SQLite 的个人运动计划管理工具，支持训练计划的增删改查、筛选和统计功能。

## 功能特性

- 📋 **计划管理**：新增、编辑、删除运动计划
- ✅ **完成标记**：一键标记计划完成状态
- 🔍 **多维度筛选**：按类型、日期、完成状态筛选，支持本周快捷筛选
- 📊 **数据统计**：首页展示本周计划数、已完成数、总训练时长
- 📈 **列表计数**：列表标题实时显示当前筛选结果数量
- 💾 **本地存储**：使用 SQLite 数据库，数据持久化
- 🎨 **响应式设计**：适配桌面和移动设备

## 技术栈

- **前端**：原生 HTML / CSS / JavaScript
- **后端**：Node.js + Express
- **数据库**：SQLite（better-sqlite3）

## 项目结构

```
workout-plan-manager/
├── public/
│   ├── index.html    # 前端页面
│   ├── style.css     # 样式文件
│   └── app.js        # 前端逻辑
├── server.js         # 后端服务器
├── package.json      # 项目配置
└── README.md         # 说明文档
```

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动服务

```bash
npm start
```

服务启动后，访问 http://localhost:3000 即可使用。

### 开发模式

```bash
npm run dev
```

### 零依赖版本（备选）

如果无法安装 npm 依赖，可直接运行零依赖版本，功能完全一致，使用 JSON 文件存储数据：

```bash
node server-simple.js
```

服务启动后访问 http://localhost:8080

> 零依赖版本数据存储在 `data.json` 文件中

## API 接口

### 获取计划列表

```
GET /api/plans
```

查询参数：
- `type`：训练类型筛选
- `date`：日期筛选（精确匹配）
- `completed`：完成状态筛选（true/false）
- `startDate`：开始日期（范围筛选）
- `endDate`：结束日期（范围筛选）

### 获取本周统计

```
GET /api/plans/stats
```

返回本周计划总数、已完成数、总训练时长。

### 获取所有类型

```
GET /api/plans/types
```

### 获取单个计划详情

```
GET /api/plans/:id
```

### 新增计划

```
POST /api/plans
```

请求体：
```json
{
  "name": "晨跑5公里",
  "type": "有氧",
  "plan_date": "2024-01-15",
  "duration": 30,
  "completed": false,
  "notes": "状态不错"
}
```

### 更新计划

```
PUT /api/plans/:id
```

### 切换完成状态

```
PATCH /api/plans/:id/toggle
```

### 删除计划

```
DELETE /api/plans/:id
```

## 数据字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 主键，自增 |
| name | string | 训练名称 |
| type | string | 训练类型（有氧/力量/柔韧/恢复等） |
| plan_date | string | 计划日期（YYYY-MM-DD） |
| duration | integer | 预计时长（分钟） |
| completed | integer | 完成状态（0-未完成，1-已完成） |
| notes | string | 备注信息 |
| created_at | datetime | 创建时间 |

## 验证方式

### 1. 启动验证

运行 `npm start` 后，在终端看到如下输出即为启动成功：

```
服务器运行在 http://localhost:3000
已插入示例数据
```

> 注意：示例数据仅在首次启动（数据库为空）时自动插入。

### 2. 页面验证

在浏览器访问 http://localhost:3000，验证以下内容：

- ✅ 顶部统计卡片显示本周计划数据
- ✅ 筛选区域包含类型、日期、状态三个筛选器
- ✅ 计划列表展示 7 条示例数据
- ✅ 每条计划包含名称、类型、日期、时长、状态
- ✅ 每条计划有「编辑」和「删除」按钮

### 3. 功能验证

**新增计划：**
1. 点击「+ 新增计划」按钮
2. 填写训练名称、类型、日期、时长等信息
3. 点击「保存」
4. 验证列表中出现新计划，统计数据同步更新

**编辑计划：**
1. 点击任意计划的「编辑」按钮
2. 修改部分信息
3. 点击「保存」
4. 验证列表中的计划信息已更新

**标记完成：**
1. 点击计划左侧的复选框
2. 验证计划变为已完成样式（划线、灰色）
3. 验证顶部「已完成」计数和「总训练时长」增加

**删除计划：**
1. 点击计划的「删除」按钮
2. 在确认弹窗中点击「删除」
3. 验证计划从列表中移除

**筛选功能：**
- 类型筛选：选择「有氧」，验证只显示有氧类型的计划
- 日期筛选：选择某个日期，验证只显示当天的计划
- 状态筛选：选择「已完成」，验证只显示已完成的计划
- 重置筛选：点击「重置筛选」，验证恢复全部显示

### 4. API 验证

使用 curl 或 Postman 等工具：

```bash
# 获取所有计划
curl http://localhost:3000/api/plans

# 获取本周统计
curl http://localhost:3000/api/plans/stats

# 新增计划
curl -X POST http://localhost:3000/api/plans \
  -H "Content-Type: application/json" \
  -d '{"name":"测试计划","type":"力量","plan_date":"2024-01-20","duration":45}'
```

## 数据库说明

- 数据库文件：`workout.db`（首次启动自动创建）
- 如需重置数据，删除 `workout.db` 文件后重启服务即可

## 常见问题

**Q: 端口被占用怎么办？**
A: 修改 `server.js` 中的 `PORT` 变量为其他端口。

**Q: 如何添加更多训练类型？**
A: 在新增/编辑计划时，选择「其他」类型，或直接在数据库中添加。

**Q: 示例数据有多少条？**
A: 首次启动会插入 7 条示例数据，覆盖本周每天，包含多种训练类型。
