FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN mkdir -p /app/data /app/public/assets/uploads \
  && npm run build:client

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm run start"]
