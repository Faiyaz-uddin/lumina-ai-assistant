# Lumina

Lumina is a deliberately focused research-paper assistant that demonstrates single-node GPU LLM inference on Azure. A user supplies paper text, then Lumina summarizes it, extracts a structured research brief, or answers questions strictly from that supplied text.

It is **not** a RAG system: there are no embeddings, vector stores, retrieval services, or background indexing jobs.

## Architecture

```text
Browser -- HTTPS --> Nginx -- HTTP --> FastAPI -- HTTP --> Ollama --> Gemma 3 4B --> NVIDIA T4 GPU
```

All services run on one Ubuntu Azure `Standard_NC4as_T4_v3` VM. Nginx is the only publicly exposed application service. Ollama remains on the internal Docker network.

## Run locally

Prerequisites: Docker Compose v2 and an NVIDIA GPU with the NVIDIA Container Toolkit for GPU inference. CPU-only development is supported by removing the `gpus` block in `compose.yaml`.

```bash
cp .env.example .env
docker compose up --build -d
docker compose logs -f ollama-init
```

Open `http://localhost`. The first startup downloads `gemma3:4b`; this can take several minutes. Check `http://localhost/api/health` for the model state.

For HTTPS, place `fullchain.pem` and `privkey.pem` in `certs/` (usually from your ACME client) and start with `docker compose -f compose.yaml -f compose.production.yaml up -d`. The production override redirects HTTP to HTTPS and enables HSTS.

## API

`POST /api/analyze`

```json
{"content":"paper text", "task":"summary"}
```

Tasks: `summary`, `insights`, and `structured`. `POST /api/ask` accepts `content` and `question`. Content is sent only in the request context and is not stored by the application.

## Azure deployment

1. Log into Azure and choose a region offering NCasT4_v3 capacity.
2. Create a resource group and deploy the Bicep template (it creates a VNet, NSG, public IP, NIC, GPU VM, managed identity, and ACR):

```bash
az group create --name rg-lumina --location eastus
az deployment group create --resource-group rg-lumina --template-file infra/main.bicep \
  --parameters vmAdminUsername=azureuser sshPublicKey="$(cat ~/.ssh/id_ed25519.pub)"
```

3. Add a DNS A record for the deployment output `publicIpAddress`. For production, set `DOMAIN` to that DNS name and configure TLS before publishing.
4. The VM cloud-init installs Docker, NVIDIA drivers/toolkit, and the Compose plugin. Reboot it once, then run the deployment helper; it obtains an ACR token through the VM managed identity:

```bash
ssh azureuser@<public-ip>
export ACR_NAME=<registry-name> REPOSITORY_URL=https://github.com/<owner>/<repo>.git
curl -fsSLO https://raw.githubusercontent.com/<owner>/<repo>/main/scripts/deploy-vm.sh
chmod +x deploy-vm.sh && ./deploy-vm.sh
```

GitHub Actions builds and publishes the application image to the ACR. Configure `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`, and `ACR_NAME` GitHub secrets; use an Azure federated credential for the GitHub Actions identity.

For a production service, restrict inbound SSH to a known CIDR and set `allowedSshCidr` accordingly. Use an ACME client or your organization’s certificate process to populate the HTTPS certificate files before starting the production Compose override.

## Operations

- `GET /api/health` checks FastAPI and Ollama reachability/model availability.
- Docker JSON logs are available through `docker compose logs`; Nginx access/error logs are exposed there too.
- `scripts/benchmark.py` measures API latency and output throughput for inference workload testing.
- The compose health checks make startup order observable, while `ollama-init` idempotently pulls the model.

## Security notes

The app applies a request-size limit, never exposes Ollama publicly, and instructs the model to treat supplied paper content as data rather than instructions. This is a learning deployment: add authentication, rate limiting, TLS, secret management, monitoring export, and backup policies before handling sensitive research.
