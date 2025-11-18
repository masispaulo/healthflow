# Estágio 1: Build da aplicação
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

# Estágio 2: Servidor de produção com Nginx
FROM nginx:stable-alpine

# Instala o 'gettext' para ter acesso ao comando 'envsubst'
RUN apk add --no-cache gettext

# Copia os arquivos compilados do estágio de build para o diretório do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia a configuração personalizada do Nginx. Será usada como template.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia e torna o script de inicialização executável
COPY run.sh /run.sh
RUN chmod +x /run.sh

# Expõe a porta 8080 (esta é a porta padrão que o Google Cloud Run/Render espera)
EXPOSE 8080

# Define o script de inicialização como o comando padrão
CMD ["/run.sh"]
