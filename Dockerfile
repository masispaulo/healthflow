# Estágio 1: Build da aplicação
FROM node:20-alpine AS build-stage
WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia código e faz o build
COPY . .
RUN npm run build

# Estágio 2: Servidor Nginx
FROM nginx:stable-alpine

# IMPORTANTE: Copia o CONTEÚDO da pasta dist para a raiz do Nginx
COPY --from=build-stage /app/dist/. /usr/share/nginx/html

# Copia a configuração do Nginx para o lugar certo
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
