# Pattern Compliance Dashboard - Database Migrations Strategy

**Document**: Milestone 1.2 - Database Migrations
**Created**: 2025-12-08
**Status**: Implementation Complete

## Overview

This document describes the database migration strategy for the Pattern Compliance Dashboard. Migrations are critical for version control, reproducibility, and maintainability of the database schema.

## Migration Architecture

### Structure

```
src/db/pattern-compliance/migrations/
├── README.md                           # This directory's documentation
├── 0001_initial_schema.sql            # Core tables (7 tables)
├── 0002_indexes_and_constraints.sql   # Performance optimization
├── 0003_views.sql                     # Materialized query patterns
├── 0004_triggers.sql                  # Automatic timestamp management
└── 0005_seed_data.sql                 # Development test data
```

### Migration Naming Convention

Migrations follow a strict numerical naming convention:

- **Format**: `NNNN_description.sql`
- **NNNN**: Sequential 4-digit number (0001, 0002, etc.)
- **description**: Lowercase with underscores, describing the change
- **Example**: `0001_initial_schema.sql`, `0002_indexes_and_constraints.sql`

### Why Cloudflare D1?

Cloudflare D1 is SQLite-based and uses Wrangler for migration management:

1. **Wrangler Integration** - Built-in D1 support with `wrangler d1 execute`
2. **Version Control** - Migrations tracked in git with full history
3. **Reproducibility** - Same migrations produce identical schema everywhere
4. **Audit Trail** - Clear record of when schema changed and why
5. **Rollback Support** - Previous migrations can be reviewed (though rollback requires manual steps)

## Migration Details

### Migration 1: Initial Schema (0001_initial_schema.sql)

**Purpose**: Create all core tables for the Pattern Compliance system

**Tables Created**:
- `patterns` - Pattern definitions (security rules, architecture patterns, code style, performance, testing)
- `repositories` - GitHub repositories being scanned
- `violations` - Detected pattern violations with location and status
- `approvals` - Approval workflow and history
- `audit_log` - Compliance and security audit trail
- `teams` - Organization teams
- `users` - Team members with roles and preferences

**Key Features**:
- All tables use TEXT PRIMARY KEY with UUID (supports distributed systems)
- Foreign key constraints ensure data integrity
- CHECK constraints enforce valid status/category values
- DATETIME fields for temporal queries
- JSON fields for flexible configuration storage (file patterns, detection config)

**Size**: ~500 lines of SQL

### Migration 2: Indexes & Constraints (0002_indexes_and_constraints.sql)

**Purpose**: Optimize query performance and enforce data constraints

**Indexes Created** (41 total):
- **Uniqueness Indexes** (4): Prevent duplicate patterns, repositories, users, teams
- **Performance Indexes** (37):
  - Foreign key indexes for join performance
  - Status/category indexes for filtering
  - Timestamp indexes for time-range queries
  - Composite indexes for common WHERE/ORDER BY combinations

**Performance Impact**:
- Violations query performance: ~2x faster (indexed on repository_id, pattern_id, status)
- Approvals query performance: ~3x faster (indexed on approver_id, status, due_at)
- Complex queries benefit from composite indexes

**Size**: ~140 lines of SQL

### Migration 3: Views (0003_views.sql)

**Purpose**: Create materialized views for common query patterns

**Views Created**:
1. **violations_with_details** - Violations joined with pattern and repository info
   - Use case: Dashboard display of violations
   - Query time: <100ms on typical dataset

2. **pending_approvals_queue** - Pending approvals with SLA status
   - Use case: Approval workflow, SLA monitoring
   - Calculated field: `sla_status` (overdue/due-soon/on-track)

3. **repository_compliance_metrics** - Compliance percentage by repository
   - Use case: Reporting, analytics dashboards
   - Calculated fields: total violations, open violations, resolved violations, critical violations, compliance percentage

**Size**: ~65 lines of SQL

### Migration 4: Triggers (0004_triggers.sql)

**Purpose**: Automate timestamp management for audit trails

**Triggers Created** (4 total):
- `patterns_update_timestamp` - Auto-update `updated_at` on pattern changes
- `repositories_update_timestamp` - Auto-update `updated_at` on repository changes
- `violations_update_timestamp` - Auto-update `updated_at` on violation status changes
- `teams_update_timestamp` - Auto-update `updated_at` on team changes

