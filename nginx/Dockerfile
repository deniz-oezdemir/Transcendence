FROM nginx:alpine

RUN mkdir -p /usr/share/nginx/images /etc/nginx/ssl

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

RUN adduser -D -g 'www' www
RUN chown -R www:www /usr/share/nginx/images
RUN chmod -R 755 /usr/share/nginx/images

COPY ./default.png /usr/share/nginx/images/default.png
# RUN chown -R nginx:www-data /usr/share/nginx/images
# RUN chmod -R 777 /usr/share/nginx/images
# COPY ./default.png /usr/share/nginx/images/default.png

COPY ./certs/* /etc/nginx/ssl/
RUN chmod 600 /etc/nginx/ssl/selfsigned.key
RUN chmod 644 /etc/nginx/ssl/selfsigned.crt

CMD ["nginx", "-g", "daemon off;"]
