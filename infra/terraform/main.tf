terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }

  # Uncomment after bootstrapping state storage (see README steps):
  # backend "azurerm" {
  #   resource_group_name  = "maison-aura-tfstate-rg"
  #   storage_account_name = "maisonatfstate"
  #   container_name       = "tfstate"
  #   key                  = "maison-aura.tfstate"
  # }
}

provider "azurerm" {
  features {
    key_vault {
      purge_soft_delete_on_destroy    = true
      recover_soft_deleted_key_vaults = true
    }
  }
}

data "azurerm_client_config" "current" {}

# ── Resource Group ────────────────────────────────────────────────────────────
# Read the existing RG — Terraform will not create or delete it.

data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

# ── Azure Container Registry ──────────────────────────────────────────────────

resource "azurerm_container_registry" "acr" {
  name                = var.acr_name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = false
}

# ── AKS Cluster ───────────────────────────────────────────────────────────────

resource "azurerm_kubernetes_cluster" "aks" {
  name                = var.aks_cluster_name
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  dns_prefix          = var.aks_cluster_name

  default_node_pool {
    name       = "default"
    node_count = var.node_count
    vm_size    = var.node_vm_size
  }

  identity {
    type = "SystemAssigned"
  }

  key_vault_secrets_provider {
    secret_rotation_enabled = true
  }

  network_profile {
    network_plugin = "azure"
    load_balancer_sku = "standard"
  }
}

# Allow AKS kubelet to pull images from ACR
resource "azurerm_role_assignment" "aks_acr_pull" {
  principal_id                     = azurerm_kubernetes_cluster.aks.kubelet_identity[0].object_id
  role_definition_name             = "AcrPull"
  scope                            = azurerm_container_registry.acr.id
  skip_service_principal_aad_check = true
}

# ── Key Vault ─────────────────────────────────────────────────────────────────

resource "azurerm_key_vault" "kv" {
  name                = var.key_vault_name
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = data.azurerm_resource_group.rg.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  # Terraform service principal — can manage secrets
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = ["Get", "List", "Set", "Delete", "Purge", "Recover"]
  }

  # AKS CSI driver managed identity — read-only
  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = azurerm_kubernetes_cluster.aks.key_vault_secrets_provider[0].secret_identity[0].object_id

    secret_permissions = ["Get"]
  }
}

# ── Key Vault Secrets (all .env values) ───────────────────────────────────────

locals {
  secrets = {
    STRIPE-SECRET-KEY               = var.stripe_secret_key
    STRIPE-WEBHOOK-SECRET           = var.stripe_webhook_secret
    DB-SERVER                       = var.db_server
    DB-NAME                         = var.db_name
    DB-USER                         = var.db_user
    DB-PASSWORD                     = var.db_password
    ADMIN-EMAIL                     = var.admin_email
    ADMIN-PASSWORD                  = var.admin_password
    ADMIN-SECRET                    = var.admin_secret
    AZURE-STORAGE-CONNECTION-STRING = var.azure_storage_connection_string
    AZURE-STORAGE-CONTAINER         = var.azure_storage_container
  }
}

resource "azurerm_key_vault_secret" "secrets" {
  for_each     = local.secrets
  name         = each.key
  value        = each.value
  key_vault_id = azurerm_key_vault.kv.id
}
