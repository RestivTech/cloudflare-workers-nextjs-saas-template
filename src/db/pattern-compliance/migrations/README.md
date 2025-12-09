# Pattern Compliance Database Migrations

This directory contains all database migrations for the Pattern Compliance Dashboard database schema.

## Migration Files

Migrations are applied in numerical order:

1. **0001_initial_schema.sql** - Core tables (patterns, repositories, violations, approvals, audit_log, teams, users)
2. **0002_indexes_and_constraints.sql** - Performance indexes and uniqueness constraints
3. **0003_views.sql** - SQL views for common query patterns
4. **0004_triggers.sql** - Automatic triggers for timestamp management
5. **0005_seed_data.sql** - Initial test data for development

## Applying Migrations

### Using Cloudflare Wrangler

Wrangler automatically applies migrations when you run `wrangler d1 execute`:

```bash
# Apply all migrations
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0001_initial_schema.sql --remote
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0002_indexes_and_constraints.sql --remote
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0003_views.sql --remote
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0004_triggers.sql --remote
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0005_seed_data.sql --remote
```

### Local Development

For local testing with Wrangler's local environment:

```bash
# Test migrations locally (uses local D1 storage)
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0001_initial_schema.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0002_indexes_and_constraints.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0003_views.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0004_triggers.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0005_seed_data.sql
```

## Migration Strategy

### Design Principles

1. **Idempotent** - All migrations use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, etc. to allow safe re-execution
2. **Ordered** - Migrations are numbered and should be applied in sequence
3. **Reversible** - Each migration is self-contained and can be understood independently
4. **Logical Grouping** - Migrations are grouped by concern (schema, indexes, views, triggers, seed data)

### Initial Deployment

For initial deployment of a new environment:

```bash
#!/bin/bash
# Deploy all migrations in sequence
for migration in migrations/000*.sql; do
  echo "Applying: $migration"
  wrangler d1 execute PATTERN_COMPLIANCE_DB --file "$migration" --remote
  if [ $? -ne 0 ]; then
    echo "Migration failed: $migration"
    exit 1
  fi
done
echo "All migrations applied successfully"
```

### Adding New Migrations

When adding new features:

1. Create a new migration file with the next sequential number (e.g., `0006_add_new_feature.sql`)
2. Use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` for safety
3. Document the purpose in a comment at the top
4. Test locally before deploying to production

Example:

```sql
-- Pattern Compliance Dashboard - Migration 0006
-- Add new feature description
-- Created: YYYY-MM-DD

CREATE TABLE IF NOT EXISTS new_table (
  id TEXT PRIMARY KEY,
  ...
);

CREATE INDEX IF NOT EXISTS idx_new_table_field ON new_table(field);
```

## Performance Considerations

### Index Strategy

- **Uniqueness indexes** (0002) prevent duplicate data
- **Performance indexes** are created on:
  - Foreign key columns (join performance)
  - Filter columns (WHERE clauses)
  - Sort columns (ORDER BY)
  - Common search patterns

### View Strategy

- **violations_with_details** - Most common view (violations with pattern/repo info)
- **pending_approvals_queue** - Approval workflow queries
- **repository_compliance_metrics** - Reporting and analytics

## Testing Migrations

### Verify Schema

After applying migrations, verify the schema:

```bash
# Check tables created
wrangler d1 execute PATTERN_COMPLIANCE_DB --file /dev/stdin --remote <<EOF
SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%';
EOF

# Check indexes created
wrangler d1 execute PATTERN_COMPLIANCE_DB --file /dev/stdin --remote <<EOF
SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';
EOF

# Check views created
wrangler d1 execute PATTERN_COMPLIANCE_DB --file /dev/stdin --remote <<EOF
SELECT name FROM sqlite_master WHERE type='view';
EOF
```

### Verify Sample Data

```bash
# Check seed data was inserted
wrangler d1 execute PATTERN_COMPLIANCE_DB --file /dev/stdin --remote <<EOF
SELECT COUNT(*) as team_count FROM teams;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as pattern_count FROM patterns;
EOF
```

## Troubleshooting

### Migration Fails

If a migration fails:

1. **Check error message** - Wrangler output will show the SQL error
2. **Review SQL syntax** - Ensure no syntax errors (test locally if possible)
3. **Check dependencies** - Ensure prerequisite migrations were applied
4. **Retry** - Since migrations are idempotent, you can safely retry

### Database Locked

If you see "database is locked" errors:

1. Wait for any in-progress operations to complete
2. Try again in a few moments
3. Contact Cloudflare support if issue persists

### Data Mismatch

If seed data doesn't appear:

1. Verify migration 0005 was applied successfully
2. Check for constraints that might reject data
3. Review error logs from migration execution

## Related Documentation

- **Database Schema**: `../schema.sql` - Full schema reference
- **Drizzle ORM**: `../drizzle-schema.ts` - Type definitions
- **Database Client**: `../client.ts` - Client API
- **Environment Variables**: `../../.env.pattern-compliance.example`

## Deployment Pipeline

Migrations are typically applied as part of the deployment pipeline:

1. **Pre-deployment** - Test migrations in staging environment
2. **Deployment** - Apply migrations to production database
3. **Post-deployment** - Verify schema and data integrity
4. **Rollback** (if needed) - Restore from backup (requires manual steps)

See the main project IMPLEMENTATION_PLAN.md for deployment workflow details.
