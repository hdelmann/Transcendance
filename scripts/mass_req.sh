#!/bin/bash

if [[ $# -lt 1 ]];
then
    echo "Usage $0 <script> [OPTIONS (without token)...]"
    exit 1
fi

SCRIPT=$1

while IFS= read -r line; do
    $1 $line ${@:2}
done < /tmp/trans_tokens