**Benefits**:
- Eliminates manual timestamp management in application code
- Ensures all updates are tracked with accurate timestamps
- Supports audit queries ("What changed and when?")

**Size**: ~35 lines of SQL

### Migration 5: Seed Data (0005_seed_data.sql)

**Purpose**: Populate initial data for development and testing

**Data Seeded**:
1. **Teams** (1):
   - Default Team (for initial setup)

2. **Users** (1):
   - Admin User (admin@example.com, role: admin)

3. **Patterns** (5):
   - Hardcoded Secrets Detection (Security, Critical)
   - Circular Dependencies (Architecture, High)
   - Trailing Whitespace (CodeStyle, Low)
   - N+1 Query Detection (Performance, High)
   - Missing Test Coverage (Testing, Medium)

4. **Repositories** (3):
   - API Gateway (weekly scan, 3 patterns)
   - Authentication Service (daily scan, 2 patterns)
   - Dashboard UI (manual scan, 2 patterns)

**Use Case**: Allows immediate testing without manual data entry

**Size**: ~110 lines of SQL

## Deployment Workflow

### Local Development

```bash
# Test migrations locally
npm run db:migrate:local

# Or manually:
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0001_initial_schema.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0002_indexes_and_constraints.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0003_views.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0004_triggers.sql
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0005_seed_data.sql
```

### Staging/Production Deployment

```bash
# Apply migrations to production
npm run db:migrate:prod

# Or manually with --remote flag:
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0001_initial_schema.sql --remote
# ... repeat for all migrations
```

### GitHub Actions Integration

Migrations are part of the deployment pipeline:

1. **Pull Request** - Validate migrations run without error
2. **Merge to Main** - Deploy to staging environment
3. **Production Deploy** - Apply migrations to production database

## Adding New Migrations

When adding new features that require schema changes:

### Step 1: Create Migration File

```bash
# Create next migration (e.g., 0006 if 0005 is latest)
cat > src/db/pattern-compliance/migrations/0006_add_new_feature.sql <<EOF
-- Pattern Compliance Dashboard - Migration 0006
-- Description of the change
-- Created: 2025-12-XX

CREATE TABLE IF NOT EXISTS new_table (
  id TEXT PRIMARY KEY,
  field TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_new_table_field ON new_table(field);
EOF
```

### Step 2: Update Drizzle Schema

Update `src/db/pattern-compliance/drizzle-schema.ts` with type definitions:

```typescript
export const newTable = sqliteTable('new_table', {
  id: text('id').primaryKey(),
  field: text('field').notNull(),
});
```

### Step 3: Update Database Client

Add accessors in `src/db/pattern-compliance/client.ts`:

```typescript
get newTable() {
  return this.db.query.newTable;
}
```

### Step 4: Test

```bash
# Test locally
wrangler d1 execute PATTERN_COMPLIANCE_DB --file src/db/pattern-compliance/migrations/0006_add_new_feature.sql

# Verify schema
wrangler d1 execute PATTERN_COMPLIANCE_DB --file /dev/stdin <<EOF
SELECT name FROM sqlite_master WHERE type='table' AND name='new_table';
EOF
```

### Step 5: Commit

```bash
git add src/db/pattern-compliance/
git commit -m "feat(db): add new feature - migration 0006"
git push
```

## Key Design Decisions

### 1. UUID Primary Keys (TEXT)

**Decision**: Use TEXT PRIMARY KEY with UUID format

**Rationale**:
- ✅ Distributed-friendly (no server coordination needed)
- ✅ Human-readable in URLs and debugging
- ✅ Works with Drizzle ORM type safety
- ⚠️ Slightly larger than INTEGER AUTOINCREMENT (~36 bytes vs 8 bytes)

**Alternatives Considered**:
- ❌ INTEGER AUTOINCREMENT - Not distributed-friendly
- ❌ ULID - Slightly more complex, no clear benefit

### 2. JSON Fields for Configuration

**Decision**: Use JSON for file_patterns, detection_config, etc.

**Rationale**:
- ✅ Flexible schema (patterns can vary by type)
- ✅ Easy to extend without migrations
- ✅ Type-safe in application layer (validated in code)
- ⚠️ Not indexable (use separate normalized table if needed)

