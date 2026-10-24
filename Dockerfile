# Compila las páginas de React. La API utiliza rutas del mismo sitio.
FROM node:24-alpine AS compilacion
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=""
RUN npm run build

# Nginx muestra las páginas y reenvía las consultas al backend.
FROM nginx:stable-alpine
ENV PORT=10000
ENV NGINX_ENVSUBST_FILTER="^(PORT|BACKEND_HOST)$"
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=compilacion /app/dist /usr/share/nginx/html
EXPOSE 10000
