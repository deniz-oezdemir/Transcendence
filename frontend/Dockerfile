FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy only package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the application (only for production)
# RUN pnpm run build

# Expose the development server port
EXPOSE 3000

# Start the development server
CMD ["pnpm", "run", "dev"]