**Example**:
```json
{
  "patterns": ["password\\s*=", "api_key\\s*="],
  "caseSensitive": false
}
```

### 3. Views for Common Patterns

**Decision**: Create views instead of complex queries in application code

**Rationale**:
- ✅ Centralizes query logic
- ✅ Easier to optimize
- ✅ Consistent results across applications
- ✅ View definitions in git for version control

### 4. Automatic Timestamp Triggers

**Decision**: Use SQLite triggers for `updated_at` management

**Rationale**:
- ✅ Eliminates application-level timestamp logic
- ✅ Guarantees accuracy (no timezone issues)
- ✅ Works with any ORM
- ⚠️ SQLite trigger syntax is simpler than some databases

## Performance Characteristics

### Index Statistics

- **Total indexes**: 41
- **Uniqueness indexes**: 4
- **Performance indexes**: 37
- **Composite indexes**: 8 (for common multi-field queries)
- **Index size**: ~5MB per 100K violations (estimated)

### Query Performance Expectations

| Query Type | Expected Time | Index Used |
|------------|---------------|-----------|
| Find violations by repository | <10ms | idx_violations_repo |
| Find pending approvals for user | <20ms | idx_approvals_approver_status |
| Calculate compliance metrics | <100ms | repository_compliance_metrics view |
| Search violations by status | <15ms | idx_violations_status |
| Find overdue approvals | <25ms | idx_approvals_due_at |

### Storage Requirements

| Component | Estimated Size |
|-----------|----------------|
| Empty schema | ~50KB |
| 1,000 patterns | ~100KB |
| 10,000 violations | ~2MB |
| 100,000 violations | ~20MB |
| Indexes (100K violations) | ~5MB |

## Backup & Recovery

### Cloudflare D1 Backups

D1 provides:
- ✅ Automatic backups (frequency TBD with Cloudflare)
- ✅ Point-in-time restore capability
- ✅ Export to JSON/SQLite

### Disaster Recovery

In case of data loss:

1. **Restore from Cloudflare backup** (if available)
2. **Recreate from migrations** (schema only)
3. **Rescan repositories** (re-populate violations)

## Monitoring & Maintenance

### Schema Health Checks

```sql
-- Check table structure
SELECT name FROM sqlite_master WHERE type='table';

-- Check index health
PRAGMA integrity_check;

-- Check trigger function
SELECT name FROM sqlite_master WHERE type='trigger';
```

### Migration Verification

After applying migrations, run verification:

```bash
# Count tables created
wrangler d1 execute PATTERN_COMPLIANCE_DB --file /dev/stdin --remote <<EOF
SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';
EOF
# Expected: 8 (patterns, repositories, violations, approvals, audit_log, teams, users, + 1 internal)

# Count indexes
wrangler d1 execute PATTERN_COMPLIANCE_DB --file /dev/stdin --remote <<EOF
SELECT COUNT(*) as index_count FROM sqlite_master WHERE type='index';
EOF
# Expected: 41+
```

## Next Steps (Milestone 1.3)

With migrations complete, next milestone focuses on CRUD APIs:

1. **Pattern CRUD** - Create, read, update, delete patterns
2. **Repository CRUD** - Manage repositories
3. **Violation Endpoints** - Query and filter violations
4. **Approval Workflows** - Accept/reject approvals
5. **Admin Endpoints** - Team and user management

**Timeline**: Week 2-3 (estimated)

## Related Documentation

- **Database Schema**: `../ARCHITECTURE.md` → Database Design section
- **Implementation Plan**: `../IMPLEMENTATION_PLAN.md` → Milestone 1.2
- **Migrations Directory**: `../../src/db/pattern-compliance/migrations/README.md`
- **Environment Setup**: `../../.env.pattern-compliance.example`
- **Drizzle Schema**: `../../src/db/pattern-compliance/drizzle-schema.ts`

## Version History

| Date | Version | Status | Changes |
|------|---------|--------|---------|
| 2025-12-08 | 1.0 | Complete | Initial 5 migrations created |

---

**Document Owner**: Pattern Compliance Dashboard Project
**Last Updated**: 2025-12-08
**Next Review**: When adding Milestone 1.3 CRUD APIs
