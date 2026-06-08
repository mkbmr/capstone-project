# Maison Aura — Luxury E-Commerce Platform

> A full-stack capstone project simulating a high-end haute couture retail experience, built with modern web technologies and deployed on Microsoft Azure.

---

## 🏛️ Overview

Maison Aura is a full-stack web application that demonstrates end-to-end software engineering across frontend development, REST API design, cloud infrastructure, payment integration, and infrastructure-as-code. The platform allows customers to browse a luxury clothing catalog, configure bespoke garment options, and complete purchases via Stripe Checkout.

---

## 🖥️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), CSS |
| Backend | Node.js, Express |
| Database | Azure SQL (MSSQL) |
| Storage | Azure Blob Storage |
| Payments | Stripe Checkout + Webhooks |
| Secrets | Azure Key Vault |
| Infrastructure | Terraform |
| Containerization | Docker |
| CI/CD | GitHub Actions |
| Cloud | Microsoft Azure |

---

## ✨ Features

- **Product Catalog** — Dynamic product listing fetched from Azure SQL, with category filtering and price sorting
- **Bespoke Configurator** — Per-product configuration for sartorial cut, fabric color, and chest size
- **Cart System** — Sliding drawer cart with quantity controls and real-time total calculation
- **Authentication** — Customer registration and login with bcrypt password hashing
- **Stripe Checkout** — Hosted payment page with shipping address, billing, and phone number collection
- **Order Management** — Webhook-driven order persistence capturing full customer and shipping details into Azure SQL
- **Cloud Image Hosting** — Product images served from Azure Blob Storage (Hot tier)
- **Infrastructure as Code** — Azure resources provisioned via Terraform
- **Secret Management** — Sensitive credentials managed via Azure Key Vault
- **Containerized** — Backend packaged with Docker for consistent deployment
- **CI/CD Pipeline** — Automated build, test, and deployment via GitHub Actions

---

## 🗂️ Project Structure

```
capstone-project/
├── my-react-app/          # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── components/
│   │   │   ├── Products.jsx      # useProducts hook — fetches from API
│   │   │   └── Footer.jsx
│   │   └── pages/
│   │       ├── MaisonLogin.jsx
│   │       ├── MaisonRegister.jsx
│   │       ├── MaisonConfigurator.jsx
│   │       ├── MaisonAbout.jsx
│   │       ├── MaisonSpecs.jsx
│   │       ├── ContactSupport.jsx
│   │       └── CheckoutSuccess.jsx
│
├── my-api/                # Node.js + Express backend
│   ├── index.js           # API routes and Stripe webhook
│   ├── config.js          # Azure SQL connection config
│   ├── .env               # Environment variables (not committed)
│   ├── Dockerfile
│   └── package.json
│
├── terraform/             # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
│
├── .github/
│   └── workflows/
│       └── deploy.yml     # CI/CD pipeline
│
└── README.md
```

---

## ☁️ Azure Architecture

```
                        ┌─────────────────────┐
                        │   React Frontend     │
                        │   (Vite / Static)    │
                        └────────┬────────────┘
                                 │ HTTP
                        ┌────────▼────────────┐
                        │   Express REST API   │
                        │   (Node.js / Docker) │
                        └──┬─────────┬────────┘
                           │         │
              ┌────────────▼──┐  ┌───▼──────────────┐
              │  Azure SQL DB  │  │ Azure Blob Storage│
              │  - Products    │  │ - Product Images  │
              │  - Customers   │  └───────────────────┘
              │  - Orders      │
              │  - Variants    │
              └────────────────┘
                           │
              ┌────────────▼──────────┐
              │   Azure Key Vault      │
              │   - SQL credentials    │
              │   - Stripe secret key  │
              │   - Webhook secret     │
              └───────────────────────┘
```

---

## 🗄️ Database Schema

### Products
| Column | Type | Description |
|---|---|---|
| product_id | INT | Primary key |
| product_name | NVARCHAR | Full product name |
| category | NVARCHAR | Male / Female |
| price | DECIMAL | Price in USD |
| sku | NVARCHAR | Stock keeping unit |
| description | NVARCHAR | Product description |
| image_url | NVARCHAR | Azure Blob Storage URL |
| display_name | NVARCHAR | Short display name |
| item_type | NVARCHAR | e.g. Tuxedo, Vested suit |
| tag | NVARCHAR | e.g. Limited Run, Bespoke |

