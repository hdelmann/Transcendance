#!/bin/sh

if [ "$#" -ne "2" ]
then
    echo "Usage: $0 <output.key> <output.crt>"
    exit
fi

if [ ! -f "$1" ]
then
    mkdir -p $(dirname "$1") $(dirname "$2")
    openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -out "$2" -keyout "$1" \
    -subj "/C=FR/ST=Provence-Alpes-Côte d'Azur/L=Nice/O=Pong Services/OU=Pong Web Services (PWS)/CN=pong.com"
fi