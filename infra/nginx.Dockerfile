FROM nginx:1.29-alpine
RUN apk add --no-cache openssl
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/self-signed-cert.sh /docker-entrypoint.d/40-self-signed-cert.sh
# Strip CR in case the script was checked out with Windows line endings.
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-self-signed-cert.sh && chmod +x /docker-entrypoint.d/40-self-signed-cert.sh
