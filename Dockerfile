# Estágio de build
FROM node:20-alpine AS build

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
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 8080
EXPOSE 8080

# O comando padrão do Nginx já inicia o servidor, então não precisamos de um CMD
