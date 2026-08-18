#!/usr/bin/env bash
# Run on the Azure VM after the first reboot. Requires the VM's managed identity.
set -euo pipefail

: "${ACR_NAME:?Set ACR_NAME, for example luminaabc123}"
: "${REPOSITORY_URL:?Set REPOSITORY_URL to this repository's HTTPS URL}"
APP_DIR=/opt/lumina/app
REGISTRY="${ACR_NAME}.azurecr.io"

if ! command -v az >/dev/null; then
  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi
sudo mkdir -p /opt/lumina
sudo chown "$USER":"$USER" /opt/lumina
if [ ! -d "$APP_DIR/.git" ]; then
  git clone "$REPOSITORY_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi

az login --identity >/dev/null
TOKEN=$(az acr login --name "$ACR_NAME" --expose-token --output tsv --query accessToken)
printf '%s' "$TOKEN" | docker login "$REGISTRY" --username 00000000-0000-0000-0000-000000000000 --password-stdin
cd "$APP_DIR"
cp -n .env.example .env
sed -i "s|^DOMAIN=.*|DOMAIN=${DOMAIN:-localhost}|" .env
printf '\nLUMINA_IMAGE=%s/lumina:%s\n' "$REGISTRY" "${IMAGE_TAG:-latest}" >> .env
docker compose pull api
docker compose up -d
docker compose ps
