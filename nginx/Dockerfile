FROM nginx:alpine

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

RUN mkdir -p /usr/share/nginx/images
RUN chmod -R 777 /usr/share/nginx/images

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]