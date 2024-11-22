FROM node:20-alpine

# Create destination directory
RUN mkdir -p /usr/src/nuxt-app
WORKDIR /usr/src/nuxt-app

# Update and install dependencies
RUN apk update && apk upgrade
RUN apk add git

# Copy the app, note .dockerignore
COPY . /usr/src/nuxt-app/

# Install dependencies and build the application using npm
RUN npm install
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables for Nuxt
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Start the Nuxt server
CMD ["node", ".output/server/index.mjs"]