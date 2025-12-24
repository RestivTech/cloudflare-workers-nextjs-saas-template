# Incident Manager Feedback UI - Kubernetes Deployment Guide

## Phase 3: Deployment to HA K3s Cluster

### Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         Kubernetes Cluster (HA K3s)         │
│  monitoring namespace                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  incident-manager Service           │   │
│  │  - Port 8000 (FastAPI Backend)      │   │
│  │  - ClusterIP service                │   │
│  └─────────────────────────────────────┘   │
│           ↓                                  │
│  ┌─────────────────────────────────────┐   │
│  │  incident-manager-frontend Deployment  │  (NEW)
│  │  - Next.js Frontend (3 replicas)    │   │
│  │  - Port 3000                        │   │
│  │  - ClusterIP service                │   │
│  └─────────────────────────────────────┘   │
│           ↓                                  │
│  ┌─────────────────────────────────────┐   │
│  │  Traefik Ingress                    │   │
│  │  - Route: incident-manager.k8s...   │   │
│  │  - TLS via cert-manager             │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Step 1: Build Docker Image

### Prerequisites

- Docker installed locally
- Access to container registry (GCP Artifact Registry or Harbor)
- `docker` and `docker-compose` CLI tools

### Build Process

```bash
# Navigate to nextjs-saas-template directory
cd /Users/devon/GitHub/restiv-infrastructure/kubernetes/apps/monitoring/incident-manager/nextjs-saas-template

# Build Docker image for Next.js
docker build -t incident-manager-frontend:latest .

# Tag for registry
docker tag incident-manager-frontend:latest \
  us-central1-docker.pkg.dev/grc-next-478716/docker-images/incident-manager-frontend:latest

# Push to GCP Artifact Registry
docker push us-central1-docker.pkg.dev/grc-next-478716/docker-images/incident-manager-frontend:latest

# Or push to Harbor if preferred
docker tag incident-manager-frontend:latest \
  harbor.k8s.deltaops.ca/restiv/incident-manager-frontend:latest

docker push harbor.k8s.deltaops.ca/restiv/incident-manager-frontend:latest
```

### Dockerfile Template

Create `Dockerfile` in nextjs-saas-template directory if not present:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
```

---

## Step 2: Create Kubernetes Manifests

### 2.1 Namespace & RBAC (if not present)

**File**: `kubernetes/apps/monitoring/manifests/incident-manager-namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    environment: production
    managed-by: flux

---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: incident-manager
  namespace: monitoring
```

### 2.2 Frontend Deployment

**File**: `kubernetes/apps/monitoring/manifests/incident-manager-frontend-deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: incident-manager-frontend
  namespace: monitoring
  labels:
    app: incident-manager-frontend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: incident-manager-frontend
  template:
    metadata:
      labels:
        app: incident-manager-frontend
      annotations:
        prometheus.io/scrape: "false"  # Frontend doesn't expose metrics
    spec:
      serviceAccountName: incident-manager
      containers:
      - name: frontend
        image: us-central1-docker.pkg.dev/grc-next-478716/docker-images/incident-manager-frontend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NODE_ENV
          value: "production"
        - name: API_URL
          value: "http://incident-manager:8000"  # Internal service URL
        resources:
          requests:
            cpu: 250m
            memory: 512Mi
          limits:
            cpu: 1000m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 10
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 5
          timeoutSeconds: 3
      imagePullSecrets:
      - name: gcp-artifact-registry
```

### 2.3 Frontend Service

**File**: `kubernetes/apps/monitoring/manifests/incident-manager-frontend-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: incident-manager-frontend
  namespace: monitoring
  labels:
    app: incident-manager-frontend
spec:
  type: ClusterIP
  selector:
    app: incident-manager-frontend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
    name: http
```

### 2.4 Ingress with TLS

**File**: `kubernetes/apps/monitoring/manifests/incident-manager-frontend-ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: incident-manager-frontend
  namespace: monitoring
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"  # or letsencrypt-cloudflare-prod if proxied
    traefik.ingress.kubernetes.io/router.entrypoints: websecure
    traefik.ingress.kubernetes.io/router.tls: "true"
spec:
  ingressClassName: traefik
  tls:
  - hosts:
    - incident-manager.k8s.deltaops.ca
    secretName: incident-manager-frontend-tls
  rules:
  - host: incident-manager.k8s.deltaops.ca
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: incident-manager-frontend
            port:
              number: 80
```

### 2.5 TunnelBinding (for Cloudflare Tunnel access)

**File**: `kubernetes/apps/monitoring/manifests/incident-manager-tunnel-binding.yaml`

```yaml
apiVersion: networking.cfargotunnel.com/v1alpha1
kind: TunnelBinding
metadata:
  name: incident-manager-frontend-tunnel
  namespace: monitoring
  labels:
    app: incident-manager-frontend
