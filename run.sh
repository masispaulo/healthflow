#!/bin/sh

# Define a porta padrão se a variável de ambiente PORT não estiver definida.
export PORT=${PORT:-8080}

# O Nginx precisa de um arquivo de configuração temporário para o envsubst funcionar.
TEMPLATE_FILE=/etc/nginx/conf.d/default.conf.template
CONFIG_FILE=/etc/nginx/conf.d/default.conf

# Move o arquivo de configuração original para servir como template.
mv $CONFIG_FILE $TEMPLATE_FILE

# Substitui a variável ${PORT} no template e salva o resultado no arquivo de configuração final.
envsubst '$PORT' < $TEMPLATE_FILE > $CONFIG_FILE

# Inicia o Nginx em primeiro plano.
nginx -g "daemon off;"
