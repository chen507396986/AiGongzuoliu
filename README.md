# Ai影视工作流 (AI Workflow Canvas)

这是一个基于 React Flow 的无限画布 AI 工作流编辑器。

## 功能特点

- 🎨 **无限画布**：自由拖拽、缩放、漫游。
- 🔗 **节点连接**：支持创建自定义节点并进行连线。
- 💾 **自动保存**：所有操作会自动保存到浏览器缓存 (localStorage)。
- ☁️ **云端同步**：支持登录 GitHub 并将工作流保存到私有 Gist，实现跨设备同步。
- 🖥️ **本地服务器**：内置 Node.js + Express 后端服务器，支持私有化部署和本地 SQLite 存储。
- 📤 **导入导出**：支持将工作流导出为 JSON 文件，或从 JSON 文件导入恢复。
- 🌙 **暗色模式**：专业的深色界面设计。
- 📝 **更新日志**：查看 [CHANGELOG.md](./CHANGELOG.md) 获取详细更新记录。


## 💻 开发者指南：如何在另一台电脑上开发代码

如果您想在另一台电脑上**修改代码**（不仅仅是使用），请按照以下步骤操作：

### 1. 环境准备
在开始之前，请确保新电脑上安装了以下软件：
- **Node.js** (版本 18 或更高): [下载地址](https://nodejs.org/)
- **Git**: [下载地址](https://git-scm.com/)
- **VS Code** (推荐代码编辑器): [下载地址](https://code.visualstudio.com/)

### 2. 获取代码
打开终端（Terminal）或 Git Bash，运行以下命令将代码下载到本地：

```bash
git clone https://github.com/chen507396986/AiGongzuoliu.git
cd AiGongzuoliu
```

### 3. 安装依赖
下载代码后，需要安装项目所需的依赖包：

```bash
npm install
```

### 4. 启动开发环境
安装完成后，运行以下命令启动项目：

```bash
npm run dev
```
现在，您可以在浏览器中访问 `http://localhost:5173` 看到项目了。

### 5. 同步代码
- **提交修改**：当您修改了代码后，运行以下命令保存并上传到 GitHub：
  ```bash
  git add .
  git commit -m "描述您修改了什么"
  git push
  ```
- **拉取更新**：当您回到原来的电脑，或者在另一台电脑上想获取最新代码时，运行：
  ```bash
  git pull
  ```




## 技术栈

- React 19
- TypeScript
- Vite
- @xyflow/react (React Flow)
- Lucide React (Icons)

## 本地开发与服务器

本项目包含前端应用和后端服务器。

### 启动完整环境 (前端 + 后端)

```bash
npm install
npm run dev:all
```

此命令会同时启动：
- 前端页面：http://localhost:5173
- 后端 API：http://localhost:3001

### 仅启动前端

```bash
npm run dev
```

### 仅启动后端

```bash
npm run server
```

## 如何部署

### 方式一：Vercel 一键部署 (推荐)

点击下方按钮，即可一键将本项目部署到 Vercel：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/chen507396986/AiGongzuoliu)

### 方式二：GitHub Pages (自动化部署)

本项目已配置 GitHub Actions 自动部署。

1. **提交代码**：只需运行 `git push` 将代码推送到 GitHub。
2. **等待构建**：在 GitHub 仓库的 "Actions" 标签页可以看到构建进度。
3. **访问地址**：构建完成后，您的网站将在以下地址上线：
   `https://chen507396986.github.io/AiGongzuoliu/`

## 🌍 跨电脑/跨设备使用指南

如果您想在另一台电脑上继续编辑您的工作流，请按照以下步骤操作：

### 方法 A：使用分享链接 (推荐)
1. 在当前电脑上，点击右上角的 **“上传云端”** 按钮。
2. 上传成功后，点击 **“分享链接”** 按钮，复制 URL。
3. 将该 URL 发送到另一台电脑。
4. 在另一台电脑浏览器打开该 URL，即可直接加载工作流。

### 方法 B：登录 GitHub 账号
1. 在新电脑上打开部署好的网页。
2. 点击 **“连接 GitHub 账户”**。
3. 输入您的 GitHub Token (PAT)。
4. 点击 **“从云端加载”** 按钮，选择您之前保存的 Gist。
