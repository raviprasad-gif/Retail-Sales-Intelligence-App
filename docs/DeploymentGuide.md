# Retail Sales Intelligence App - Deployment Guide

This guide details instructions on how to package, deploy, and scale the application in a secure production or cloud server environment.

---

## ⚡ Quick Deployment on Cloud Run

Since the application is written as an Express server serving compiled Vite static assets, it can be deployed on Google Cloud Run or any standard container host (AWS ECS, Docker, DigitalOcean App Platform, etc.) in minutes.

### 1. Configure Production Environment Variables

Define variables in your hosting environment (do not check secrets into your git repository):

```env
# Production Node Environment
NODE_ENV=production

# OPTIONAL: Configure Gemini AI for automated strategic insights
GEMINI_API_KEY=AIzaSyYourActualSecretAPIKeyHere
```

### 2. Build the Production Bundle

Run the combined build task to generate production assets and bundle the backend code:

```bash
npm run build
```

This task compiles:
1. React static assets, saving them in the `./dist` folder.
2. The server script `./server.ts`, packaging it into a single, bundled CommonJS file `./dist/server.cjs` via `esbuild`.

### 3. Start the Production Server

Launch the production server using the compiled CJS file:

```bash
npm start
```

This runs the server on `0.0.0.0:3000` which is the standard port for container ingress.

---

## 🐳 Docker Deployment

The application includes a standard, lightweight multi-stage Docker build configuration.

### Sample `Dockerfile`

Create a `Dockerfile` in the project root:

```dockerfile
# Stage 1: Build static React SPA and compile server.ts
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production runtime image
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

Build and run your container:

```bash
docker build -t retail-sales-intelligence:latest .
docker run -p 3000:3000 -e GEMINI_API_KEY="your_api_key_here" retail-sales-intelligence:latest
```

---

## 🌐 Reverse Proxy Configuration (Nginx)

For high-concurrency production deployments, we recommend serving static assets through Nginx and proxying api requests to the Node server:

```nginx
server {
    listen 80;
    server_name retail-intelligence.yourcompany.com;

    # Serve static React files directly from disk
    location / {
        root /var/www/retail-sales-intelligence/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy REST API requests to Express server on port 3000
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
