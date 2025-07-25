# --- Build Stage ---
# Use a Node.js image to build the static files
FROM node:18-alpine as build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the production-ready static files
RUN npm run build

# --- Production Stage ---
# Use a lightweight Nginx server to serve the static files
FROM nginx:1.25-alpine

# Copy the built static files from the build stage to the Nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy a custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# The command to start Nginx when the container starts
CMD ["nginx", "-g", "daemon off;"]