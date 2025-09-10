#!/bin/bash

if [[ $# -ne 3 ]];
then
    echo "Usage $0 <username> <email> <password>"
    exit 1
fi

curl -d '{"username": '"\"$1\""', "password": '"\"$3\""', "email": '"\"$2\""'}' 'https://tim-web.fr:7777/api/auth/register' -X POST --insecure
