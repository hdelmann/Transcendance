FROM debian:buster

RUN apt update && apt -y upgrade && \
    apt install -y postgresql postgresql-client && \
    chown postgres:postgres /var/run/postgresql

ARG POSTGRESQL_USER
ARG POSTGRESQL_PASS
ARG POSTGRESQL_DATABASE
ARG POSTGRESQL_HOST

USER postgres

RUN /usr/lib/postgresql/11/bin/initdb -D /var/lib/postgresql/data &&                \
    echo "host all all 0.0.0.0/0 md5" >> /var/lib/postgresql/data/pg_hba.conf &&    \
    echo "listen_addresses='*'" >> /var/lib/postgresql/data/postgresql.conf

COPY ./create_db.sh ./database.sql .

RUN bash create_db.sh

USER root
RUN rm create_db.sh && rm database.sql
EXPOSE 5432

USER postgres

CMD [ "/usr/lib/postgresql/11/bin/postgres", "-D", "/var/lib/postgresql/data" ]
