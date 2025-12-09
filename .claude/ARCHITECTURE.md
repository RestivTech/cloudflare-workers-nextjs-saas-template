# Pattern Compliance Dashboard - Architecture Design

**Status**: Phase 2 - Architecture Design
**Date**: 2025-12-08
**Platform**: Cloudflare Workers + D1 + Next.js

---

## System Architecture Overview

### Deployment Model
```
Developer Push to Repository
  ↓
[Manual] Admin Dashboard Request Scan
  ↓
Cloudflare Workers (Scan Request)
  ├→ Clone Repository (temporary storage)
  ├→ Load Patterns from D1
  ├→ Execute Detection Rules (regex, AST)
  ├→ Store Violations in D1
  └→ Return Results to Dashboard
  ↓
Admin/Developer Reviews Violations
  ↓
Submit Remediation for Approval
  ↓
[Approval Routes]
  ├→ Email (Resend) ──→ Approver
  ├→ Slack (human-input MCP) ──→ Approver
  └→ Both (configurable)
  ↓
Approver Reviews & Responds
  ↓
Dashboard Updates (approval status, audit log)
```

---

## Database Schema (D1)

### Core Tables

#### `patterns` (Pattern Registry)
```sql
CREATE TABLE patterns (
  id TEXT PRIMARY KEY,           -- UUID
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,        -- Security, Architecture, CodeStyle, etc.
  severity TEXT NOT NULL,        -- Critical, High, Medium, Low
  status TEXT DEFAULT 'active',  -- active, deprecated, archived

  -- Detection Configuration
  detection_method TEXT NOT NULL,     -- regex, ast, custom
  detection_config JSON NOT NULL,     -- method-specific config
  file_patterns JSON NOT NULL,        -- ['**/*.py', '**/*.ts']
  exclusion_patterns JSON DEFAULT '[]',  -- paths to exclude

  -- Remediation
  remediation_guidance TEXT,      -- markdown
  remediation_link TEXT,          -- URL to docs/ADR

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,               -- admin user ID
  version TEXT DEFAULT '1.0'
);

-- Indexes
CREATE UNIQUE INDEX idx_patterns_name ON patterns(name);
CREATE INDEX idx_patterns_category ON patterns(category);
CREATE INDEX idx_patterns_status ON patterns(status);
```

#### `repositories` (Configured Repositories)
```sql
CREATE TABLE repositories (
  id TEXT PRIMARY KEY,           -- UUID
  name TEXT NOT NULL,
  url TEXT NOT NULL,             -- GitHub/Git URL
  owner_team TEXT,               -- team responsible for this repo

  -- Scanning Configuration
  patterns JSON NOT NULL,        -- ['pattern-id-1', 'pattern-id-2']
  scan_frequency TEXT DEFAULT 'manual',  -- manual, daily, weekly, monthly
  last_scan_at DATETIME,
  last_scan_status TEXT,         -- success, failed, in_progress

  -- GitHub Access
  github_token_ref TEXT,         -- reference to Vault secret (if private)
  is_public BOOLEAN DEFAULT true,

  -- Settings
  auto_create_tickets BOOLEAN DEFAULT false,
  ticket_system TEXT,            -- github, jira (phase 2)

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE UNIQUE INDEX idx_repos_url ON repositories(url);
CREATE INDEX idx_repos_owner_team ON repositories(owner_team);
CREATE INDEX idx_repos_scan_frequency ON repositories(scan_frequency);
```

#### `violations` (Detected Violations)
```sql
CREATE TABLE violations (
  id TEXT PRIMARY KEY,           -- UUID
  repository_id TEXT NOT NULL REFERENCES repositories(id),
  pattern_id TEXT NOT NULL REFERENCES patterns(id),

  -- Location
  file_path TEXT NOT NULL,
  line_number INTEGER,
  column_number INTEGER,
  code_snippet TEXT,             -- context around violation

  -- Status
  status TEXT DEFAULT 'open',    -- open, resolved, suppressed, wontfix
  status_comment TEXT,

  -- Remediation
  remediation_applied_at DATETIME,
  remediation_applied_by TEXT,
  remediation_link TEXT,         -- PR/commit link

  -- Approval
  approval_status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  approval_required_level TEXT,   -- low, medium, high, critical
  approval_method TEXT DEFAULT 'email',    -- email, slack, both
  approver_id TEXT,
  approval_date DATETIME,
  approval_reason TEXT,

  -- Metadata
  first_detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  -- Search/Analytics
  severity TEXT GENERATED ALWAYS AS (
    SELECT severity FROM patterns WHERE id = pattern_id
  ) STORED
);

CREATE INDEX idx_violations_repo ON violations(repository_id);
CREATE INDEX idx_violations_pattern ON violations(pattern_id);
CREATE INDEX idx_violations_status ON violations(status);
CREATE INDEX idx_violations_approval_status ON violations(approval_status);
CREATE INDEX idx_violations_severity ON violations(severity);
```

