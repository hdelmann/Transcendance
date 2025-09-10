FROM debian:buster

RUN apt update && apt install -y apache2

RUN rm /etc/apache2/sites-enabled/*
RUN mkdir -p /var/www/pong
RUN mkdir -p /etc/apache2/certificate

COPY ./conf/* /etc/apache2/sites-enabled/
COPY ./certs/* /etc/apache2/certificate/

COPY generate_keys.sh .
RUN chmod +x generate_keys.sh && ./generate_keys.sh \
    /etc/apache2/certificate/pong.key \
    /etc/apache2/certificate/pong.crt && rm ./generate_keys.sh

RUN a2enmod proxy
RUN a2enmod proxy_http
RUN a2enmod proxy_wstunnel
RUN a2enmod ssl
RUN a2enmod rewrite

EXPOSE 80

CMD ["apache2ctl", "-DFOREGROUND"]
