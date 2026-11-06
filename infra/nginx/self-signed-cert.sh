#!/bin/sh
# Runs from /docker-entrypoint.d before nginx starts. Creates a self-signed certificate for local use
# when none is mounted. In production, mount real certificates at the same paths and this does nothing.
set -eu

dir=/etc/nginx/certs
if [ -f "$dir/fullchain.pem" ] && [ -f "$dir/privkey.pem" ]; then
    exit 0
fi

# CERT_HOSTS: comma-separated host names and IPv4 addresses the cert must cover,
# e.g. "localhost,192.168.1.50" so a phone on the LAN can open https://192.168.1.50.
san=""
for host in $(echo "${CERT_HOSTS:-localhost}" | tr ',' ' '); do
    case "$host" in
        *[!0-9.]*) san="$san,DNS:$host" ;;
        *) san="$san,IP:$host" ;;
    esac
done

mkdir -p "$dir"
openssl req -x509 -newkey rsa:2048 -nodes -days 825 \
    -subj "/CN=airsoft-tactical-map local" \
    -addext "subjectAltName=${san#,}" \
    -keyout "$dir/privkey.pem" -out "$dir/fullchain.pem" 2>/dev/null
echo "self-signed-cert: created certificate for ${CERT_HOSTS:-localhost}"
