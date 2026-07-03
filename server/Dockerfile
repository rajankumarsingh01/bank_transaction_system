# ---------- Base Stage ----------
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---------- Dependencies Stage ----------
FROM base AS deps
RUN npm ci --omit=dev

# ---------- Production Stage ----------
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]