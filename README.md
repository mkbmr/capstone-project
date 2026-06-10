# Maison Aura — Luxury E-Commerce Platform

> A full-stack capstone project simulating a high-end haute couture retail experience, built with modern web technologies and deployed on Microsoft Azure.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), CSS |
| Backend | Node.js, Express |
| Database | Azure SQL (MSSQL) |
| Storage | Azure Blob Storage |
| Payments | Stripe Checkout + Webhooks |
| Charts | Recharts |
| Secrets | Azure Key Vault |
| Infrastructure | Terraform |
| Containerization | Docker, Docker Compose |
| Orchestration | Azure AKS (Kubernetes) |
| CI/CD | Azure Pipeline |
| Cloud | Microsoft Azure |

---

## Features

### Storefront
- **Product Catalog** — Dynamic product listing fetched from Azure SQL, with category filtering (Men/Women) and price sorting
- **Bespoke Configurator** — Per-product configuration for sartorial cut, fabric color, and chest size
- **Private Atelier Fitting** — Customers can select a complimentary fitting service; a concierge follows up within 24 hours
- **Cart System** — Sliding drawer cart with quantity controls and real-time total calculation
- **Authentication** — Customer registration and login with bcrypt password hashing; session persists across Stripe redirect via `sessionStorage`
- **Stripe Checkout** — Hosted payment page with shipping address, billing, and phone number collection
- **Order Persistence** — Webhook-driven order and line-item storage into Azure SQL on payment completion

### Admin Portal
Accessed at `/admin/login` — not linked anywhere on the storefront.

- **Overview tab** — Revenue trend line chart and orders bar chart (last 30 days), all-time / monthly / daily stat cards, top-selling items chart and table, top-selling sizes by Men/Women
- **Stock overview** — Filterable and sortable table of all inventory variants; filter by Men/Women, sort by stock/SKU/color/size/product, search by SKU
- **Products tab** — Full product CRUD (add, edit, delete); product images shown uncropped; total stock badge per product; Stock modal to add or edit size/color/quantity variants directly from the UI
- **Customers tab** — All purchasers ranked by spend with expandable order history and per-item line detail
- **Atelier tab** — All customers who selected Private Atelier Fitting; shows name, email, phone, product, order date; admin can update status (Pending → Contacted → Scheduled → Completed) and add internal notes per request
- **Session persistence** — Admin token stored in `localStorage`; survives page refresh without re-login

---

## Project Structure

```
capstone/
├── my-react-app/                  # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx                # Root; owns all state, view routing, auth
│   │   └── App.css                # All styles including admin portal
│   ├── components/
│   │   ├── Products.jsx           # useProducts() hook — fetches from API
│   │   └── Footer.jsx
│   ├── pages/
│   │   ├── AdminDashboard.jsx     # Full admin portal (Overview/Products/Customers/Atelier)
│   │   ├── MaisonConfigurator.jsx # Product configurator with Atelier Fitting option
│   │   ├── MaisonLogin.jsx
│   │   ├── MaisonRegister.jsx
│   │   ├── MaisonAbout.jsx
│   │   ├── MaisonSpecs.jsx
│   │   ├── ContactSupport.jsx
│   │   └── CheckoutSuccess.jsx
│   ├── Dockerfile                 # Multi-stage: Node build → nginx serve
│   ├── nginx.conf                 # SPA fallback + /api/ proxy (Docker only)
│   └── vite.config.js
│
├── my-api/                        # Node.js + Express backend
│   ├── index.js                   # All routes, middleware, Stripe webhook
│   ├── .env                       # Environment variables (not committed)
│   ├── admin-migration.sql        # Run once: creates AtelierStatus table
│   └── Dockerfile
│
├── infra/
│   ├── terraform/                 # Azure infrastructure as code
│   │   ├── main.tf                # ACR + AKS + Key Vault
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   └── terraform.tfvars.example
│   └── k8s/                       # Kubernetes manifests
│       ├── namespace.yaml
│       ├── secret-provider.yaml   # Key Vault CSI driver config
│       ├── api-deployment.yaml
│       ├── api-service.yaml
│       ├── frontend-deployment.yaml
│       ├── frontend-service.yaml
│       └── ingress.yaml
│
├── azure-pipelines.yml            # CI/CD pipeline
├── docker-compose.yml             # Runs both services together locally
├── CLAUDE.md                      # Claude Code guidance
└── README.md
```

