# Deployment Guide - Retail Sales Intelligence App

This document outlines the steps required to configure, compile, package, and deploy the Retail Sales Intelligence Application to standard production hosting environments.

---

## 1. Local Configuration

Ensure a `.env` file exists at the root folder of the project containing:

```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
NODE_ENV="production"
```

---

## 2. Compile & Production Build

The application uses an Express + Vite full-stack build script:

```bash
# Install packages
npm install

# Run full production compile
npm run build
```

The build command performs two tasks:
1. Compiles the React client application via `vite build`, outputting compiled assets directly into the `/dist` folder.
2. Compiles `/server.ts` into a single, optimized backend bundle `/dist/server.cjs` via `esbuild`.

---

## 3. Production Boot

To run the compiled full-stack server:

```bash
npm start
```

This boots the Express server which serves static client files from `/dist` and listens on `http://0.0.0.0:3000` while proxying Gemini calls.

---

## 4. Deploying to Cloud Run (GCP)

Since our server listens on `0.0.0.0:3000`, it is fully compatible with Google Cloud Run containers:

### Step 1: Create a `Dockerfile`
Create a `Dockerfile` at the root folder:

```dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

CMD [ "npm", "start" ]
```

### Step 2: Build and Deploy using gcloud CLI
```bash
# Submit build to Container Registry
gcloud builds submit --tag gcr.io/your-project-id/retail-sales-intelligence

# Deploy container on Cloud Run
gcloud run deploy retail-sales-intelligence \
  --image gcr.io/your-project-id/retail-sales-intelligence \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your_gemini_key,APP_URL=https://your-cloud-run-url"
```

The application is now live!
