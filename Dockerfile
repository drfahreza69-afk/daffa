FROM node:22-alpine
WORKDIR /app
COPY package.json server.mjs defaults.json ./
COPY public ./public
ENV NODE_ENV=production
CMD ["node", "server.mjs"]