---

## Database Schema

### dbo.Products
| Column | Type | Description |
|---|---|---|
| product_id | INT IDENTITY PK | |
| product_name | NVARCHAR | Internal name |
| display_name | NVARCHAR | Shown on storefront |
| item_type | NVARCHAR | e.g. Tuxedo, Vested suit |
| sku | NVARCHAR | Stock keeping unit |
| price | FLOAT | Price in USD |
| category | NVARCHAR | `'Male'` or `'Female'` |
| tag | NVARCHAR | e.g. Limited Run, Bespoke |
| image_url | NVARCHAR | Azure Blob Storage URL |
| description | NVARCHAR | Shown in configurator |

### dbo.ProductVariants _(managed via admin Stock modal)_
| Column | Type | Description |
|---|---|---|
| variant_id | INT IDENTITY PK | |
| product_id | INT FK | → Products |
| size | VARCHAR | e.g. 38, 40, 42 |
| color | NVARCHAR | e.g. Midnight Noir |
| stock_quantity | INT | Available units |

### dbo.Customers
| Column | Type | Description |
|---|---|---|
| customer_id | INT IDENTITY PK | |
| full_name | NVARCHAR | |
| email | NVARCHAR | Login email |
| password_hash | NVARCHAR | bcrypt hashed |
| phone | NVARCHAR | |
| created_at | DATETIME | |

### dbo.Orders
| Column | Type | Description |
|---|---|---|
| order_id | INT IDENTITY PK | |
| customer_email | NVARCHAR | |
| customer_name | NVARCHAR | |
| phone | NVARCHAR | |
| shipping_name | NVARCHAR | |
| shipping_line1 | NVARCHAR | |
| shipping_line2 | NVARCHAR | |
| shipping_city | NVARCHAR | |
| shipping_state | NVARCHAR | |
| shipping_postal | NVARCHAR | |
| shipping_country | NVARCHAR | |
| total_amount | DECIMAL | |
| stripe_session_id | NVARCHAR | |
| status | NVARCHAR | e.g. paid |
| created_at | DATETIME | |

### dbo.OrderItems _(populated by Stripe webhook)_
| Column | Type | Description |
|---|---|---|
| item_id | INT IDENTITY PK | |
| stripe_session_id | NVARCHAR | |
| product_name | NVARCHAR | |
| color | NVARCHAR | |
| cut | NVARCHAR | |
| size | NVARCHAR | `'Atelier Fitting'` triggers admin follow-up |
| quantity | INT | |
| unit_price | DECIMAL(10,2) | |

### dbo.AtelierStatus _(run admin-migration.sql to create)_
| Column | Type | Description |
|---|---|---|
| item_id | INT PK | FK → OrderItems |
| status | NVARCHAR | Pending / Contacted / Scheduled / Completed |
| notes | NVARCHAR | Internal admin notes |
| updated_at | DATETIME | |

---

## Local Development

### Prerequisites
- Node.js 18+
- Docker + Docker Compose
- Stripe CLI
- Azure SQL instance (firewall must allow your IP)

### Option A — Run services directly (fastest for development)

```bash
# Terminal 1 — backend
cd my-api
npm install
npm run dev

# Terminal 2 — frontend
cd my-react-app
npm install
npm run dev

# Terminal 3 — Stripe webhook
stripe listen --forward-to localhost:5000/api/webhook
```

Frontend: http://localhost:5173  
Admin: http://localhost:5173/admin/login

### Option B — Docker Compose (test containers before cloud deploy)

```bash
docker compose up --build
```

Frontend: http://localhost  
Admin: http://localhost/admin/login

### Environment Variables

