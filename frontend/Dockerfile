# Build stage
FROM node:20-alpine AS build
WORKDIR /app
ARG API_BASE_URL=/api
ENV API_BASE_URL=$API_BASE_URL
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN sed -i "s|apiBaseUrl: '.*'|apiBaseUrl: '${API_BASE_URL}'|" src/environments/environment.prod.ts
RUN npm run build -- --configuration production

# Nginx stage
FROM nginx:1.27-alpine
COPY --from=build /app/dist/crawlnews-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
