#!/bin/bash

if [[ $# -ne 1 ]];
then
    echo "Usage $0 <username>"
    exit 1
fi

curl -X GET "https://tim-web.fr:7777/api/user/$1?fields=match_history" --insecure
