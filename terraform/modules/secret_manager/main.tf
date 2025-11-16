resource "google_secret_manager_secret" "secret" {
  secret_id = "${var.prefix}-demo-secret"
  labels = {
    used_in = "demo-service"
  }

  replication {
    auto {}
  }
}


# Not recommended to have teh secret data in the terraform file... this is just for demo purposes
resource "google_secret_manager_secret_version" "secret-version-basic" {
  secret = google_secret_manager_secret.secret.id

  secret_data = "secret-data"
  depends_on = [google_secret_manager_secret.secret]
}
