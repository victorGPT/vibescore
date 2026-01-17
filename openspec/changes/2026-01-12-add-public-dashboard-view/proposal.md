# Change: Public Dashboard View

## Why
需要支持“任何持链接可访问”的 Public View，让用户可以公开分享完整 Dashboard 视图，同时保持可撤销与最小隐私暴露。

## What Changes
- 新增 Public View share link（生成/撤销/旋转）。
- 新增 share token 认证分支，支持 usage 只读端点。
- 新增 `/share/:token` 路由渲染完整 Dashboard（只读/隐藏登录提示）。
- 新增 `vibescore_public_views` 表用于存储 token hash。
- 更新 copy registry 与部署 rewrite。

## Impact
- Affected specs: `vibeusage-tracker`
- Affected code:
  - `insforge-src/functions/*usage*`
  - `insforge-src/functions/*public-view*`
  - `dashboard/src/App.jsx`
  - `dashboard/src/pages/DashboardPage.jsx`
  - `dashboard/src/lib/vibescore-api.js`
  - `dashboard/src/content/copy.csv`
  - `dashboard/vercel.json`
