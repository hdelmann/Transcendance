#!/bin/bash

if [[ $# -ne 2 ]];
then
    echo "Usage $0 <login> <password>"
    exit 1
fi

curl -d '{"login": '"\"$1\""', "password": '"\"$2\""'}' 'https://tim-web.fr:7777/api/auth/connect' -X POST --insecure
