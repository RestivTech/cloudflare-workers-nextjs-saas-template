# Frequently Asked Questions (FAQ) & Troubleshooting

Common questions and solutions for the Pattern Compliance Dashboard.

## Installation & Setup

### Q: I'm getting `npm ERR! code ERESOLVE` when installing dependencies

**A**: Use `--legacy-peer-deps` flag:
```bash
npm install --legacy-peer-deps
```

This is required because some dependencies have conflicting peer dependency requirements. The flag tells npm to ignore these conflicts.

### Q: Port 3000 is already in use

**A**: Use a different port:
```bash
PORT=3001 npm run dev
```

Or kill the process using port 3000:
```bash
# Find process ID
lsof -i :3000

# Kill process (replace PID)
kill -9 <PID>
```

### Q: `.env.local` is not being read

**A**: Ensure:
1. File is in project root directory
2. File name is exactly `.env.local`
3. Variables are in format: `VARIABLE_NAME=value`
4. Restart dev server after editing

## Development

### Q: TypeScript errors appear but code works

**A**: This is expected in development. Run:
```bash
npm run type-check
```

If it passes, the errors are likely in your IDE. Restart your IDE/TypeScript server.

### Q: How do I add a new API endpoint?

**A**: Create a file in `src/app/api/`:

```typescript
// src/app/api/my-endpoint/route.ts
import { withErrorHandler } from '@/lib/api-error-handler'

export const GET = withErrorHandler(async (request) => {
  return NextResponse.json({ success: true, data: [] })
})
```

Then call it:
```bash
curl http://localhost:3000/api/my-endpoint
```

### Q: How do I debug a specific test?

**A**: Run with debug mode:
```bash
npm run test:e2e:debug

# Or use specific test file
npm run test:e2e -- patterns.spec.ts
```

### Q: My changes aren't showing up in the browser

**A**: Try:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Clear browser cache: DevTools → Application → Clear Storage
3. Restart dev server: `npm run dev`

## Testing

### Q: How do I run only smoke tests?

**A**: Use the grep pattern:
```bash
npm run test:smoke
```

Or for specific tests:
```bash
npm run test:e2e -- --grep "@smoke"
```

### Q: E2E tests are flaky (failing randomly)

**A**: Common causes and solutions:
1. **Timeouts**: Increase timeout
   ```typescript
   await page.waitForSelector('.element', { timeout: 10000 })
   ```

2. **Race conditions**: Add explicit waits
   ```typescript
   await page.waitForLoadState('networkidle')
   ```

3. **Headless issues**: Run in headed mode
   ```bash
   npm run test:e2e:headed
   ```

### Q: How do I update test snapshots?

**A**: Run:
```bash
npm run test -- -u
```

This updates all snapshots. Review changes before committing.

## Deployment

### Q: How do I deploy to staging?

**A**: Push to `develop` branch:
```bash
git push origin develop
```

GitHub Actions automatically deploys to staging. Check workflow status at:
https://github.com/RestivTech/pattern-compliance-dashboard/actions

### Q: How do I deploy to production?

**A**:
1. Push to `main` branch
2. GitHub Actions requires approval
3. Go to deployment environment and approve
4. Deployment proceeds automatically

### Q: Deployment is stuck on health checks

**A**: Check the monitoring dashboard:
https://pattern-compliance.deltaops.ca/monitoring

Or check Wrangler logs:
```bash
wrangler logs --env production
```

## Database & Migrations

### Q: How do I create a database migration?

**A**:
```bash
npm run migrate:create -- add_users_table
```

Edit the generated file in `migrations/` folder with SQL:
```sql
-- UP
CREATE TABLE users (...)

-- DOWN
DROP TABLE IF EXISTS users
```

Apply:
```bash
npm run migrate:up
```

### Q: How do I rollback a migration?

**A**:
```bash
npm run migrate:down
```

This runs the `DOWN` section of the last migration.

### Q: How do I check migration status?

**A**:
```bash
npm run migrate:status
```

Shows all executed and pending migrations.

## Performance & Monitoring

### Q: My API is slow. What should I do?

**A**:
1. Check monitoring dashboard: `/monitoring`
2. Review Lighthouse audit: `npm run test:perf`
3. Check database queries for N+1 problems
4. Enable request tracing: Look at request IDs in logs

### Q: Memory usage is high

**A**:
1. Check `/monitoring` dashboard for memory metrics
2. Profile with Chrome DevTools
3. Look for memory leaks in components
4. Check for circular dependencies

### Q: Cache hit rate is low

**A**:
1. Check KV cache configuration in `wrangler.toml`
2. Verify cache keys are consistent
3. Monitor TTL settings (too short?)
4. Check cache invalidation logic

