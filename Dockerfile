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
    
    # Copia os arquivos de build (MUITO IMPORTANTE: /app/dist é a pasta de saída do Vite)
    # Copia todo o conteúdo da pasta 'dist' do estágio anterior para o diretório de serviço do Nginx
    COPY --from=build-stage /app/dist /usr/share/nginx/html
    
    # Copia o arquivo de configuração customizado do Nginx (com a correção do MIME Type)
    COPY nginx.conf /etc/nginx/nginx.conf
    
    # Expõe a porta que o Nginx está escutando (8080)
    EXPOSE 8080
    
    # Comando padrão de start do Nginx (Não precisa de 'CMD' se for padrão)