# Production Deployment Checklist

**Status**: Ready for production deployment
**Commit**: All 6 phases completed (3 new commits ready to push)
**Target**: Cloudflare Workers at `https://pattern-compliance.deltaops.ca`

## Pre-Deployment Requirements

### 1. GitHub Repository Secrets Setup ⚙️

Configure these secrets in GitHub repository settings (Settings → Secrets and variables → Actions):

#### CLOUDFLARE_ACCOUNT_ID
- **From**: Cloudflare Dashboard → Account Settings → Account ID
- **Format**: 32-character hex string (e.g., `abc123def456...`)
- **Usage**: Required for `wrangler deploy` authentication
- **Action**: Copy from Cloudflare account settings

#### CLOUDFLARE_API_TOKEN
- **From**: Cloudflare Dashboard → My Profile → API Tokens → Create Token
- **Permissions Required**:
  - `Account.Workers KV Storage (Edit)`
  - `Account.Workers Scripts (Edit)`
  - `Account.Worker Routes (Edit)`
  - `Zone.Cache Purge (Purge)`
- **Format**: 40+ character token string
- **Usage**: Authentication for Wrangler CLI
- **Action**: Create new token with above permissions

#### GCP_SA_KEY
- **From**: GCP Project (`grc-next-478716`) → Service Accounts
- **Service Account**: `k8s-image-puller@grc-next-478716.iam.gserviceaccount.com`
- **Format**: JSON key file contents (as string)
- **Usage**: Docker image push to GCP Artifact Registry
- **Action**: Download JSON key, paste full contents as secret

### 2. Cloudflare Workers Setup 🚀

#### Create KV Namespaces

```bash
# Login to Cloudflare
wrangler login

# Create production namespaces
wrangler kv:namespace create "CACHE" --preview=false
wrangler kv:namespace create "SESSIONS" --preview=false
wrangler kv:namespace create "RATE_LIMITS" --preview=false

# Verify creation
wrangler kv:namespace list
```

**Expected Output**:
```
id: pcd_cache_prod
title: CACHE
```

#### Update wrangler.toml with Namespace IDs

After creating namespaces, update `.github/workflows/production-deploy.yml` to reference the correct IDs. Current config in `wrangler.toml`:

```toml
[env.production]
vars = { ENVIRONMENT = "production", LOG_LEVEL = "info" }
kv_namespaces = [
  { binding = "CACHE", id = "pcd_cache_prod" },
  { binding = "SESSIONS", id = "pcd_sessions_prod" },
  { binding = "RATE_LIMITS", id = "pcd_rate_limits_prod" }
]
```

### 3. DNS Configuration ✅

**Domain**: `pattern-compliance.deltaops.ca`
**Status**: Verify DNS is configured in Cloudflare Dashboard

```bash
# Test DNS resolution
nslookup pattern-compliance.deltaops.ca
# Expected: Returns Cloudflare nameservers
```

### 4. Environment Approval Gate ⚠️

The production deployment requires manual approval via GitHub Environments.

**Setup** (one-time, in GitHub):
- Go to Settings → Environments → Create "production" environment
- Add required reviewers (recommended: team leads)
- Set deployment branches to "main" only

**During Deployment**:
- GitHub will pause after quality gates
- Designated reviewers will receive approval request
- Reviewers can approve via GitHub UI

## Deployment Instructions

### Step 1: Push to Trigger Deployment

```bash
# All changes are committed locally, ahead of origin/main
git push origin main

# This triggers the production-deploy.yml workflow
# Monitor: GitHub Actions tab in repository
```

### Step 2: Monitor Pre-Deployment Checks

Workflow will run:
1. **Pre-Deployment Checks** (5 min)
   - Verify tag matches version (if applicable)
   - Check for uncommitted changes
   - Create deployment summary

2. **Quality Gates** (15-30 min)
   - Lint checks
   - Build verification
   - Unit tests
   - Integration tests (E2E)
   - Security audit
   - Performance tests

3. **Build Production Image** (10 min)
   - Compile Next.js for Cloudflare Workers
   - Build Docker image
   - Push to GCP Artifact Registry

### Step 3: Manual Approval

Once quality gates pass:
- GitHub sends approval request to designated reviewers
- Review deployment summary
- Click "Approve" in GitHub Actions UI
- Deployment proceeds automatically

### Step 4: Blue-Green Deployment

After approval:
1. **Deploy Green Environment**
   - New version deployed to Cloudflare Workers
   - All new requests route to green version
   - Blue (old) version still running