#### `approvals` (Approval History)
```sql
CREATE TABLE approvals (
  id TEXT PRIMARY KEY,           -- UUID
  violation_id TEXT NOT NULL REFERENCES violations(id),

  -- Approval Flow
  approval_step INTEGER,         -- 1, 2, 3 for multi-step
  approver_id TEXT NOT NULL,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_at DATETIME,

  -- Response
  status TEXT DEFAULT 'pending',  -- pending, approved, rejected
  response TEXT,
  response_at DATETIME,
  response_method TEXT,          -- email_click, slack_button, web_form

  -- Notification
  notification_sent_at DATETIME,
  notification_method TEXT NOT NULL,  -- email, slack
  notification_status TEXT,      -- sent, failed, bounced

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approvals_violation ON approvals(violation_id);
CREATE INDEX idx_approvals_approver ON approvals(approver_id);
CREATE INDEX idx_approvals_status ON approvals(status);
```

#### `audit_log` (Compliance/Audit Trail)
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,           -- UUID
  action TEXT NOT NULL,          -- scan_started, violation_created, approval_sent, etc.
  resource_type TEXT,            -- pattern, repository, violation, approval
  resource_id TEXT,
  user_id TEXT,
  user_email TEXT,
  details JSON,                  -- action-specific details

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_action ON audit_log(action);
```

### Reference Tables

#### `users` (Team Members)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,           -- UUID
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,            -- admin, reviewer, developer, viewer
  team_id TEXT REFERENCES teams(id),

  -- Preferences
  notification_email TEXT,       -- different from login email
  approval_slack_user_id TEXT,   -- Slack user ID for approvals

  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_team ON users(team_id);
```

#### `teams` (Organization Teams)
```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY,           -- UUID
  name TEXT NOT NULL,
  description TEXT,

  -- Permissions
  repositories JSON,             -- ['repo-id-1', 'repo-id-2']
  patterns JSON,                 -- ['pattern-id-1', 'pattern-id-2']

  -- Approval Settings
  requires_approval BOOLEAN DEFAULT true,
  default_approval_method TEXT,  -- email, slack, both
  approval_sla_hours INTEGER DEFAULT 24,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_name ON teams(name);
```

---

## API Endpoints

### Admin API (Protected - Auth Required)

#### Pattern Management
- `POST /api/patterns` - Create pattern
- `GET /api/patterns` - List patterns
- `GET /api/patterns/:id` - Get pattern details
- `PATCH /api/patterns/:id` - Update pattern
- `DELETE /api/patterns/:id` - Delete pattern
- `POST /api/patterns/:id/version` - Create new version

#### Repository Management
- `POST /api/repositories` - Add repository
- `GET /api/repositories` - List repositories
- `GET /api/repositories/:id` - Get repository details
- `PATCH /api/repositories/:id` - Update configuration
- `DELETE /api/repositories/:id` - Remove repository
- `POST /api/repositories/:id/scan` - Trigger manual scan

#### User & Team Management
- `POST /api/teams` - Create team
- `GET /api/teams` - List teams
- `PATCH /api/teams/:id` - Update team
- `POST /api/users` - Invite user
- `GET /api/users` - List users
- `PATCH /api/users/:id/role` - Change user role

#### Audit & Analytics
- `GET /api/audit-log` - View audit trail
- `GET /api/metrics/compliance` - Compliance score by repo
- `GET /api/metrics/violations` - Violation trends
- `GET /api/metrics/approvals` - Approval SLA metrics

### Public API (Used by Dashboard)

#### Violation Reporting
- `GET /api/violations` - List violations (with filtering)
- `GET /api/violations/:id` - Get violation details
- `PATCH /api/violations/:id/status` - Update violation status
- `POST /api/violations/:id/remediation` - Submit remediation

