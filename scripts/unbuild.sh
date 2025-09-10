#!/bin/bash

docker stop postgresql django apache2
docker system prune --all --force --volumes
docker network prune --force
docker volume prune --force
docker volume rm -f $(docker volume ls --format '{{.Name}}')
