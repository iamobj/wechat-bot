FROM iamccc/alpine-node:14.19.0 AS base

# 设置时区
RUN apk --update --no-cache add tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata

# 设置环境变量
ENV NODE_ENV=production \
    APP_PATH=/node/app

# 设置工作目录
WORKDIR $APP_PATH

# 拷贝 package.json 到工作跟目录下
COPY package.json .

# 安装依赖
RUN yarn