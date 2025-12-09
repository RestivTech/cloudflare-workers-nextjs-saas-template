# Deployment Guide

This guide covers deploying the Pattern Compliance Dashboard to production via Cloudflare Workers.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Client Browser                                         │
└──────────────────┬──────────────────────────────────────┘
                   │
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Edge (CDN + Workers)                        │
│  - Global distribution                                  │
│  - TLS termination                                      │
│  - Request routing                                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Workers (Compute)                           │
│  - Next.js compiled app (dist/index.js)                │
│  - KV namespace bindings (Cache, Sessions)              │
│  - Environment variables                                │
└──────────────────┬──────────────────────────────────────┘
                   │
┌─────────────────────────────────────────────────────────┐
│  Backend Services (Optional)                            │
│  - PostgreSQL database                                  │
│  - Redis cache                                          │
│  - External APIs                                        │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 20+
- Cloudflare account with Workers enabled
- Wrangler CLI configured
- Git push access to repository

## Build Process

### 1. Compile Next.js for Cloudflare

```bash
npm run build
```

This runs the OpenNext build process:
```bash
npm run opennext:build
```

Output: `dist/index.js` (compiled Next.js app ready for Workers)

### 2. Verify Build

```bash
# Dry-run deployment to verify
npm run build:prod
```

### 3. Generate Types (Optional)

```bash
npm run cf-typegen
```

Generates `cloudflare-env.d.ts` with type definitions for environment bindings.

## Environment Configuration

### Staging Environment

**Domain**: `pattern-compliance-staging.deltaops.ca`
**Log Level**: debug

Configuration in `wrangler.toml`:
```toml
[env.staging]
vars = { ENVIRONMENT = "staging", LOG_LEVEL = "debug" }
kv_namespaces = [
  { binding = "CACHE", id = "pcd_cache_staging" },
  { binding = "SESSIONS", id = "pcd_sessions_staging" },
  { binding = "RATE_LIMITS", id = "pcd_rate_limits_staging" }
]
```

### Production Environment

**Domain**: `pattern-compliance.deltaops.ca`
**Log Level**: info

Configuration in `wrangler.toml`:
```toml
[env.production]
vars = { ENVIRONMENT = "production", LOG_LEVEL = "info" }
kv_namespaces = [
  { binding = "CACHE", id = "pcd_cache_prod" },
  { binding = "SESSIONS", id = "pcd_sessions_prod" },
  { binding = "RATE_LIMITS", id = "pcd_rate_limits_prod" }
]
```

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

Automated deployment via CI/CD pipeline:

**Staging Deployment** (on push to `develop`):
```bash
git push origin develop
```

**Production Deployment** (on push to `main`):
```bash
git push origin main
# Requires manual approval in GitHub environment
```

### Method 2: Manual Deployment

#### Staging
```bash
npm run deploy:staging
```

#### Production
```bash
npm run deploy:prod
```

### Method 3: Wrangler CLI

```bash
# Login to Cloudflare
wrangler login

# Deploy to staging
wrangler deploy --env staging

# Deploy to production
wrangler deploy --env production

# Dry-run (preview)
wrangler deploy --env production --dry-run
```

## Deployment Workflow

### Staging Deployment (Automated)

1. **Trigger**: Push to `develop` branch
2. **Quality Gates** (15 min):
   - Lint checks
   - Build verification
   - Unit tests
   - E2E tests
   - Security audit
3. **Build** (10 min):
   - Compile Next.js
   - Build Docker image
   - Push to GCP Artifact Registry
4. **Deploy** (5 min):
   - Deploy to Cloudflare Workers (staging)
   - Run health checks
   - Execute smoke tests
5. **Status**: Available at `https://pattern-compliance-staging.deltaops.ca`

### Production Deployment (Manual Approval)

1. **Trigger**: Push to `main` branch or tag release
2. **Pre-Deployment Checks** (5 min):
   - Verify tag matches version
   - Check for uncommitted changes
   - Validate branch protection rules
3. **Quality Gates** (30 min):
   - All tests (unit, E2E, security)
   - Lighthouse performance audit
   - Code coverage validation
4. **Approval Gate**:
   - GitHub Environment approval required
   - Review deployment summary
   - Manual approval by team
5. **Build** (15 min):
   - Compile for production
   - Build optimized image
6. **Deployment** (10 min):
   - Blue-green deployment strategy
   - Health checks
   - Smoke tests
   - Post-deployment monitoring
7. **Status**: Available at `https://pattern-compliance.deltaops.ca`

## Database Migrations

### Creating Migrations

```bash
npm run migrate:create -- add_users_table
```

Creates: `migrations/1701234567_add_users_table.sql`

Format:
```sql
-- UP
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DOWN
DROP TABLE IF EXISTS users;
```

### Applying Migrations

```bash
# Apply pending migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:down
```