subjects:
- kind: Service
  name: incident-manager-frontend
  spec:
    fqdn: incident-manager.k8s.deltaops.ca
    protocol: http
    target: http://incident-manager-frontend.monitoring.svc.cluster.local:80
tunnelRef:
  kind: ClusterTunnel
  name: ha-cluster-tunnel
  disableDNSUpdates: false
```

---

## Step 3: Add to Kustomization

**File**: `kubernetes/apps/monitoring/kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: monitoring

resources:
  - manifests/incident-manager-namespace.yaml
  - manifests/incident-manager-frontend-deployment.yaml
  - manifests/incident-manager-frontend-service.yaml
  - manifests/incident-manager-frontend-ingress.yaml
  - manifests/incident-manager-tunnel-binding.yaml
```

---

## Step 4: Deploy via Flux

### Option A: Use GitOps (Recommended)

```bash
# Commit all manifests to git
git add kubernetes/apps/monitoring/
git commit -m "feat(monitoring): deploy incident-manager feedback UI

- Add Next.js frontend deployment (3 replicas)
- Configure service and ingress
- Enable TLS via cert-manager
- Add Cloudflare Tunnel binding

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to trigger Flux reconciliation
git push

# Flux automatically deploys (~5 minutes)
```

### Option B: Manual kubectl (Emergency Only)

```bash
# Apply manifests manually
kubectl apply -f kubernetes/apps/monitoring/manifests/

# Monitor deployment
kubectl rollout status deployment/incident-manager-frontend -n monitoring
```

---

## Step 5: Verify Deployment

### Check Pod Status

```bash
# List pods
kubectl get pods -n monitoring -l app=incident-manager-frontend

# Expected output:
# NAME                                        READY   STATUS    RESTARTS   AGE
# incident-manager-frontend-abc123def        1/1     Running   0          2m
# incident-manager-frontend-def456ghi        1/1     Running   0          2m
# incident-manager-frontend-ghi789jkl        1/1     Running   0          2m
```

### Check Service

```bash
# Verify service exists
kubectl get svc -n monitoring incident-manager-frontend

# Expected output:
# NAME                          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)   AGE
# incident-manager-frontend     ClusterIP   10.43.x.x       <none>        80/TCP    2m
```

### Check Ingress

```bash
# Verify ingress
kubectl get ingress -n monitoring incident-manager

# Expected output:
# NAME                          CLASS     HOSTS                                ADDRESS        PORTS     AGE
# incident-manager-frontend     traefik   incident-manager.k8s.deltaops.ca     x.x.x.x        80, 443   2m
```

### Check Certificate

```bash
# Verify TLS certificate
kubectl get certificate -n monitoring

# Expected output:
# NAME                                    READY   SECRET                              AGE
# incident-manager-frontend-tls           True    incident-manager-frontend-tls       2m
```

### Test Access

```bash
# Using kubectl port-forward (internal testing)
kubectl port-forward -n monitoring svc/incident-manager-frontend 3000:80

# Then navigate to: http://localhost:3000/incidents

# Or test via DNS (if TLS ready)
curl -I https://incident-manager.k8s.deltaops.ca
```

---

## Step 6: Post-Deployment Validation

### 1. API Connectivity

```bash
# Create test pod to verify backend connectivity
kubectl run test-api --image=curlimages/curl --rm -it -- \
  curl http://incident-manager:8000/health

# Expected: HTTP 200 with health status
```

### 2. Frontend Health

```bash
# Check frontend logs
kubectl logs -n monitoring -l app=incident-manager-frontend --tail=50

# Check for errors or warnings
# Expected: "ready - started server on 0.0.0.0:3000"
```

### 3. TunnelBinding Status

```bash
# Check tunnel binding status
kubectl get tunnelbinding -n monitoring incident-manager-frontend-tunnel

# Expected output shows FQDNS and status
```

### 4. End-to-End Test

```bash
# Navigate to: https://incident-manager.k8s.deltaops.ca/incidents

# Verify:
# ✅ Page loads without errors
# ✅ Incidents list displays
# ✅ API calls complete successfully
# ✅ Filters work
# ✅ Pagination works
# ✅ Can view incident detail
# ✅ Can submit feedback
```

---

## Step 7: Monitoring & Logging

### View Pod Logs

```bash
# Real-time logs
kubectl logs -n monitoring -l app=incident-manager-frontend -f

# Logs from specific pod
kubectl logs -n monitoring incident-manager-frontend-abc123def

# Last 100 lines
kubectl logs -n monitoring -l app=incident-manager-frontend --tail=100
```

### Describe Pod (for troubleshooting)

```bash
# Get detailed pod info
kubectl describe pod -n monitoring <pod-name>

# Useful for checking:
# - Container status
# - Recent events
# - Resource requests/limits
# - Node assignment
```

### Monitor Resource Usage

```bash
# Check pod resource usage (requires metrics-server)
kubectl top pods -n monitoring

