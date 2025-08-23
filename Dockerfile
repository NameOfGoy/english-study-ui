# 多阶段构建 Dockerfile for Gas-TURBINE-MODEL-UI Frontend

# 第一阶段：构建阶段
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装必要的构建工具
RUN apk add --no-cache git

# 先复制依赖文件（利用Docker缓存层）
COPY package.json package-lock.json* ./

# 安装依赖
RUN npm install --registry=https://registry.npmmirror.com

# 复制源代码
COPY . .

# 构建应用程序
RUN npm run build

# 验证构建结果
RUN ls -la dist/ && echo "Build completed successfully"

# 第二阶段：运行阶段
FROM nginx:alpine

# 安装必要的工具
RUN apk add --no-cache curl

# 删除默认的nginx配置和静态文件
RUN rm -rf /usr/share/nginx/html/*
RUN rm /etc/nginx/conf.d/default.conf

# 从构建阶段复制构建好的前端文件
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY ./nginx.conf /etc/nginx/conf.d/nginx_console.conf

RUN chmod +x /docker-entrypoint.sh

# 暴露80端口
EXPOSE 80

# 使用自定义启动脚本, 并设置为入口点
ENTRYPOINT ["/docker-entrypoint.sh", "nginx", "-g", "daemon off;"]
