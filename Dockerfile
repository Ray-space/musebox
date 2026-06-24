FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
WORKDIR /app/apps/web
RUN npm install && npm run build

FROM node:20-alpine AS runner
WORKDIR /app/apps/web
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/public ./public
EXPOSE 3000
CMD ["npm", "start"]