2. **Health Checks** (15 checks, 10s intervals)
   - Verify `/api/health` endpoint responds
   - Database connectivity check
   - Cache availability check

3. **Smoke Tests** (5 min)
   - Run minimal test suite
   - Verify critical paths working

4. **Traffic Switch** (automatic)
   - If health checks pass, switch traffic to green
   - Old version available for quick rollback

### Step 5: Post-Deployment Verification

Automatic checks:
- Verify production deployment
- Check error rates < 0.1%
- Validate metrics and latency
- Confirm all services healthy

## Rollback Procedure

If deployment fails at any step:

### Automatic Rollback
```bash
# If health checks fail, system automatically reverts
# Old version continues serving traffic
# Team notified via GitHub Actions
```

### Manual Rollback
```bash
# If needed, deploy previous version
git revert <commit-hash>
git push origin main
# Workflow redeploys previous version automatically
```

## Monitoring Post-Deployment

### Access Application
- **Production**: https://pattern-compliance.deltaops.ca
- **API**: https://pattern-compliance.deltaops.ca/api
- **Health Check**: https://pattern-compliance.deltaops.ca/api/health
- **Monitoring**: https://pattern-compliance.deltaops.ca/monitoring

### Metrics Dashboard
```bash
# View real-time metrics
curl https://pattern-compliance.deltaops.ca/api/metrics

# Expected response includes:
# - uptime: milliseconds since startup
# - memory usage and limits
# - request counts and latency
# - error rates
# - cache hit rates
```

### Check Logs
```bash
# View production logs via Wrangler
wrangler logs --env production --follow

# Expected: Structured JSON logs from Pino
# - timestamp
# - level (debug, info, warn, error)
# - message
# - context (userId, requestId, etc.)
```

## Troubleshooting

### Deployment Stuck at Approval
- Check GitHub Settings → Environments → production
- Ensure required reviewers are configured correctly
- Approval email sent to team Slack webhook

### Health Checks Failing
- Check database connectivity
- Verify KV namespace IDs correct
- Review Cloudflare Workers logs: `wrangler logs --env production`
- Check Sentry dashboard for error tracking

### Performance Issues
- Check cache hit rates in `/api/metrics`
- Review database query performance
- Verify Cloudflare KV latency (should be <100ms)

### Database Migrations Failed
- Check migration logs: `npm run migrate:status`
- Review pending migrations
- Manual rollback if needed: `npm run migrate:down`

## Post-Deployment Checklist

After successful deployment:

- [ ] Application accessible at https://pattern-compliance.deltaops.ca
- [ ] Health endpoint returning 200: `/api/health`
- [ ] Monitoring dashboard showing metrics
- [ ] No errors in Sentry dashboard
- [ ] Error rate < 0.1% in monitoring
- [ ] API latency < 500ms (p95)
- [ ] Database connectivity confirmed
- [ ] Cache hit rate > 80%
- [ ] Team notified of deployment
- [ ] Update deployment log/CHANGELOG

## Performance Targets

| Metric | Target | How to Check |
|--------|--------|--------------|
| API Response Time (p95) | < 500ms | `/monitoring` dashboard |
| API Response Time (p99) | < 1000ms | `/monitoring` dashboard |
| Error Rate | < 0.1% | `/monitoring` dashboard |
| Cache Hit Rate | > 80% | `/api/metrics` |
| Database Connectivity | 100% | `/api/health` |
| Health Checks | All passing | GitHub Actions |

## Support & Escalation

**Deployment Issues**:
- Check GitHub Actions logs for detailed error messages
- Review Cloudflare Workers dashboard
- Check Sentry error tracking dashboard

**Critical Issues** (app down, high error rate):
1. Review logs immediately
2. Initiate rollback if needed: `git revert`
3. Document incident
4. Post-incident review

## Deployment Commands Reference

```bash
# Local testing before push
npm run build           # Build Next.js
npm run type-check    # TypeScript validation
npm run test          # Unit tests
npm run test:e2e      # Integration tests

# Staging deployment (via workflow)
git push origin develop
# Automatically deploys to staging environment

# Production deployment (via workflow)
git push origin main
# Triggers approval gate + blue-green deployment

# Manual deployment (if needed)
wrangler deploy --env production
wrangler logs --env production --follow
```

## Reference Documentation

- **API Documentation**: `docs/API.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Architecture Decisions**: `docs/ADR.md`
- **Troubleshooting**: `docs/FAQ.md`

---

**Last Updated**: 2025-12-09
**Deployment Status**: Ready for production
**Next Step**: Push to main branch to trigger workflow