#### Approval Workflow
- `POST /api/approvals/:id/approve` - Approve (for API, webhook)
- `POST /api/approvals/:id/reject` - Reject (for API, webhook)
- `GET /api/approvals/:id/status` - Check approval status

---

## Frontend Components

### Pages (Next.js App Router)

#### Dashboard (`/dashboard`)
- Repository overview with violation summary
- Violation list with filtering/sorting
- Quick stats (total violations, open approvals, compliance score)

#### Repositories (`/repositories`)
- List of all repositories
- Scan history and schedule
- Repository settings (patterns, approval workflow)

#### Patterns (`/patterns`)
- Pattern registry browser
- Create/edit/delete patterns
- Version history
- Search by category, severity

#### Violations (`/violations`)
- Detailed violation list with context
- Filter by repository, pattern, status, severity
- Bulk actions (suppress, mark resolved)
- Remediation guidance links

#### Approvals (`/approvals`)
- Pending approvals queue
- Approval history
- SLA tracking

#### Admin (`/admin`)
- User management
- Team configuration
- System settings
- Audit log viewer

### Key Components

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx       # Main dashboard
│   │   ├── repositories/
│   │   │   ├── page.tsx             # List repos
│   │   │   └── [id]/page.tsx        # Repo details
│   │   ├── patterns/
│   │   │   ├── page.tsx             # Pattern registry
│   │   │   └── [id]/page.tsx        # Pattern details
│   │   ├── violations/
│   │   │   ├── page.tsx             # Violation list
│   │   │   └── [id]/page.tsx        # Violation detail
│   │   ├── approvals/
│   │   │   └── page.tsx             # Approval queue
│   │   └── admin/
│   │       ├── page.tsx             # Admin dashboard
│   │       ├── users/page.tsx
│   │       ├── teams/page.tsx
│   │       └── settings/page.tsx
│   ├── api/
│   │   ├── admin/                   # Protected admin endpoints
│   │   └── public/                  # Public API endpoints
│   └── layout.tsx
├── components/
│   ├── dashboard/                   # Dashboard components
│   ├── repositories/                # Repo management
│   ├── patterns/                    # Pattern management
│   ├── violations/                  # Violation display
│   ├── approvals/                   # Approval workflow
│   └── ui/                          # Shadcn UI components
├── lib/
│   ├── api-client.ts               # API request wrapper
│   ├── scanning/
│   │   ├── regex-detector.ts       # Regex-based detection
│   │   ├── ast-detector.ts         # AST-based detection
│   │   └── violation-aggregator.ts
│   ├── approval/
│   │   ├── resend-client.ts        # Email approvals
│   │   ├── slack-client.ts         # Slack approvals
│   │   └── approval-router.ts
│   └── db.ts                       # D1 database client
└── types/
    ├── patterns.ts
    ├── violations.ts
    ├── approvals.ts
    └── users.ts
```

---

## Detection Methods

### Method 1: Regex-Based Detection
**Use Case**: Simple pattern matching (missing headers, imports, etc.)

**Characteristics**:
- Fast execution (<1 second per file)
- Good for text-based violations
- Limited context awareness

**Example**:
```typescript
// Detect missing CF Access headers in Python httpx
const pattern = /httpx\.AsyncClient(?!.*CF-Access-Client-Id)/s;
const violations = [];
for (const match of content.matchAll(pattern)) {
  violations.push({
    file: file.path,
    line: content.substring(0, match.index).split('\n').length,
    snippet: match[0]
  });
}
```

### Method 2: AST-Based Detection
**Use Case**: Structural violations (missing error handling, wrong imports, etc.)

**Characteristics**:
- Language-specific parsing (TypeScript, Python, Go, etc.)
- Slower but more accurate
- Can understand code structure and semantics
- Detect complex patterns

**Example**:
```typescript
// Detect async functions without try-catch
import { parse } from '@babel/parser';
import { traverse } from '@babel/traverse';

