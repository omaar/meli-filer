# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Instala tzdata para configurar la zona horaria
RUN apk add --no-cache tzdata

# Establece la zona horaria a México
ENV TZ=America/Mexico_City

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application to the working directory
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
