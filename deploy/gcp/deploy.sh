#!/usr/bin/env bash
# ==============================================================================
# Zero-Downtime Deployment & Automated Rollback Script for GCP Cloud Run
# ==============================================================================
set -euo pipefail

# Required Environment Variables
PROJECT_ID="${GCP_PROJECT_ID:-"sih-freight-forecast"}"
REGION="${GCP_REGION:-"asia-south1"}"
REPOSITORY="${GCP_REPOSITORY:-"freight-repo"}"
CLOUDSQL_INSTANCE="${CLOUDSQL_INSTANCE:-"sih-freight-forecast:asia-south1:freight-db"}"
IMAGE_TAG="${IMAGE_TAG:-"latest"}"

BACKEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/backend:${IMAGE_TAG}"
FRONTEND_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/frontend:${IMAGE_TAG}"

echo "================================================================="
echo " Starting GCP Production Deployment for Project: ${PROJECT_ID}"
echo "================================================================="

# Step 1: Run Cloud SQL Migration Job
echo "[Step 1/5] Executing Alembic Database Migration Job on Cloud SQL..."
gcloud run jobs execute freight-migration-job --region="${REGION}" --project="${PROJECT_ID}" --wait || {
  echo "CRITICAL: Database migration job failed. Aborting deployment!"
  exit 1
}

# Step 2: Deploy Candidate Backend Revision (0% Traffic)
echo "[Step 2/5] Deploying candidate Backend revision (0% traffic)..."
CANDIDATE_TAG="candidate-$(date +%s)"

gcloud run deploy freight-backend \
  --image="${BACKEND_IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --add-cloudsql-instances="${CLOUDSQL_INSTANCE}" \
  --set-env-vars="ENVIRONMENT=production,LOG_LEVEL=info" \
  --set-secrets="DATABASE_URL=freight-db-url:latest" \
  --no-traffic \
  --tag="${CANDIDATE_TAG}"

# Step 3: Smoke Test & Health Check Candidate Revision
echo "[Step 3/5] Performing health check on candidate revision..."
BACKEND_URL=$(gcloud run services describe freight-backend --region="${REGION}" --project="${PROJECT_ID}" --format='value(status.url)')
CANDIDATE_URL="https://${CANDIDATE_TAG}---${BACKEND_URL#https://}"

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${CANDIDATE_URL}/api/v1/health" || echo "000")

if [ "${HEALTH_STATUS}" -ne 200 ]; then
  echo "CRITICAL: Candidate backend health check failed with HTTP ${HEALTH_STATUS}!"
  echo "Rolling back to previous healthy revision..."
  gcloud run services update-traffic freight-backend --region="${REGION}" --project="${PROJECT_ID}" --to-latest=false
  exit 1
fi

echo "Backend candidate health check PASSED (HTTP 200)."

# Step 4: Route 100% Production Traffic to Candidate Backend
echo "[Step 4/5] Switching 100% traffic to candidate backend revision..."
gcloud run services update-traffic freight-backend \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --to-revisions="${CANDIDATE_TAG}=100"

# Step 5: Deploy Frontend Cloud Run Service
echo "[Step 5/5] Deploying Frontend Service to Cloud Run..."
gcloud run deploy freight-frontend \
  --image="${FRONTEND_IMAGE}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_BASE_URL=${BACKEND_URL}/api/v1" \
  --set-secrets="NEXT_PUBLIC_MAPBOX_TOKEN=mapbox-token:latest" \
  --allow-unauthenticated

echo "================================================================="
echo " GCP Production Deployment Completed Successfully!"
echo " Frontend URL: https://freight-frontend-service-url.a.run.app"
echo " Backend URL:  ${BACKEND_URL}"
echo "================================================================="
