FROM node:18-alpine

WORKDIR /app

# Install development tools
RUN apk add --no-cache wget

# Install pnpm
RUN npm install -g pnpm

# Copy package files first for better caching
COPY package.json pnpm-lock.yaml ./

# Don't copy node_modules
COPY . .
RUN rm -rf node_modules

EXPOSE 3000

CMD ["sh", "-c", "pnpm install && pnpm run dev"]
