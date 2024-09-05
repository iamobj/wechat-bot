FROM node:22-alpine AS base

# 设置时区
RUN apk --update --no-cache add tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata \
    && npm i -g pnpm

# 设置环境变量
ENV NODE_ENV=production \
    APP_PATH=/node/app

# 设置工作目录
WORKDIR $APP_PATH

# 拷贝 package.json 到工作跟目录下
COPY package.json pnpm-lock.yaml .

# 安装依赖
RUN pnpm i