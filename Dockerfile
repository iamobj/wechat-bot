FROM iamc/wechat-bot:base

# 将当前目录下的所有文件（除了.dockerignore排除的路径），都拷贝进入镜像的工作目录下
COPY . .

# 启动
CMD yarn start