# workspace-moni

本地开发工作区，代码通过 SSH 同步至 GitHub。

- 远程仓库：`git@github.com:Lin596666/workspace-moni.git`
- 默认分支：`main`

## 目录结构

```
.
├── .gitignore
├── README.md
└── setup-github.ps1   # 首次绑定 GitHub 的一键脚本（执行一次即可）
```

## 日常同步

```bash
git add -A
git commit -m "feat: 说明这次改了什么"
git push
```