## Errors & Debugging

### Q: I see "Error: CACHE binding is undefined"

**A**: This means Cloudflare KV namespace binding is not configured.

**For development**:
- Restart dev server
- Check `.env.local` has correct values

**For production**:
- Check `wrangler.toml` has CACHE binding
- Verify KV namespace exists in Cloudflare dashboard

### Q: API returns "VALIDATION_ERROR"

**A**: Check the error details:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "details": {
      "fieldName": "Error message"
    }
  }
}
```

Fix the invalid fields and retry.

### Q: Getting "Rate limit exceeded"

**A**: You're making too many requests. Wait before retrying:
```bash
# Check rate limit headers
curl -i https://pattern-compliance.deltaops.ca/api/patterns
# Look for: X-RateLimit-Reset header
```

### Q: "Cannot find module" error

**A**: Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## Git & Version Control

### Q: How do I revert a commit?

**A**:
```bash
# Soft revert (keeps changes)
git revert <commit-hash>

# Hard revert (discards changes)
git reset --hard <commit-hash>
```

### Q: I accidentally committed to main. What do I do?

**A**:
1. **If not pushed yet**:
   ```bash
   git reset --soft HEAD~1
   git checkout -b my-feature
   git commit -m "feat: my feature"
   ```

2. **If already pushed**:
   - Create a revert commit
   - Request approval in PR

### Q: How do I sync with remote after falling behind?

**A**:
```bash
git fetch origin
git rebase origin/develop
```

Or merge:
```bash
git merge origin/develop
```

## Security

### Q: How do I handle sensitive data?

**A**:
1. **Never commit secrets** - Use `.env.local` or GitHub Secrets
2. **Validate input** - Use validation utilities
3. **Log safely** - Don't log passwords or tokens
4. **HTTPS always** - Use secure connections

### Q: How do I add a new environment variable?

**A**:
1. Add to `.env.example`:
   ```bash
   MY_SECRET_KEY=your-value-here
   ```

2. Use in code:
   ```typescript
   const apiKey = process.env.MY_SECRET_KEY
   ```

3. For production, add to GitHub Secrets or Cloudflare

## Contributing

### Q: What's the code style guide?

**A**: Follow these rules:
- Use TypeScript strict mode
- Functional components with hooks
- Proper error handling
- JSDoc comments for public APIs
- Test-driven development
- Keep commits focused

### Q: How do I get my PR reviewed?

**A**:
1. Push to feature branch
2. Create PR with clear description
3. Request reviewers in PR
4. Address feedback
5. Re-request review

### Q: Can I force push to main?

**A**: **No!** Force push to main is disabled for safety.

If you need to fix something:
1. Create a fix commit
2. Push normally
3. Create new PR

## Performance Tips

### Q: How can I improve page load time?

**A**:
1. Use dynamic imports for heavy components:
   ```typescript
   const HeavyComponent = dynamic(() => import('./Heavy'))
   ```

2. Optimize images with Next.js Image component

3. Enable caching with proper headers

4. Use code splitting and lazy loading

### Q: How do I reduce bundle size?

**A**:
1. Check bundle size:
   ```bash
   npm run build:analyze
   ```

2. Remove unused dependencies

3. Use dynamic imports

4. Tree-shake unused code

## Getting Help

### Q: Where do I find more help?

**A**: Check these resources:
1. **Documentation**: `/docs` folder
2. **API Docs**: `docs/API.md`
3. **Developer Guide**: `docs/DEVELOPER_GUIDE.md`
4. **Architecture Decisions**: `docs/ADR.md`
5. **Team**: Slack #dev channel

### Q: How do I report a bug?

**A**:
1. Check if issue already exists on GitHub
2. Create new issue with:
   - Title describing the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/logs
   - Your environment (OS, Node version, etc.)

### Q: Can I contribute?

**A**: Yes! See `CONTRIBUTING.md` for guidelines:
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit PR for review

---

## Quick Command Reference

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Build for production
npm run type-check         # Check TypeScript

# Testing
npm run test               # Run all tests
npm run test:e2e           # Run E2E tests
npm run test:smoke         # Run smoke tests
npm run test:perf          # Performance tests

# Database
npm run migrate:create <name>  # Create migration
npm run migrate:up         # Apply migrations
npm run migrate:down       # Rollback migration
npm run migrate:status     # Check status

# Deployment
npm run deploy:staging     # Deploy to staging
npm run deploy:prod        # Deploy to production

# Code Quality
npm run lint              # Run linter
npm run format            # Format code
npm run security-audit    # Check dependencies
```

---

**Last Updated**: 2025-12-09
**Version**: 1.0
**Contributors**: Development Team
