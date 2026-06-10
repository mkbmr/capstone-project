variable "resource_group_name" {
  default = "maison-aura-rg"
}

variable "location" {
  default = "southeastasia"
}

variable "acr_name" {
  description = "Azure Container Registry name (globally unique, alphanumeric only)"
  default     = "maisonauraacr"
}

variable "aks_cluster_name" {
  default = "maison-aura-aks"
}

variable "key_vault_name" {
  description = "Key Vault name (globally unique, 3-24 chars)"
  default     = "maisonaura-kv"
}

variable "node_count" {
  default = 1
}

variable "node_vm_size" {
  default = "Standard_D2als_v7"
}

variable "stripe_secret_key" {
  sensitive = true
}

variable "stripe_webhook_secret" {
  sensitive = true
}

variable "db_server" {}

variable "db_name" {}

variable "db_user" {}

variable "db_password" {
  sensitive = true
}

variable "admin_email" {}

variable "admin_password" {
  sensitive = true
}

variable "admin_secret" {
  sensitive = true
}

variable "azure_storage_connection_string" {
  sensitive = true
}

variable "azure_storage_container" {}

variable "app_url" {
  description = "Public URL of the app — used for Stripe success/cancel redirect URLs"
  default     = ""
}
