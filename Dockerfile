FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

FROM node:22-alpine AS server
ENV NODE_ENV=production
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev
COPY server/src ./server/src
COPY --from=client-build /app/client/dist ./client/dist
EXPOSE 5000
CMD ["node", "server/src/index.js"]
