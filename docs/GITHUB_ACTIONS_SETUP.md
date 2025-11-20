# GitHub Actions CI/CD Setup Guide

This document describes the GitHub Actions workflows configured for this project and the required setup steps.

## Overview

Three GitHub Actions workflows are configured:

1. **Deploy to Production (Main)** - Automatic deployment on push to `main` branch
2. **PR Validation** - Terraform plan and validation on pull requests
3. **Deploy to Sandbox** - Manual deployment to sandbox environment

## Workflows

### 1. Deploy to Production (`deploy-main.yml`)

**Trigger:** Automatic on push to `main` branch

**What it does:**
- Authenticates to Google Cloud
- Initializes Terraform with dev environment configuration
- Runs `terraform plan` to preview changes
- Runs `terraform apply` to deploy infrastructure
- Builds and pushes Docker image to Artifact Registry
- Deploys to Cloud Run (dev/production environment)

**Environment:** `production`

---

### 2. PR Validation (`pr-validation.yml`)

**Trigger:** Automatic on pull requests to `main` or `develop` branches

**What it does:**
- Runs `terraform fmt -check` to validate formatting
- Runs `terraform validate` to check configuration
- Runs `terraform plan` to preview changes
- Posts the plan output as a comment on the PR
- Checks TypeScript code formatting
- Provides validation summary

**Environment:** Uses `dev` configuration for validation

---

### 3. Deploy to Sandbox (`deploy-sandbox.yml`)

**Trigger:** Manual via GitHub Actions UI

**What it does:**
- Allows manual deployment with custom version input
- Updates version in sandbox terraform.tfvars
- Deploys to sandbox environment
- Optionally destroys infrastructure after deployment (useful for testing)
- Tests endpoint availability

**Environment:** `sandbox`

**Inputs:**
- `version`: Version to deploy (e.g., 0.0.1)
- `destroy`: Whether to destroy infrastructure after deployment

---

## Required Setup

### 1. Configure Workload Identity Federation (Recommended)

Workload Identity Federation allows GitHub Actions to authenticate to Google Cloud without using service account keys.

#### Steps:

1. **Enable required APIs:**
```bash
gcloud services enable iamcredentials.googleapis.com
gcloud services enable sts.googleapis.com
```

2. **Create a Workload Identity Pool:**
```bash
gcloud iam workload-identity-pools create "github-actions-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

3. **Create a Workload Identity Provider:**
```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

4. **Create a Service Account for GitHub Actions:**
```bash
gcloud iam service-accounts create github-actions-sa \
  --project="${PROJECT_ID}" \
  --display-name="GitHub Actions Service Account"
```

5. **Grant necessary permissions to the service account:**
```bash
# Artifact Registry permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Cloud Run permissions
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Service Account permissions (to act as other service accounts)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# Cloud Build permissions (for Docker builds)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

# Storage permissions (for Terraform state)
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

# Additional permissions for Terraform
gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/compute.admin"

gcloud projects add-iam-policy-binding ${PROJECT_ID} \
  --member="serviceAccount:github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.securityAdmin"
```

6. **Allow GitHub to impersonate the service account:**
```bash
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/${GITHUB_USERNAME}/${REPO_NAME}"
```

Replace:
- `${PROJECT_ID}`: Your GCP project ID (e.g., `curamet-onboarding`)
- `${PROJECT_NUMBER}`: Your GCP project number (e.g., `696820564091`)
- `${GITHUB_USERNAME}`: Your GitHub username (e.g., `Alloush95`)
- `${REPO_NAME}`: Your repository name (e.g., `devops_traning`)

7. **Get the Workload Identity Provider ID:**
```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions-pool" \
  --format="value(name)"
```

This will output something like:
```
projects/696820564091/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
```

---

### 2. Configure GitHub Secrets

Add the following secrets in your GitHub repository:

**Repository Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `WIF_PROVIDER` | Workload Identity Provider resource name | `projects/696820564091/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider` |
| `WIF_SERVICE_ACCOUNT` | Service account email | `github-actions-sa@curamet-onboarding.iam.gserviceaccount.com` |

---

### 3. Configure GitHub Environments

Create environments for better control and protection:

**Repository Settings → Environments → New environment**

#### Create these environments:

1. **production**
   - Protection rules: Require approval from reviewers (optional)
   - Environment secrets: Same as repository secrets

2. **sandbox**
   - No special protection rules needed
   - Environment secrets: Same as repository secrets

---

## Alternative: Using Service Account Keys (Not Recommended)

If you can't use Workload Identity Federation, you can use service account keys:

1. Create a service account key:
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account=github-actions-sa@${PROJECT_ID}.iam.gserviceaccount.com
```

2. Add the key content as a GitHub secret:
   - Secret name: `GCP_SA_KEY`
   - Value: The entire content of `key.json` file

3. Update workflows to use this authentication method:
```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    credentials_json: ${{ secrets.GCP_SA_KEY }}
```

⚠️ **Note:** Service account keys are less secure and should be rotated regularly.

---

## Usage

### Deploy to Production (Main)
1. Create a pull request with your changes
2. Wait for PR validation to complete
3. Merge the PR to `main` branch
4. The deployment workflow will automatically trigger

### Run Sandbox Deployment
1. Go to **Actions** tab in GitHub
2. Select **Deploy to Sandbox** workflow
3. Click **Run workflow**
4. Enter the version to deploy (e.g., `0.0.1`)
5. Choose whether to destroy infrastructure after deployment
6. Click **Run workflow**

### PR Validation
- Automatically runs when you create or update a pull request
- Check the PR comments for the Terraform plan output
- Review the plan before merging

---

## Terraform Environments

### Dev (Production)
- **Config:** `terraform/environments/dev/`
- **Prefix:** `al`
- **Backend:** `al-curamet-onboarding-core-tf-state` (sandbox prefix)

### Sandbox
- **Config:** `terraform/environments/dev/` (same as dev)
- **Prefix:** `al` (uses same config as dev)
- **Backend:** `al-curamet-onboarding-core-tf-state` (sandbox prefix)
- **Note:** Sandbox workflow temporarily modifies the version in dev config for testing

---

## Troubleshooting

### Workflow fails with authentication error
- Verify the `WIF_PROVIDER` and `WIF_SERVICE_ACCOUNT` secrets are correctly set
- Check that the service account has the necessary permissions
- Ensure the Workload Identity binding includes your repository

### Terraform state lock error
- Run `terraform force-unlock <LOCK_ID>` in the appropriate environment directory
- Or wait for the lock to expire (usually 20 minutes)

### Docker build fails
- Ensure the service account has `artifactregistry.writer` role
- Verify Docker authentication: `gcloud auth configure-docker europe-docker.pkg.dev`

### Permission denied errors
- Review the service account permissions listed above
- Some permissions may take a few minutes to propagate

---

## Best Practices

1. **Always create a PR** for changes to be reviewed
2. **Test in sandbox** before deploying to production
3. **Review Terraform plans** in PR comments before merging
4. **Use semantic versioning** for your service versions
5. **Monitor deployments** in the Actions tab
6. **Clean up sandbox** resources after testing to save costs

---

## Additional Resources

- [Workload Identity Federation Guide](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Terraform GitHub Actions](https://developer.hashicorp.com/terraform/tutorials/automation/github-actions)
