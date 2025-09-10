sudo docker compose down
sudo ./scripts/unbuild.sh
sudo rm -r /tmp/postgres /tmp/asset /tmp/static
sudo mkdir /tmp/postgres /tmp/asset /tmp/static
sudo docker compose up -d --build