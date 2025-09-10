#!/bin/bash

if [[ $# -ne 1 ]];
then
    echo "Usage $0 <token>"
    exit 1
fi

curl "https://tim-web.fr:7777/api/friends/" --header "Authorization: Bearer $1" --insecure