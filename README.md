# 🎤 EngAI — English Speaking Practice

Web app luyện tiếng Anh tập trung vào kỹ năng nói, sử dụng AI để tạo nội dung và phân tích phát âm theo thời gian thực.

## Tính năng

- **📖 Reading Practice** — Claude tạo đoạn văn theo level và chủ đề, đọc qua mic, app highlight từng từ đúng (xanh) / sai (đỏ) / bỏ qua (xám) theo thời gian thực
- **💬 Conversation Practice** — Hội thoại với nhân vật AI theo nhiều kịch bản, phản hồi streaming, feedback phát âm sau mỗi lượt nói
- **🔐 Authentication** — Đăng ký / đăng nhập, lưu tiến độ để dùng trên nhiều thiết bị

## Yêu cầu

- Node.js 18+
- **Google Chrome hoặc Microsoft Edge** (Web Speech API không hỗ trợ Firefox/Safari)
- Anthropic API key

## Cài đặt

### 1. Lấy Anthropic API Key

1. Tạo tài khoản tại [console.anthropic.com](https://console.anthropic.com)
2. Vào **API Keys** → nhấn **Create Key**
3. Copy key (dạng `sk-ant-...`)

> Tài khoản mới có **$5 free credit**. Model Haiku đang dùng rất rẻ (~$0.0002/lần generate passage).

### 2. Clone và cài dependencies

```bash
git clone <repo-url>
cd engAI
npm install
```

### 3. Tạo file `.env.local`

```bash
cp .env.example .env.local
```

Sau đó mở `.env.local` và điền các giá trị:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="chạy lệnh: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
ANTHROPIC_API_KEY="sk-ant-..."
```

### 4. Khởi tạo database

```bash
npx prisma migrate deploy
```

### 5. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) trên **Chrome hoặc Edge**.

## Scripts

```bash
npm run dev          # Chạy dev server
npm run build        # Build production
npm run start        # Chạy production server
npm run db:migrate   # Chạy database migrations
npm run db:studio    # Mở Prisma Studio (xem DB)
```

## Deploy lên server

### Yêu cầu server

- Node.js 18+
- **HTTPS bắt buộc** — trình duyệt chặn mic trên HTTP

### Các bước

```bash
# 1. Copy code lên server
# 2. Cài dependencies
npm install

# 3. Tạo .env.local với production values
# NEXTAUTH_URL phải là URL thực của server
# NEXTAUTH_SECRET phải đủ ngẫu nhiên: openssl rand -base64 32

# 4. Chạy migration
npx prisma migrate deploy

# 5. Build
npm run build

# 6. Start (dùng PM2 để giữ process)
npm install -g pm2
pm2 start npm --name "engai" -- start
```

### Nginx config (cho streaming SSE)

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_buffering off;          # Quan trọng cho streaming conversation
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Stack

| Công nghệ | Mục đích |
|-----------|----------|
| Next.js 16 (App Router) | Frontend + Backend |
| TypeScript + Tailwind CSS | Language + Styling |
| SQLite + Prisma v7 | Database |
| NextAuth.js v5 | Authentication |
| Web Speech API | Speech-to-Text (miễn phí, built-in Chrome) |
| Anthropic Claude Haiku | AI content generation |
