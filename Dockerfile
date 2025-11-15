# -------------------------------------------------------------------------
# Estágio 1: Build (Cria a pasta 'dist')
# -------------------------------------------------------------------------
    FROM node:20-alpine AS build-stage

    # Define o diretório de trabalho
    WORKDIR /app
    
    # Copia os arquivos de dependência e instala
    COPY package*.json ./
    RUN npm install
    
    # Copia o restante do código da aplicação
    COPY . .
    
    # Compila a aplicação para produção (cria a pasta 'dist')
    RUN npm run build
    
    # -------------------------------------------------------------------------
    # Estágio 2: Produção (Servir com Nginx)
    # -------------------------------------------------------------------------
    FROM nginx:stable-alpine
    
    # ========================================================================
    # A CORREÇÃO ESTÁ AQUI (Adicionamos /.)
    # Copia o CONTEÚDO da pasta /app/dist para o diretório do Nginx
    COPY --from=build-stage /app/dist/. /usr/share/nginx/html
    # ========================================================================
    
    # Copia o arquivo de configuração customizado do Nginx (com a correção do MIME Type)
    COPY nginx.conf /etc/nginx/nginx.conf
    
    # Expõe a porta que o Nginx está escutando (8080)
    EXPOSE 8080