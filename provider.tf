terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

provider "yandex" {
  token     = "y0_AgAAAAAULACzAATuwQAAAADUP269BigzZaP8R-aL3YllAM9EfWxnda8"
  cloud_id  = local.cloud_id
  folder_id = local.folder_id
  zone      = local.zone
}

locals {
  cloud_id  = "b1gd63eh2qj3euded36k"
  folder_id = "b1gi38kh5fsn2l16c6e8"
  zone      = "ru-central1-a"
}