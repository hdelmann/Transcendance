#!/bin/bash

printf '' > /tmp/trans_tokens
for i in {1..100}
do
    ./scripts/create_user.sh test$i test"$i"@test.com test$i>/dev/null 2>/dev/null
    ./scripts/login_user.sh test$i test$i 2>/dev/null|jq .data.token|tr --delete '"'|tee -a /tmp/trans_tokens
done