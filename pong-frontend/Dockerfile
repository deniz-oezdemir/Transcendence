FROM node:18-slim
WORKDIR /app
RUN npm install -g http-server
COPY . .
EXPOSE 8080
CMD ["http-server", "--cors"]