const ast = parse(content, {sourceType: 'module'});
traverse(ast, {
  FunctionDeclaration(path) {
    if (path.node.async && !hasTryBlock(path.node.body)) {
      violations.push({
        file: file.path,
        line: path.node.loc.start.line,
        type: 'missing-error-handling'
      });
    }
  }
});
```

### Method 3: Custom Detection
**Use Case**: Complex patterns requiring custom logic

**Characteristics**:
- Maximum flexibility
- Requires JavaScript/TypeScript code execution
- Slowest but most powerful

**Implementation**:
```typescript
// Custom detection stored in D1 and executed dynamically
const customDetector = pattern.detection_config.code;
const violations = await executeDetectionCode(customDetector, {
  file,
  content,
  ast
});
```

---

## Approval Workflow Integration

### Email Approval Flow (Resend)

```
1. Violation created/remediation submitted
   ↓
2. Check approval config: approval_method = 'email'
   ↓
3. Render email template with:
   - Violation details
   - Remediation summary
   - Approve/Reject links (with one-time tokens)
   ↓
4. Send via Resend API
   ↓
5. Approver clicks link
   ↓
6. Lambda/Worker processes approval:
   - Validates token
   - Updates violation.approval_status
   - Logs to audit_log
   ↓
7. Dashboard reflects status change
```

### Slack Approval Flow (human-input MCP)

```
1. Violation created/remediation submitted
   ↓
2. Check approval config: approval_method = 'slack'
   ↓
3. Prepare message via human-input MCP:
   - Violation summary
   - Remediation link
   - Approve/Reject buttons
   ↓
4. Send to configured Slack user/channel
   ↓
5. Approver clicks button
   ↓
6. human-input MCP receives response
   ↓
7. Update violation.approval_status
   ↓
8. Dashboard reflects status change
```

---

## Security Considerations

### Authentication
- OAuth via GitHub, Google, or Cloudflare Access
- Session management with Cloudflare Workers
- Protected API endpoints require valid session

### Authorization
- Role-based access control (RBAC)
  - Admin: Full access
  - Reviewer: Can approve/reject
  - Developer: Can view/remediate own repos
  - Viewer: Read-only access
- Repository-level permissions (team-based)

### Data Protection
- GitHub PATs encrypted and stored in Vault (via ExternalSecrets)
- D1 encrypted at rest
- HTTPS for all communication
- Audit log tracks all actions

### Secrets Management
- GitHub PATs stored in Vault, referenced by ID
- Email credentials (Resend) not stored in D1
- Slack tokens from human-input MCP (no storage)
- D1 connection via Cloudflare Workers (no exposed credentials)

---

## Performance Optimization

### Caching Strategy
- Cache pattern list (update via webhook)
- Cache repository configuration (TTL: 1 hour)
- Cache scan results (TTL: 24 hours)
- Invalidate on pattern/repo changes

### Parallel Processing
- Scan multiple patterns concurrently
- Process multiple repositories in parallel
- Batch violation creation (batch insert)

### Database Optimization
- Indexes on frequently queried fields
- Pagination for large result sets
- Denormalization for common queries (e.g., severity)

### Asset Optimization
- Code splitting by page
- Lazy load heavy components (pattern editor)
- Image optimization (Cloudflare Images)
- CSS/JS minification

---

## Scalability Path

### Phase 1 (MVP)
- Single-region Cloudflare Workers
- D1 SQLite database (2GB limit)
- Manual scanning trigger

### Phase 2
- Add scheduled scanning (Cron)
- Expand to 100+ repositories
- Add caching layer for performance

### Phase 3
- Multi-region workers (for low latency)
- Consider D1 database federation (multiple zones)
- Add asynchronous job queue for large scans
- Implement webhook-triggered scanning

### Future
- Custom detection code execution sandbox
- ML-based violation classification
- Predictive remediation suggestions

---

## Deployment Architecture

### Development
```
Local Development
  ├─ Next.js dev server (npm run dev)
  ├─ D1 local database (wrangler d1)
  └─ Local testing
```

### Staging
```
Staging Environment (Cloudflare)
  ├─ nextjs-saas-template staging branch
  ├─ D1 staging database
  └─ GitHub staging OAuth app
```

### Production
```
Production Environment (Cloudflare)
  ├─ nextjs-saas-template main branch
  ├─ D1 production database (with backups)
  ├─ GitHub production OAuth app
  ├─ Resend API (production)
  └─ human-input MCP (production)
```

---

**Document Version**: 1.0
**Last Updated**: 2025-12-08
**Next Review**: After Phase 1 architecture review
