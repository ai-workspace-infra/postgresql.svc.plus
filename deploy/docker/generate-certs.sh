#!/bin/bash
# Generate self-signed certificates for stunnel

set -e

CERTS_DIR="./certs"
DAYS=365

mkdir -p "$CERTS_DIR"

echo "🔐 Generating self-signed certificates for stunnel..."

# Generate server certificate
openssl req -new -x509 -days $DAYS -nodes \
    -out "$CERTS_DIR/server-cert.pem" \
    -keyout "$CERTS_DIR/server-key.pem" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=postgres-server"

# Combine cert and key for stunnel
cat "$CERTS_DIR/server-cert.pem" "$CERTS_DIR/server-key.pem" > "$CERTS_DIR/server.pem"

# Generate CA certificate (optional, for client verification)
openssl req -new -x509 -days $DAYS -nodes \
    -out "$CERTS_DIR/ca-cert.pem" \
    -keyout "$CERTS_DIR/ca-key.pem" \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=postgres-ca"

# Set permissions
chmod 600 "$CERTS_DIR"/*.pem
chmod 644 "$CERTS_DIR"/*-cert.pem

echo "✅ Certificates generated in $CERTS_DIR/"
echo ""
echo "Files created:"
echo "  - server-cert.pem (server certificate)"
echo "  - server-key.pem (server private key)"
echo "  - server.pem (combined cert + key)"
echo "  - ca-cert.pem (CA certificate)"
echo "  - ca-key.pem (CA private key)"
echo ""
echo "⚠️  These are self-signed certificates for testing only!"
echo "For production, use certificates from a trusted CA."
