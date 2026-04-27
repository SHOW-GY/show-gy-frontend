FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# 빌드 시 BACKEND_URL을 빈값 = 같은 호스트 (nginx 프록시)
ENV VITE_BACKEND_URL=""
# tsc 타입체크 스킵, vite build만 실행
RUN npx vite build

FROM nginx:alpine
COPY --from=builder /app/docs /usr/share/nginx/html
# SPA fallback + API 프록시 설정은 외부 nginx.conf로 주입
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
