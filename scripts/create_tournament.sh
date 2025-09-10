#!/bin/bash

if [[ $# -ne 1 ]];
then
    echo "Usage $0 <token>"
    exit 1
fi

curl -X POST "https://tim-web.fr:7777/api/tournament/create" --header "Authorization: Bearer $1" -d '{"time_max": 60, "score_to_win": 5}'  --insecure
