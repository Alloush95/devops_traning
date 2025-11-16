output "sa_demo_service_invoker_email" {
  value       =  google_service_account.sa_demo_service_invoker.email
  description = "Service account email used by Pub/sub to trigger the Cloud Run service"
}

output "sa_demo_service_runner_email" {
  value = google_service_account.sa_demo_service_runner.email
    description = "Service account email used by Cloud Run service to access resources"
}
