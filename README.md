# JSDBManager

一个轻量级的网页工具，用于管理符号数据库。支持 JSON 文件导入导出、在线编辑和数据处理。

## 功能特点

- 导入/导出 JSON 格式数据
- 在线编辑符号信息
- 自动为中文添加拼音搜索关键词
- 支持按类别数量和备注长度排序
- 批量生成 UUID
- 支持多分类和搜索关键词管理

## 数据格式

```json
{
  "symbols": [
    {
      "id": "unique-id",
      "symbol": "符号",
      "category": ["分类1", "分类2"],
      "description": "描述",
      "notes": "备注",
      "searchTerms": ["关键词1", "关键词2"]
    }
  ]
}
```

## 使用方法

1. 克隆仓库到本地：
```bash
git clone https://github.com/yourusername/JSDBManager.git
cd JSDBManager
```

2. 安装依赖并启动项目：
```bash
npm install
npm start
```

3. 打开浏览器访问项目：http://localhost:3000

4. 使用功能：
   - 导入 JSON 文件进行编辑
   - 添加或修改符号数据
   - 使用工具栏进行批量操作
   - 导出处理后的数据

## 文件结构

```
/src
  /components   # React 组件
    Editor.js     # 符号编辑器
    FileUploader.js   # 文件操作组件
    SymbolList.js    # 符号列表
  App.js         # 主应用组件
  index.js       # 入口文件
  styles.css     # 样式文件
/public          # 静态资源
```

## 技术栈

- React
- pinyin-pro（拼音转换）
- uuid（ID 生成）
- json-stringify-pretty-compact（JSON 格式化）

## 许可证

MIT