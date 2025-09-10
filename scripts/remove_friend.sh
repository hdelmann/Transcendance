#!/bin/bash

if [[ $# -ne 2 ]];
then
    echo "Usage $0 <token> <username>"
    exit 1
fi

curl -X POST "https://tim-web.fr:7777/api/friends/remove" --header "Authorization: Bearer $1" -d '{"username":"'"$2"'"}'  --insecure