#!/bin/bash

/usr/lib/postgresql/11/bin/pg_ctl start -D /var/lib/postgresql/data

psql <<EOF
CREATE USER ${POSTGRESQL_USER} WITH PASSWORD '${POSTGRESQL_PASS}';
CREATE DATABASE ${POSTGRESQL_DATABASE} WITH OWNER ${POSTGRESQL_USER};
EOF

#psql < create_db.sql
psql -d $POSTGRESQL_DATABASE -U $POSTGRESQL_USER -f database.sql

/usr/lib/postgresql/11/bin/pg_ctl stop -D /var/lib/postgresql/data
