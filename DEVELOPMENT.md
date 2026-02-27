# Nanoboard 开发文档

## 项目概述

Nanoboard 是一个基于 Tauri + React + TypeScript 的桌面管理仪表板，用于管理 Nanobot AI 助手。

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5.x
- **UI 库**: TailwindCSS 3.x
- **图标**: Lucide React
- **编辑器**: Monaco Editor
- **虚拟滚动**: react-virtuoso
- **状态管理**: React Hooks + Context API
- **路由**: React Router v6
- **国际化**: react-i18next

### 后端
- **框架**: Rust + Tauri 2.0
- **系统监控**: sysinfo
- **文件监控**: notify
- **HTTP 客户端**: reqwest
- **异步运行时**: tokio

## 项目结构

```
nanoboard/
├── src/                    # React 前端源码
│   ├── components/         # 可复用组件
│   │   ├── dashboard/     # 仪表盘相关组件
│   │   ├── config/        # 配置相关组件
│   │   └── ...           # 其他通用组件
│   ├── pages/             # 页面组件
│   │   ├── Dashboard.tsx  # 仪表盘页面
│   │   ├── Logs.tsx       # 日志页面 (已优化)
│   │   ├── ConfigEditor.tsx
│   │   ├── Workspace.tsx
│   │   ├── SkillsMarket.tsx
│   │   └── About.tsx
│   ├── contexts/          # React Context
│   │   └── ToastContext.tsx
│   ├── hooks/             # 自定义 Hooks
│   ├── i18n/              # 国际化配置
│   ├── lib/               # Tauri API 封装
│   │   └── tauri.ts       # 后端命令调用
│   ├── types/             # TypeScript 类型定义
│   │   └── dashboard.ts
│   ├── utils/             # 工具函数
│   └── assets/            # 静态资源
├── src-tauri/             # Rust 后端
│   ├── src/
│   │   ├── main.rs        # 入口文件
│   │   ├── commands/      # Tauri 命令
│   │   │   ├── process.rs # 进程管理
│   │   │   ├── logger.rs  # 日志管理
│   │   │   ├── config.rs  # 配置管理
│   │   │   └── system.rs  # 系统监控
│   │   └── utils/         # 工具函数
│   ├── Cargo.toml         # Rust 依赖
│   └── tauri.conf.json    # Tauri 配置
├── public/                # 公共静态资源
└── package.json           # Node.js 依赖
```

## 开发指南

### 环境要求

- Node.js 18+
- Rust 1.70+
- npm/pnpm/yarn

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发模式（热重载）
npm run tauri:dev
```

### 生产构建

```bash
# macOS ARM64 (Apple Silicon)
npm run tauri:build -- --target aarch64-apple-darwin

# macOS Intel x64
npm run tauri:build -- --target x86_64-apple-darwin

# Windows
npm run tauri:build

# Linux
npm run tauri:build
```

## 核心功能实现

### 1. 日志实时监控

**位置**: `src/pages/Logs.tsx`

**特性**:
- 流式日志更新（WebSocket）
- 实时过滤（搜索 + 级别）
- 虚拟滚动（支持 10000+ 条日志）
- 统计面板
- 导出功能

**性能优化**:
```typescript
// 使用 useMemo 缓存过滤结果
const filteredLogs = useMemo(() => {
  // 过滤逻辑
}, [logs, searchQuery, useRegex, logLevel]);

// 使用虚拟滚动
import { Virtuoso } from 'react-virtuoso';
<Virtuoso
  data={filteredLogs}
  itemContent={(_index, log) => <LogItem log={log} />}
/>
```

### 2. 系统资源监控

**位置**: `src/components/dashboard/SystemResourceCards.tsx`

**监控指标**:
- CPU 使用率
- 内存使用率
- 磁盘使用率
- 网络速度（实时图表）

**后端实现**: `src-tauri/src/commands/system.rs`
```rust
use sysinfo::{ProcessExt, System, SystemExt};

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    Ok(SystemInfo {
        cpu_usage: sys.global_cpu_usage(),
        memory_total: sys.total_memory(),
        memory_used: sys.used_memory(),
        // ...
    })
}
```

### 3. 配置文件管理

**位置**: `src/pages/ConfigEditor.tsx`

**特性**:
- Monaco Editor 代码编辑
- JSON Schema 验证
- 实时保存
- 配置热重载

### 4. 技能市场

**位置**: `src/pages/SkillsMarket.tsx`

**功能**:
- 从 ClawHub 获取技能列表
- 一键安装/卸载
- 技能详情查看
- 分类过滤

## API 参考

### Tauri Commands

#### 进程管理
```typescript
// 获取 nanobot 状态
const status = await processApi.getStatus();

// 获取仪表盘数据（合并 API）
const data = await processApi.getDashboardData();

// 获取版本信息
const version = await processApi.getVersion();
```

#### 日志管理
```typescript
// 获取日志
const logs = await loggerApi.getLogs(500);

// 开始流式监控
await loggerApi.startStream();

// 停止监控
await loggerApi.stopStream();

// 检查监控状态
const isRunning = await loggerApi.isStreamRunning();
```

#### 系统监控
```typescript
// 获取系统信息
const info = await systemApi.getSystemInfo();

// 初始化网络监控
await networkApi.initMonitor();
```

## 性能最佳实践

### 1. React 组件优化

```typescript
// ✅ 使用 useMemo 缓存计算结果
const filteredData = useMemo(() => {
  return data.filter(item => item.active);
}, [data]);

// ✅ 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// ✅ 使用 React.memo 避免不必要的重渲染
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{data}</div>;
});
```

### 2. 虚拟滚动

对于长列表，使用 react-virtuoso：

```typescript
import { Virtuoso } from 'react-virtuoso';

<Virtuoso
  style={{ height: '100%' }}
  data={items}
  itemContent={(index, item) => <ItemComponent item={item} />}
  followOutput="smooth"
/>
```

### 3. 事件监听器清理

```typescript
useEffect(() => {
  const unlisten = await someEvent.listen(callback);
  
  return () => {
    unlisten(); // 组件卸载时清理
  };
}, []);
```

## 常见问题

### Q: 如何添加新的 Tauri 命令？

1. 在 `src-tauri/src/commands/` 创建新文件
2. 实现命令函数并使用 `#[tauri::command]` 标记
3. 在 `main.rs` 中注册命令
4. 在前端 `src/lib/tauri.ts` 添加调用封装

### Q: 如何调试 Rust 后端？

```bash
# 启用详细日志
RUST_LOG=debug npm run tauri:dev

# 查看日志
tail -f ~/.nanobot/logs/nanobot.log
```

### Q: 如何优化构建体积？

在 `src-tauri/Cargo.toml` 中已配置：
```toml
[profile.release]
panic = "abort"
strip = true
lto = true
codegen-units = 1
opt-level = "z"
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 更新日志

### v0.2.6 (2026-02-28)
- ✅ 优化日志组件性能（useMemo + 虚拟滚动）
- ✅ 添加 OPTIMIZATION_LOG.md 优化日志
- 🐛 修复 TypeScript 类型错误
- 📦 更新依赖包

### v0.2.5 (2026-02-27)
- 添加 ClawHub Skills 市场
- 重构配置类型
- 添加 MCP Server toolTimeout 配置

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

## 联系方式

- **作者**: Freakz3z
- **邮箱**: 3020517046@qq.com
- **GitHub**: https://github.com/Freakz3z/nanoboard
