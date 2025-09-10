#!/bin/bash

if [[ $# -ne 2 ]];
then
    echo "Usage $0 <token> <tournament>"
    exit 1
fi

curl -X POST "https://tim-web.fr:7777/api/tournament/join" --header "Authorization: Bearer $1" -d '{"tournament": "'$2'"}'  --insecure