Create `my-api/.env`:
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
DB_SERVER=your-server.database.windows.net
DB_NAME=your-database
DB_USER=your-username
DB_PASSWORD=your-password
ADMIN_EMAIL=admin@maisonaura.com
ADMIN_PASSWORD=your-admin-password
ADMIN_SECRET=your-admin-secret-key
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
AZURE_STORAGE_CONTAINER=products
```

### Azure Blob Storage Setup (required for image uploads)

Product images are uploaded to Azure Blob Storage from the admin Products tab.

#### Get `AZURE_STORAGE_CONNECTION_STRING`

1. Go to [portal.azure.com](https://portal.azure.com)
2. Open your **Storage Account**
3. Left sidebar → **Security + networking** → **Access keys**
4. Click **Show** next to `key1`
5. Copy the **Connection string** — it looks like:
   ```
   DefaultEndpointsProtocol=https;AccountName=youraccount;AccountKey=xxxx...;EndpointSuffix=core.windows.net
   ```

#### Get `AZURE_STORAGE_CONTAINER`

1. In your Storage Account → **Data storage** → **Containers**
2. Copy the name of the container that holds your product images (e.g. `products`)

If the container does not exist yet:
1. Click **+ Container**
2. Name it `products`
3. Set **Public access level** to **Blob** (required so image URLs are publicly accessible)
4. Click **Create**

Uploaded images are stored under `products/<timestamp>-<random>.<ext>` and the full blob URL is automatically saved to the product's `image_url` field in Azure SQL.

The URL format will be:
```
https://<account>.blob.core.windows.net/<container>/products/<filename>
```

### Database Migration

Run `my-api/admin-migration.sql` once in Azure SQL after initial setup:
```sql
-- Creates AtelierStatus table required for the Atelier tab
-- See the file for ProductVariants population examples
```

---

## Admin Portal

Navigate to `/admin/login` — there is no visible link on the storefront.

| Tab | Description |
|---|---|
| Overview | Revenue/orders charts, stock table, top-selling items and sizes |
| Products | CRUD with image preview, stock management per variant |
| Customers | Purchase history and spend ranking |
| Atelier | Private fitting requests with contact info and status tracking |

---

## Stripe Test Payment

| Field | Value |
|---|---|
| Card Number | `4242 4242 4242 4242` |
| Expiry | Any future date |
| CVC | Any 3 digits |
| Address | Any valid address |

---

## Cloud Deployment

Follow these steps in order — each step depends on the previous one.

### Step 1 — Build images locally
Verify both Dockerfiles work before touching Azure.

```bash
# API image
docker build -t maison-aura-api:local ./my-api

# Frontend image (AKS version — no proxy_pass, Ingress handles routing)
docker build --build-arg NGINX_CONF=nginx.aks.conf \
  -t maison-aura-frontend:local ./my-react-app
```

Test locally with Docker Compose before proceeding:
```bash
docker compose up --build
# Frontend: http://localhost
```

### Step 2 — Terraform (provision Azure infrastructure)
Creates the ACR, AKS cluster, and Key Vault.

**Prerequisites:** [Terraform](https://developer.hashicorp.com/terraform/install) and [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli)

```bash
az login --tenant <your-tenant-id>

cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Fill in all secret values in terraform.tfvars
# node_vm_size must be Standard_D2s_v3 (B-series has zero quota in this subscription)
# Set app_url to your public IP or domain, e.g. http://20.197.74.212

terraform init
terraform plan
terraform apply
```

> **Notes:**
> - The resource group `maisonaura-rg` is pre-existing (contains the SQL database) and is referenced as a Terraform `data` source — it will never be created or destroyed by Terraform. All new resources (ACR, AKS, Key Vault) deploy to `southeastasia`.
> - `APP_URL` is required for Stripe to redirect back to the correct URL after payment. Set it to your public IP or custom domain.
> - If the public IP changes after a redeploy, update `app_url` in `terraform.tfvars` and re-run `terraform apply`.

Save the outputs — you'll need them in later steps:
```bash
terraform output
# acr_login_server    → ACR URL for image tags
# keyvault_client_id  → paste into Azure DevOps variable group
# tenant_id           → paste into Azure DevOps variable group
```

### Step 3 — Push images to ACR
Tag and push both images to Azure Container Registry.

```bash
ACR=maisonauraacr.azurecr.io

