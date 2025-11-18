# Estágio de build
FROM node:20-alpine AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código da aplicação
COPY . .

# Compila a aplicação para produção
RUN npm run build

# Estágio de produção
FROM nginx:stable-alpine

# Copia os arquivos da compilação do estágio de build para o diretório do Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia o arquivo de configuração customizado do Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expõe a porta 8080
EXPOSE 8080
