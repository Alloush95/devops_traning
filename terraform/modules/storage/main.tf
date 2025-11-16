resource "google_storage_bucket" "bucket" {
  name          = "${var.prefix}-curamet-bucket"
  location      = "EU"
  force_destroy = true

  uniform_bucket_level_access = true
}

resource "google_storage_bucket_iam_member" "bucket_iam_member" {
  bucket = google_storage_bucket.bucket.name
  role = "roles/storage.objectCreator"
  member = "serviceAccount:${var.runner_service_account}"
  depends_on = [google_storage_bucket.bucket]
}
