FROM node:20-alpine

# Create app directory and set permissions
RUN mkdir -p /usr/src/nuxt-app
WORKDIR /usr/src/nuxt-app

# Update and install dependencies in one layer
RUN apk update && apk upgrade && apk add git

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the app
COPY . .

# Build the application
RUN npm run build

# Debug: List built files to verify output
RUN ls -la .output/server/

# Create non-root user and fix permissions
RUN adduser -D nuxtuser && chown -R nuxtuser:nuxtuser /usr/src/nuxt-app
USER nuxtuser

# Set environment variables
ENV NODE_ENV=production
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Expose the port
EXPOSE 3000

# Start the app
CMD ["node", ".output/server/index.mjs"]