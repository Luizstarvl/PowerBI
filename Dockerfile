FROM node:20-alpine
WORKDIR /app

# Copia manifests e código fonte
COPY package.json ./
COPY starvl-api/ ./starvl-api/
COPY starvl-app/ ./starvl-app/

# Instala dependências
RUN npm install --prefix starvl-api
RUN npm install --prefix starvl-app

# Build do React
RUN npm run build --prefix starvl-app

# Remove dependências de dev da API
RUN npm prune --omit=dev --prefix starvl-api

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["node", "starvl-api/server.js"]
