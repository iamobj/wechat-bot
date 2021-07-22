# 安装依赖阶段
FROM mhart/alpine-node:14.17.3 AS install

# 设置时区
RUN apk --update --no-cache add tzdata \
    && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
    && echo "Asia/Shanghai" > /etc/timezone \
    && apk del tzdata

# 设置环境变量
ENV NODE_ENV='production' \
    APP_PATH=/node/app

# 设置工作目录
WORKDIR $APP_PATH

# 暴露端口
EXPOSE 4300

COPY package.json $APP_PATH/package.json
RUN yarn

# 把当前目录下的所有文件拷贝到镜像的工作目录下 .dockerignore 指定的文件不会拷贝
COPY . $APP_PATH

CMD yarn start