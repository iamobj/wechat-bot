写给自己用的 wx 机器人

## CI/CD

当有代码 push 到仓库，[Actions](https://github.com/iamobj/wechat-bot/actions) 会自动按以下思路顺序执行：

1. 编译最新 docker 镜像

2. 推送到阿里云提供的 docker 镜像仓库（有免费版）

3. ssh 远程到服务器，执行更新 docker 部署脚本

   [点击我查看脚本](https://github.com/iamobj/sh/blob/main/sh/update-docker-deploy.sh)。脚本内容包括停止旧容器，重拉新镜像，然后启动；支持删除旧镜像，可通过参数配置保留最近几份

[点击我查看 actions 流程配置文件](https://github.com/iamobj/wechat-bot/blob/main/.github/workflows/deploy-docker.yml)

[怎么优化 docker 镜像](https://juejin.cn/post/6991689670027542564)

## 项目管理

[点我查看项目看板](https://github.com/iamobj/wechat-bot/projects/1)

## 功能清单

<details>
  <summary>指令控制路由器</summary>
  查看端口转发规则列表：<code>op dkzfls</code>
  <br>
  开关端口转发：<code>op dkzf {on/off} {端口号}</code>
</details>
