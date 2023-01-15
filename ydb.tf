locals {
  database_name = "compliments-database"
}

resource "yandex_ydb_database_serverless" "compliments_database" {
  name      = local.database_name
  folder_id = local.folder_id
}

output "compliments_database_document_api_endpoint" {
  value = yandex_ydb_database_serverless.compliments_database.document_api_endpoint
}

output "compliments_database_path" {
  value = yandex_ydb_database_serverless.compliments_database.database_path
}