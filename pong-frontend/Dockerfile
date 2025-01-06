FROM node:16-alpine

# Set work directory
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Copy project files
COPY . /app/

# Install dependencies
RUN npm install

# TODO: for some reason npm install is not insallint http-server
RUN npm install http-server

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["npm", "start"]