# Check node resource usage
kubectl top nodes

# Expected for frontend pod:
# CPU: 50-200m (depends on traffic)
# Memory: 200-400Mi (depends on traffic)
```

---

## Troubleshooting

### Issue: Pods in CrashLoopBackOff

**Symptom**: Pod restarts repeatedly, never reaches Running state

**Diagnosis**:
```bash
kubectl logs -n monitoring <pod-name>
kubectl describe pod -n monitoring <pod-name>
```

**Common Causes**:
- Image pull failure (registry authentication)
- Out of memory (increase memory limits)
- Port conflict
- Missing environment variables

**Fix**:
```bash
# Check image pull secrets
kubectl get secrets -n monitoring

# Verify registry credentials
kubectl get imagepullsecrets -n monitoring
```

### Issue: Pods Running but Service Unavailable

**Symptom**: Pods are Running but traffic not reaching service

**Diagnosis**:
```bash
# Port forward directly to pod
kubectl port-forward -n monitoring <pod-name> 3000:3000

# Test service DNS
kubectl exec -it <pod> -- nslookup incident-manager-frontend
```

**Common Causes**:
- Service not bound to correct port
- Pod not ready (readiness probe failing)
- NetworkPolicy blocking traffic

### Issue: TLS Certificate Not Issuing

**Symptom**: Certificate stuck in Pending or Issuing state

**Diagnosis**:
```bash
kubectl describe certificate -n monitoring incident-manager-frontend-tls
kubectl logs -n cert-manager deployment/cert-manager
```

**Common Causes**:
- DNS not resolving domain
- Let's Encrypt rate limiting
- Invalid cert-manager configuration

---

## Rollback Procedure

### If Deployment Fails

```bash
# Rollback to previous version
kubectl rollout undo deployment/incident-manager-frontend -n monitoring

# Monitor rollback
kubectl rollout status deployment/incident-manager-frontend -n monitoring
```

### If Git-based Deployment

```bash
# Revert last commit
git revert HEAD

# Push to trigger Flux rollback
git push

# Monitor Flux reconciliation
flux logs -n flux-system --follow
```

---

## Performance Baseline

### Expected Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Pod startup time | <30s | Monitor |
| HTTP response time | <500ms | Monitor |
| Memory per pod | 200-400Mi | Monitor |
| CPU per pod | 50-200m | Monitor |
| Replica availability | 3/3 | Monitor |
| Certificate validity | >30 days | Monitor |

### Monitoring Commands

```bash
# Watch pod startup
watch kubectl get pods -n monitoring -l app=incident-manager-frontend

# Monitor resource usage
watch kubectl top pods -n monitoring -l app=incident-manager-frontend

# Check ingress status
watch kubectl get ingress -n monitoring incident-manager-frontend
```

---

## Scaling Guidelines

### Horizontal Scaling

```bash
# Scale to 5 replicas
kubectl scale deployment incident-manager-frontend -n monitoring --replicas=5

# Or update deployment
kubectl edit deployment incident-manager-frontend -n monitoring
# Change spec.replicas: 5
```

### Vertical Scaling

```bash
# Edit deployment to increase resources
kubectl edit deployment incident-manager-frontend -n monitoring

# Update resources:
# resources:
#   requests:
#     cpu: 500m
#     memory: 1Gi
#   limits:
#     cpu: 2000m
#     memory: 4Gi
```

---

## Security Checklist

- [ ] Container image scanned for vulnerabilities
- [ ] Registry credentials stored securely
- [ ] RBAC configured (ServiceAccount with minimal permissions)
- [ ] Network policies configured (if needed)
- [ ] TLS enabled for all external traffic
- [ ] Environment variables don't contain secrets
- [ ] Pod security context configured
- [ ] Resource limits set to prevent DOS

---

## Maintenance

### Regular Tasks

- Monitor logs for errors
- Check certificate expiration
- Review resource usage trends
- Update container image regularly
- Test failover/recovery procedures

### Update Deployment

```bash
# Update image
kubectl set image deployment/incident-manager-frontend \
  frontend=us-central1-docker.pkg.dev/grc-next-478716/docker-images/incident-manager-frontend:v1.1.0 \
  -n monitoring

# Monitor rollout
kubectl rollout status deployment/incident-manager-frontend -n monitoring
```

---

## Success Criteria

All of the following should be true:

- [ ] All 3 pods running
- [ ] Service accessible via https://incident-manager.k8s.deltaops.ca
- [ ] Frontend loads without errors
- [ ] API calls to backend complete successfully
- [ ] Feedback form works (submit feedback)
- [ ] Incidents list displays
- [ ] Filtering/pagination functional
- [ ] Certificate valid (HTTPS working)
- [ ] Resource usage within limits
- [ ] No pod crashes or restarts
- [ ] Logs show normal operation

---

**Deployment Ready**: Once all success criteria met, deployment is complete and ready for production use.
