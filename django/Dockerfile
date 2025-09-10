FROM debian:buster

ARG POSTGRESQL_USER
ARG POSTGRESQL_PASS
ARG POSTGRESQL_DATABASE
ARG POSTGRESQL_HOST
ARG OAUTH_UID
ARG OAUTH_SECRET
ARG OAUTH_CALLBACK
ARG DJANGO_SECRET_KEY

ENV POSTGRESQL_USER=$POSTGRESQL_USER
ENV POSTGRESQL_PASS=$POSTGRESQL_PASS
ENV POSTGRESQL_DATABASE=$POSTGRESQL_DATABASE
ENV POSTGRESQL_HOST=$POSTGRESQL_HOST
ENV OAUTH_UID=$OAUTH_UID
ENV OAUTH_SECRET=$OAUTH_SECRET
ENV DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY

# INSTALLING NEEDED PACKAGES
RUN apt update && apt -y upgrade && \
    apt install -y \
        python3 python3-distutils wget \
        gcc python3-dev postgresql libpq-dev

WORKDIR /tmp

# INSTALLING PIP + MODULES
RUN wget https://bootstrap.pypa.io/pip/3.7/get-pip.py &&    \
    python3 get-pip.py &&                                   \
    python3 -m pip install                                  \
        Django psycopg2 channels["daphne"] pillow requests

# INSTALLING NODE + CREATE NEEDED FOLDERS
RUN wget https://nodejs.org/dist/v20.13.1/node-v20.13.1-linux-x64.tar.xz && \
    tar -xf node-v20.13.1-linux-x64.tar.xz &&                               \
    mv ./node-v20.13.1-linux-x64/lib/node_modules /lib &&                   \
    mv ./node-v20.13.1-linux-x64/bin/* /bin &&                              \
    mkdir -p /root/asset /var/www/pong /root/static &&                      \
    rm -r ./node-v20.13.1-linux-x64/

# BUILDING FRONTEND
COPY ./static /tmp/frontbuild
WORKDIR /tmp/frontbuild
RUN npm install &&                  \
    npm run build &&                \
    cp -r ./dist/* /root/static

COPY ./pong /root/pong
COPY ./configure_front.py /tmp/configure_front.py
WORKDIR /root/pong

# FINAL COMMANDS
RUN python3 manage.py collectstatic && \
    python3 /tmp/configure_front.py && \
    rm -r /tmp/configure_front.py /tmp/frontbuild

EXPOSE 8001

CMD ["python3", "manage.py", "runserver", "0.0.0.0:8001"]
#RUN apt install procps
#ENV TERM=xterm
#CMD ["watch", "-n", "1", "echo aaa"]