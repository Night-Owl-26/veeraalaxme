# Optional: use this if you'd rather deploy to Railway/Fly.io/a VPS via
# Docker instead of Render's native Node runtime.
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npx prisma generate
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/server.js"]
