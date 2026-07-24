# frontend/Dockerfile

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json .
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────
FROM nginx:alpine

# copy built React files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80