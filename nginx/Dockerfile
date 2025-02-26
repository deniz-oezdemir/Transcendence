FROM nginx:alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /usr/share/nginx/images
# RUN chown -R nginx:www-data /usr/share/nginx/images
RUN chmod -R 777 /usr/share/nginx/images
COPY ./default.png /usr/share/nginx/images/default.png

COPY ./certs/* /etc/nginx/ssl/
RUN chmod 600 /etc/nginx/ssl/selfsigned.key
RUN chmod 644 /etc/nginx/ssl/selfsigned.crt

EXPOSE 8000 8443

CMD ["nginx", "-g", "daemon off;"]
