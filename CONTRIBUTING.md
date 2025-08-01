# 贡献指南

## 提交规范

本项目使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范来自动化版本管理和生成变更日志。请按照以下格式提交代码：

```
<类型>[可选的作用域]: <描述>

[可选的正文]

[可选的脚注]
```

### 提交类型

- **feat**: 新功能
- **fix**: 修复bug
- **docs**: 文档更新
- **style**: 代码风格修改（不影响代码运行的变动）
- **refactor**: 代码重构（既不是新增功能，也不是修改bug的代码变动）
- **perf**: 性能优化
- **test**: 测试相关
- **build**: 构建系统或外部依赖项修改
- **ci**: CI配置文件和脚本修改
- **chore**: 其他不修改src或测试文件的更改
- **revert**: 撤销之前的提交

### 示例

```
feat: 添加缓存管理功能

添加了自动保存和加载数据的缓存功能，提高用户体验

Issues: #123
```

```
fix: 修复导入JSON后缓存未清理的问题

当用户导入新的JSON数据时，现在会自动清理旧的缓存数据
```

```
BREAKING CHANGE: 重构数据存储结构

完全重写了数据存储结构，不兼容旧版本
```

## 版本管理

本项目使用自动化版本管理工具，基于提交信息自动确定版本号：

- 包含 `BREAKING CHANGE`, `major` 或破坏性变更的提交会增加主版本号 (1.0.0 -> 2.0.0)
- 包含 `feat`, `feature`, `add`, `new` 的提交会增加次版本号 (1.0.0 -> 1.1.0)
- 包含 `fix`, `patch`, `bug`, `hotfix` 的提交会增加修订号 (1.0.0 -> 1.0.1)
- 其他类型的提交通常会增加修订号

## 分支策略

- `master`/`main`: 主分支，用于发布稳定版本
- `beta`: 预发布分支，用于测试新功能
- `alpha`: 开发分支，包含最新但不稳定的功能

请在开发新功能或修复bug时，从主分支创建新的功能分支或修复分支，完成后提交Pull Request到主分支。