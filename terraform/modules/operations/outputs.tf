output "repository_id" {
  value = google_artifact_registry_repository.curamet-repo.repository_id
  description = "Repository ID where the docker images will be stored"
}