az acr login --name maisonauraacr

docker tag maison-aura-api:local $ACR/maison-aura-api:latest
docker tag maison-aura-frontend:local $ACR/maison-aura-frontend:latest

docker push $ACR/maison-aura-api:latest
docker push $ACR/maison-aura-frontend:latest
```

### Step 4 — Verify Key Vault secrets
Terraform already created and populated all secrets. Verify they are present:

```bash
az keyvault secret list --vault-name maisonaura-kv --query "[].name" -o table
```

You should see all 11 secrets (STRIPE-SECRET-KEY, DB-SERVER, etc.).

### Step 5 — Deploy to AKS
Connect kubectl to the cluster and apply all Kubernetes manifests.

```bash
az aks get-credentials --resource-group maison-aura-rg --name maison-aura-aks

# Install nginx Ingress Controller (first time only)
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

# Substitute placeholders in manifests (replace values from terraform output)
sed -i "s|__ACR_LOGIN_SERVER__|maisonauraacr.azurecr.io|g"  infra/k8s/*.yaml
sed -i "s|__BUILD_ID__|latest|g"                             infra/k8s/*.yaml
sed -i "s|__KEY_VAULT_NAME__|maisonaura-kv|g"                infra/k8s/*.yaml
sed -i "s|__TENANT_ID__|<your-tenant-id>|g"                  infra/k8s/*.yaml
sed -i "s|__KEYVAULT_CLIENT_ID__|<your-client-id>|g"         infra/k8s/*.yaml

# Apply manifests
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/secret-provider.yaml
kubectl apply -f infra/k8s/api-service.yaml
kubectl apply -f infra/k8s/api-deployment.yaml
kubectl apply -f infra/k8s/frontend-service.yaml
kubectl apply -f infra/k8s/frontend-deployment.yaml
kubectl apply -f infra/k8s/ingress.yaml

# Check everything is running
kubectl get pods -n maison-aura
kubectl get ingress -n maison-aura   # shows the external IP
```

### Step 6 — Azure DevOps Pipeline
Automates build, scan, and deploy on every push to `main`. **Not configured by Terraform — requires manual setup.**

#### 6a — Create a Service Connection
1. Go to [dev.azure.com](https://dev.azure.com) → open your project
2. **Project Settings** → **Service Connections** → **New service connection**
3. Select **Azure Resource Manager** → click **Next**
4. Configure the form:
   - **Identity type:** App registration (automatic)
   - **Credential:** Workload identity federation
   - **Scope level:** Subscription
   - **Subscription:** Azure subscription 1 (3559b164...)
   - **Resource group:** `maisonaura-rg` — select this specifically, not `MC_maisonaura-rg_*` (AKS internal) or `NetworkWatcherRG` (Azure auto-created)
   - **Service Connection Name:** `maison-aura-sc`
   - **Security:** tick **Grant access permission to all pipelines**
5. Click **Save**

#### 6b — Create the Variable Group
**Pipelines → Library → + Variable group** — name it exactly `maison-aura-vars`:

| Variable | Value |
|---|---|
| `AZURE_SERVICE_CONNECTION` | name from step 6a |
| `ACR_NAME` | `maisonauraacr` |
| `AKS_RESOURCE_GROUP` | `maisonaura-rg` |
| `AKS_CLUSTER_NAME` | `maison-aura-aks` |
| `KEY_VAULT_NAME` | `maisonaura-kv` |
| `TENANT_ID` | from `terraform output tenant_id` |
| `KEYVAULT_CLIENT_ID` | from `terraform output keyvault_client_id` |

#### 6c — Self-hosted Agent (required)
Microsoft-hosted agents are not available on the free tier for new Azure DevOps organizations. A self-hosted agent on Linux/WSL2 is required.

**Register the agent:**
1. **Organization Settings** → **Agent pools** → **New pool** → name it (e.g. `Bazooka-Desktop`)
2. Inside the pool → **New agent** → follow the Linux download + config steps
3. Run `./run.sh` to start the agent (or install as a service with `./svc.sh install && ./svc.sh start`)
4. Verify it shows **Online** in the pool's Agents tab

Update `azure-pipelines.yml` pool to match your agent pool name:
```yaml
pool:
  name: Bazooka-Desktop   # replace with your pool name
```

> **Alternative:** Submit a free parallel job grant request at https://aka.ms/azpipelines-parallelism-request (2–3 business day wait) to use Microsoft-hosted `ubuntu-latest` instead.

#### 6d — Create the Pipeline
1. **Pipelines** → **New Pipeline** → **Azure Repos Git** → select this repo
2. Select **Existing Azure Pipelines YAML file**
3. Branch: `main`, Path: `/azure-pipelines.yml` → **Continue** → **Run**

**Pipeline stages:**
- **SecurityScan** — `npm audit` on both packages + Checkov on Terraform and K8s manifests (soft-fail)
- **Build** — builds both Docker images, Trivy scans for HIGH/CRITICAL CVEs, pushes to ACR tagged with `$(Build.BuildId)`
- **Deploy** — substitutes `__PLACEHOLDER__` values in K8s manifests, applies to AKS, waits for rollout, prints external IP

> **Note:** Checkov is installed via `pip3 install checkov --break-system-packages` and called with `export PATH=$HOME/.local/bin:$PATH` on the self-hosted Linux agent. Trivy is also installed to `$HOME/.local/bin` to avoid requiring sudo.

---

## Security Notes

- **CVE-2026-6732 (libxml2)** — patched in `my-react-app/Dockerfile` via `RUN apk upgrade --no-cache` in the nginx stage. This upgrades `libxml2` from `2.13.9-r0` to `2.13.9-r1` at build time, resolving the HIGH severity DoS vulnerability detected by Trivy.

---

## Troubleshooting

### API pod in CrashLoopBackOff — `Cannot find module './config'`
`config.js` was previously in `.gitignore`. The pipeline checks code out from git, so the file was missing from the Docker build. Fix: `config.js` is now tracked in git (it contains no secrets — only reads from `process.env`).

### Configurator shows no sizes/colors (`404 /api/products/:id/variants`)
Old pods built before the public variants route was added continued running after a failed rollout. Root cause was a missing `APP-URL` secret in Key Vault, which prevented new pods from mounting secrets and starting.

**Fix:**
1. Add the missing secret to Key Vault:
   ```bash
   az keyvault secret set --vault-name maisonaura-kv --name APP-URL --value "http://<your-ip-or-domain>"
   ```
2. If Terraform already manages this secret and conflicts, import it:
   ```bash
   terraform import 'azurerm_key_vault_secret.secrets["APP-URL"]' "<secret-resource-id>"
   terraform apply
   ```
3. Restart the API deployment to pick up the new secret:
   ```bash
   kubectl rollout restart deployment/maison-aura-api -n maison-aura
   kubectl rollout status deployment/maison-aura-api -n maison-aura
   ```

### Pods stuck on old image after pipeline deploy
Check which image each pod is running:
```bash
kubectl get pods -n maison-aura -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
```
If old pods remain, force a restart:
```bash
kubectl rollout restart deployment/maison-aura-api -n maison-aura
kubectl rollout restart deployment/maison-aura-frontend -n maison-aura
```

---

## Docker & AKS Notes

In Docker Compose, `nginx.conf` proxies `/api/` to the backend container (`http://api:5000`) and serves the React SPA with a fallback for client-side routing.

When deploying to **Azure AKS**, the `proxy_pass` block in `nginx.conf` should be removed — the Kubernetes Ingress controller handles `/api/` routing. The `try_files` SPA fallback must be kept. A Kubernetes `Ingress` manifest is needed to split traffic between frontend and backend services.

---

## Azure Architecture

```
Internet
    │
    ▼
AKS Ingress Controller
    ├── /api/*  ──► backend Service ──► Node.js Pod ──► Azure SQL
    └── /*      ──► frontend Service ──► nginx Pod (React SPA)
                                              │
                                         Azure Blob Storage
                                         (product images)
```

---

## Author

**Khalis**
- GitHub: [@mkbmr](https://github.com/mkbmr)

---

## License

This project is for educational purposes as part of a full-stack capstone submission.
