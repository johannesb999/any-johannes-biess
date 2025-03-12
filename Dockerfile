FROM node:20-alpine

# Setze Umgebungsvariablen für bessere Fehlerausgabe
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV PATH /usr/src/nuxt-app/node_modules/.bin:$PATH

# Create app directory and set permissions
WORKDIR /usr/src/nuxt-app

# Debugging-Tools installieren
RUN apk update && apk upgrade && \
    apk add --no-cache git curl bash

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Cache einschalten und verbose-Logging für npm
RUN npm config set cache /usr/src/nuxt-app/.npm --global && \
    npm ci --verbose

# Copy the rest of the app
COPY . .

# Dummy-Umgebungsvariablen für Build-Zeit (werden später überschrieben)
ARG SUPABASE_URL=https://example.com
ARG SUPABASE_KEY=example_key

ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}

# Build mit ausführlichem Logging und Fehlerbehandlung
RUN echo "=== Starting Nuxt build process ===" && \
    echo "Node version: $(node -v)" && \
    echo "NPM version: $(npm -v)" && \
    echo "Environment: $NODE_ENV" && \
    echo "=================================" && \
    npm run build || (echo "Build failed! Detailed error log:" && cat ./.output/server/nitro.json 2>/dev/null || echo "No nitro.json found" && exit 1)

# Debug: List built files
RUN ls -la .output/server/ && \
    ls -la .output/public/ 2>/dev/null || echo "No public directory found" && \
    echo "Available files:" && \
    find .output -type f -name "*.js" | sort

# Clean up dev dependencies
RUN npm prune --production

# Create non-root user and fix permissions
RUN adduser -D nuxtuser && chown -R nuxtuser:nuxtuser /usr/src/nuxt-app
USER nuxtuser

# Set environment variables
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the app with better error handling
CMD ["sh", "-c", "node .output/server/index.mjs || (echo 'Application crashed! Check logs above for details' && exit 1)"]