### ProductVariants
| Column | Type | Description |
|---|---|---|
| variant_id | INT | Primary key |
| product_id | INT | Foreign key → Products |
| size | NVARCHAR | Chest size |
| color | NVARCHAR | Fabric color |
| stock_quantity | INT | Available stock |

### Customers
| Column | Type | Description |
|---|---|---|
| customer_id | INT | Primary key |
| full_name | NVARCHAR | Customer name |
| email | NVARCHAR | Login email |
| password_hash | NVARCHAR | bcrypt hashed password |
| phone | NVARCHAR | Contact number |

### Orders
| Column | Type | Description |
|---|---|---|
| order_id | INT | Primary key |
| customer_email | NVARCHAR | Buyer email |
| customer_name | NVARCHAR | Buyer name |
| phone | NVARCHAR | Buyer phone |
| shipping_name | NVARCHAR | Recipient name |
| shipping_line1 | NVARCHAR | Address line 1 |
| shipping_line2 | NVARCHAR | Address line 2 |
| shipping_city | NVARCHAR | City |
| shipping_state | NVARCHAR | State |
| shipping_postal | NVARCHAR | Postal code |
| shipping_country | NVARCHAR | Country code |
| total_amount | DECIMAL | Order total |
| stripe_session_id | NVARCHAR | Stripe session reference |
| status | NVARCHAR | e.g. paid |
| created_at | DATETIME | Timestamp |

---

## 🔑 Azure Key Vault

Sensitive credentials are stored in Azure Key Vault and injected at runtime — no secrets are hardcoded or committed to source control.

Secrets stored:
- `sql-connection-string` — Azure SQL connection string
- `stripe-secret-key` — Stripe API secret key
- `stripe-webhook-secret` — Stripe webhook signing secret

---

## 🏗️ Infrastructure — Terraform

All Azure resources are provisioned via Terraform:

```hcl
# Resources managed by Terraform:
# - Resource Group
# - Azure SQL Server + Database
# - Azure Storage Account + Container
# - Azure Key Vault
# - App Service Plan + Web App (backend)
# - Static Web App (frontend)
```

To provision:
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## 🐳 Docker

The backend API is containerized for consistent local and cloud deployment.

```bash
# Build image
docker build -t maison-aura-api ./my-api

# Run container
docker run -p 5000:5000 --env-file ./my-api/.env maison-aura-api
```

---

## ⚙️ CI/CD — GitHub Actions

On every push to `main`:
1. Runs lint and build checks
2. Builds Docker image
3. Pushes to Azure Container Registry
4. Deploys backend to Azure Web App
5. Deploys frontend to Azure Static Web Apps

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- Docker
- Stripe CLI
- Azure SQL instance

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/mkbmr/Capstone-Project.git
cd Capstone-Project

# 2. Backend
cd my-api
npm install
cp .env.example .env   # fill in your credentials
npm run dev

# 3. Stripe webhook listener (separate terminal)
stripe listen --forward-to localhost:5000/api/webhook

# 4. Frontend (separate terminal)
cd my-react-app
npm install
npm run dev
```

### Environment Variables

Create `my-api/.env`:
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxx
SQL_SERVER=your-server.database.windows.net
SQL_DATABASE=your-database
SQL_USER=your-username
SQL_PASSWORD=your-password
```

---

## 💳 Test Payment

Use Stripe test card details on the checkout page:

| Field | Value |
|---|---|
| Card Number | `4242 4242 4242 4242` |
| Expiry | Any future date |
| CVC | Any 3 digits |
| Address | Any valid address |

---

## 📸 Screenshots

> _Add screenshots of the catalog, product configurator, cart drawer, Stripe checkout, and order success page here._

---

## 👤 Author

**mkbmr**
- GitHub: [@mkbmr](https://github.com/mkbmr)

---

## 📄 License

This project is for educational purposes as part of a full-stack capstone submission.