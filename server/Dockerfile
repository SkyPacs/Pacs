# Build stage
FROM node:18 AS build

WORKDIR /app

# Copy only package.json and lock file for better caching
COPY package.json package-lock.json ./

# Install dependencies (includes devDependencies)
RUN npm install

# Copy the rest of the app files
COPY . .

# Production stage (smaller, optimized)
FROM node:18-alpine AS production

WORKDIR /app

# Copy only essential files
COPY package.json package-lock.json ./

# Copy installed node_modules from build stage
COPY --from=build /app/node_modules ./node_modules

# Copy application source code
COPY . .

# Expose the application port
EXPOSE 5000

# Use npm start to run the application
CMD ["npm", "start"]
