# ──────────────────────────────────────────────
# Stage 1 – Builder
# ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy all source files
COPY . .

# Tell the app to use relative /api path — nginx will proxy it to the backend
ENV NEXT_PUBLIC_API_URL=/api

# Build the Next.js static export → /app/out
RUN npm run build

# ──────────────────────────────────────────────
# Stage 2 – Production (nginx serves static files)
# ──────────────────────────────────────────────
FROM nginx:alpine AS runner

# Copy the compiled static files
COPY --from=builder /app/out /usr/share/nginx/html

# Copy nginx config template
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Default backend URL (can be overridden at runtime with -e BACKEND_URL=...)
ENV BACKEND_URL=http://212.220.105.29:8079

EXPOSE 80

# envsubst replaces ${BACKEND_URL} in the template, then starts nginx
CMD ["sh", "-c", "envsubst '$BACKEND_URL' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