### Migration Safety

- **Backward Compatible**: Always test rollback (`DOWN` SQL)
- **Idempotent**: Migrations can be safely re-run
- **Atomic**: Each migration is all-or-nothing
- **Versioned**: Timestamps prevent conflicts

## Health Checks & Monitoring

### Health Check Endpoint

```bash
curl https://pattern-compliance.deltaops.ca/api/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-09T...",
  "checks": {
    "database": { "status": "healthy", "latency": 45 },
    "cache": { "status": "healthy", "latency": 12 },
    "api": { "status": "healthy", "latency": 58 }
  }
}
```

### Monitoring Dashboard

Access: `https://pattern-compliance.deltaops.ca/monitoring`

Shows:
- Real-time system health
- Performance metrics
- Error rates
- Memory usage

### Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| API Response Time (p95) | < 500ms | ✓ |
| API Response Time (p99) | < 1000ms | ✓ |
| Error Rate | < 0.1% | ✓ |
| Cache Hit Rate | > 80% | ✓ |
| Lighthouse Score | ≥ 90 | Pending |

## Rollback Procedures

### Automatic Rollback

If health checks fail after deployment:
```bash
# GitHub Actions will automatically:
1. Detect health check failures
2. Revert to previous deployment
3. Notify team in Slack
```

### Manual Rollback

```bash
# Redeploy previous version
git checkout <previous-commit>
npm run deploy:prod

# Or deploy specific tag
git checkout v0.1.0
npm run deploy:prod
```

## Secrets Management

### Required Secrets

Configure in GitHub repository secrets:
- `CLOUDFLARE_ACCOUNT_ID` - Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token
- `GCP_SA_KEY` - Google Cloud service account key
- `SENTRY_DSN` - Sentry error tracking DSN

### Environment Variables

Set in `wrangler.toml`:
```toml
[env.production]
vars = {
  ENVIRONMENT = "production",
  LOG_LEVEL = "info",
  SENTRY_DSN = "https://..."
}
```

## Troubleshooting

### Health Check Failing

1. **Check logs**:
   ```bash
   wrangler logs --env production
   ```

2. **Verify environment variables**:
   ```bash
   wrangler secret list --env production
   ```

3. **Test manually**:
   ```bash
   curl -v https://pattern-compliance.deltaops.ca/api/health
   ```

### Slow Response Times

1. **Check metrics**:
   ```bash
   # View /monitoring dashboard
   ```

2. **Analyze distribution**:
   ```bash
   # Check Cloudflare Analytics in dashboard
   ```

3. **Review KV performance**:
   ```bash
   # Check cache hit rates in monitoring
   ```

### Database Connection Issues

1. **Verify environment variables** are set correctly
2. **Check network policies** allow Cloudflare Workers access
3. **Test database connectivity** from local environment
4. **Review database logs** for connection errors

## Load Testing

### Using k6

```bash
# Run load test against staging
k6 run tests/load-test.js --stage staging

# Run load test against production
k6 run tests/load-test.js --stage production

# Run with specific VUs and duration
k6 run --vus 50 --duration 5m tests/load-test.js
```

### Performance Benchmarks

Target metrics:
- **Requests per second**: > 1000 RPS
- **P95 latency**: < 500ms
- **P99 latency**: < 1000ms
- **Error rate**: < 0.1%

## Monitoring & Alerting

### Real-Time Monitoring

- **Cloudflare Analytics**: Dashboard metrics
- **Application Monitoring**: `/monitoring` page
- **Error Tracking**: Sentry integration
- **Performance**: Lighthouse audits

### Alert Conditions

Alerts triggered when:
- Error rate > 1%
- Response time p95 > 1000ms
- Health check fails (3x consecutive)
- Disk usage > 80%
- Memory usage > 90%

## Compliance & Auditing

### Deployment Checklist

Before production deployment:
- [ ] Code reviewed and approved
- [ ] All tests passing
- [ ] Security audit passed
- [ ] Performance targets met
- [ ] Database migrations validated
- [ ] Environment variables configured
- [ ] Secrets secured in GitHub
- [ ] Monitoring dashboards active
- [ ] Team notified of deployment window

### Audit Trail

All deployments logged with:
- Timestamp
- Deployer
- Commit hash
- Environment
- Deployment strategy
- Health check results

## Support & Escalation

### Deployment Issues

Contact: DevOps Team
Slack: #deployments

### Critical Incidents

1. Page alert via monitoring
2. Automatic rollback attempted
3. Manual intervention if needed
4. Post-incident review

## Additional Resources

- **Cloudflare Documentation**: https://developers.cloudflare.com/workers
- **Wrangler CLI**: https://developers.cloudflare.com/wrangler
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **OpenNext**: https://github.com/sst/open-next

---

**Last Updated**: 2025-12-09
**Version**: 1.0
