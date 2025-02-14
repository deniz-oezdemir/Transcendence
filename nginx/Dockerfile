FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /usr/share/nginx/static/avatars
RUN chmod -R 777 /usr/share/nginx/static/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]