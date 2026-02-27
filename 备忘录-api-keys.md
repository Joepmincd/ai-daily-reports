# API Keys 备忘录

**注意：此文件包含敏感信息，不要提交到 GitHub 或部署到网页**

---

## 第三方 API Keys

| 服务 | API Key | 用途 | 状态 |
|------|---------|------|------|
| 和风天气 | `534f069a0e8b497f9def6a42d734fd2f` | 天气数据查询 | ✅ 已配置 |
| 高德地图 | `3379bfab6145d92866383c7339e607fb` | 地理编码、周边城市 | ✅ 已配置 |
| **Kimi** | `sk-KiJmILTCDZMtd3DK4JrvX91FUVq3q35aVX1OjpHkdLIIZJKl` | AI 生成技能指南 | ✅ 已配置 |
| **DeepSeek** | `sk-d52398c69d9d447e838af3e550a602f9` | AI 生成技能指南（备用）| ✅ 已配置 |

---

## Cloudflare Worker 环境变量

在 Cloudflare Dashboard 中配置：
https://dash.cloudflare.com → Workers & Pages → ai-daily-api-proxy → Settings → Variables

### 已配置 ✅
```
QWEATHER_KEY=534f069a0e8b497f9def6a42d734fd2f
GAODE_KEY=3379bfab6145d92866383c7339e607fb
KIMI_API_KEY=sk-KiJmILTCDZMtd3DK4JrvX91FUVq3q35aVX1OjpHkdLIIZJKl
DEEPSEEK_API_KEY=sk-d52398c69d9d447e838af3e550a602f9
```

### 所有 API 已配置完成 ✅

---

## API 端点汇总

### 统一后端地址
```
https://ai-daily-api-proxy.gjoecd.workers.dev
```

### 可用接口

#### 1. 天气查询
```
GET /api/weather?lat={纬度}&lon={经度}&date={天数偏移}
```
- `date=0` - 实时天气
- `date=1~2` - 未来预报

#### 2. 城市攻略
```
GET /api/guide?city={城市名}
```

#### 3. 技能指南
```
GET /api/skill-guide?skill={技能名}
```

#### 4. 周边城市搜索
```
GET /api/nearby-cities?lat={纬度}&lon={经度}&radius={半径米}
```
- `radius` - 搜索半径，单位米，默认 200000 (200km)
- 返回周边城市列表，按距离排序

---

## 前端应用 API 调用规范

所有前端应用必须使用统一后端：

```javascript
// ✅ 正确
const API_BASE_URL = 'https://ai-daily-api-proxy.gjoecd.workers.dev';

// ❌ 错误 - 不要直接调用第三方 API
const WEATHER_URL = 'https://api.qweather.com/...';
```

---

## 使用场景

### 找晴天应用
- 天气查询 → `/api/weather`
- 城市攻略 → `/api/guide`

### 技能侠应用
- 技能指南 → `/api/skill-guide`

### 未来可能添加
- 地理编码 → 使用高德 API（待实现）
- 路线规划 → 使用高德 API（待实现）

---

## 更新记录

| 时间 | 操作 | 内容 |
|------|------|------|
| 2026-02-27 10:32 | 添加 | 和风天气、高德 API Keys |
| 2026-02-27 10:33 | 配置 | Cloudflare Worker 环境变量（QWEATHER_KEY、GAODE_KEY）|
| 2026-02-27 10:38 | 添加 | 高德周边城市接口 `/api/nearby-cities` |
| 2026-02-27 10:49 | 添加 | Kimi、DeepSeek API Keys |
| 2026-02-27 10:50 | 配置 | Cloudflare Worker 环境变量（KIMI_API_KEY、DEEPSEEK_API_KEY）|
| 2026-02-27 10:51 | 更新 | Worker 支持 Kimi/DeepSeek 双模型 |
| 2026-02-27 10:52 | 清理 | 删除 skill-hero.html 中未使用的直接调用代码 |

---

**最后更新**: 2026-02-27 10:58
**文件位置**: `/root/.openclaw/workspace/备忘录-api-keys.md`
**注意事项**: 此文件包含敏感 API Keys，请勿提交到 GitHub 或部署到公开网页
