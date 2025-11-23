#!/bin/sh

# Define a porta padrão se a variável de ambiente PORT não estiver definida.
export PORT=${PORT:-8080}

# Move o arquivo de configuração original para servir como template.
mv /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.template

# Substitui a variável ${PORT} no template e salva o resultado no arquivo de configuração final.
envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Inicia o Nginx em primeiro plano.
nginx -g "daemon off;"
